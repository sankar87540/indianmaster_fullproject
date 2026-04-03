// Package wschat provides a lightweight WebSocket hub for real-time chat events.
// The hub maps each authenticated user to a single active connection.
// Events are broadcast per-user; participants subscribe to threads they care about.
package wschat

import (
	"encoding/json"
	"sync"
	"time"

	"github.com/gorilla/websocket"
)

const (
	writeWait      = 10 * time.Second
	pongWait       = 60 * time.Second
	pingPeriod     = (pongWait * 9) / 10
	maxMessageSize = 4096
)

// InboundMsg is a control message sent from client → server over the WebSocket.
type InboundMsg struct {
	Type     string `json:"type"`
	ThreadID string `json:"thread_id,omitempty"`
}

// OutboundMsg is an event pushed from server → client over the WebSocket.
type OutboundMsg struct {
	Type     string      `json:"type"`
	ThreadID string      `json:"thread_id,omitempty"`
	Message  interface{} `json:"message,omitempty"`
	IsOnline *bool       `json:"is_online,omitempty"`
}

// Client represents one connected WebSocket user.
type Client struct {
	hub     *Hub
	userID  string
	conn    *websocket.Conn
	send    chan []byte
	threads map[string]bool
	tmu     sync.Mutex
}

// Hub keeps a registry of connected clients keyed by userID.
// Only the latest connection per user is kept active — a new connection
// for the same user closes and replaces the old one.
type Hub struct {
	clients map[string]*Client
	mu      sync.RWMutex
}

// NewHub creates and returns a new Hub ready for use.
func NewHub() *Hub {
	return &Hub{clients: make(map[string]*Client)}
}

// Register creates a Client for userID and adds it to the hub.
// If a previous connection exists for the same user it is closed gracefully
// (WritePump receives a closed channel and sends a WebSocket CloseMessage).
func (h *Hub) Register(userID string, conn *websocket.Conn) *Client {
	c := &Client{
		hub:     h,
		userID:  userID,
		conn:    conn,
		send:    make(chan []byte, 256),
		threads: make(map[string]bool),
	}
	h.mu.Lock()
	if old, ok := h.clients[userID]; ok {
		close(old.send) // signals WritePump to exit
	}
	h.clients[userID] = c
	h.mu.Unlock()
	return c
}

// unregister removes c from the hub only when c is still the active client
// for that userID (avoids accidentally removing a replacement connection).
func (h *Hub) unregister(c *Client) {
	h.mu.Lock()
	if existing, ok := h.clients[c.userID]; ok && existing == c {
		delete(h.clients, c.userID)
	}
	h.mu.Unlock()
}

// BroadcastToUser delivers msg to the connected client for userID.
// If the user is not connected, or their send buffer is full, the call is a no-op.
func (h *Hub) BroadcastToUser(userID string, msg OutboundMsg) {
	h.mu.RLock()
	c, ok := h.clients[userID]
	h.mu.RUnlock()
	if !ok {
		return
	}
	data, err := json.Marshal(msg)
	if err != nil {
		return
	}
	safeSend(c.send, data)
}

// safeSend attempts a non-blocking send on ch, recovering from the panic that
// occurs when ch was closed between the hub RUnlock and this send.
//
// This race is rare but real: BroadcastToUser releases h.mu.RLock before
// sending, so Register() can close the old client's channel in the window
// between the map lookup and the channel send.  Using recover() is the
// idiomatic Go solution when a channel's lifetime is managed by a separate
// owner (the hub) and the sender cannot hold the owner's lock during the send.
func safeSend(ch chan []byte, data []byte) {
	defer func() { recover() }() //nolint:errcheck
	select {
	case ch <- data:
	default:
		// Buffer full — drop this event rather than blocking.
	}
}

// ─── Client pump goroutines ────────────────────────────────────────────────────

// ReadPump reads control messages from the client until the connection closes.
// It must run in its own goroutine. On exit it calls unregister and closes the conn.
//
// Supported inbound message types:
//
//	subscribe   {"type":"subscribe","thread_id":"<id>"}   — start receiving events for a thread
//	unsubscribe {"type":"unsubscribe","thread_id":"<id>"} — stop receiving events for a thread
//	ping        {"type":"ping"}                           — application-level keepalive
func (c *Client) ReadPump() {
	defer func() {
		c.hub.unregister(c)
		c.conn.Close()
	}()
	c.conn.SetReadLimit(maxMessageSize)
	_ = c.conn.SetReadDeadline(time.Now().Add(pongWait))
	c.conn.SetPongHandler(func(string) error {
		return c.conn.SetReadDeadline(time.Now().Add(pongWait))
	})
	for {
		_, raw, err := c.conn.ReadMessage()
		if err != nil {
			return // closed or error — exit cleanly
		}
		var in InboundMsg
		if err := json.Unmarshal(raw, &in); err != nil {
			continue // ignore malformed frames
		}
		switch in.Type {
		case "subscribe":
			if in.ThreadID != "" {
				c.tmu.Lock()
				c.threads[in.ThreadID] = true
				c.tmu.Unlock()
				ack, _ := json.Marshal(OutboundMsg{Type: "subscribed", ThreadID: in.ThreadID})
				select {
				case c.send <- ack:
				default:
				}
			}
		case "unsubscribe":
			if in.ThreadID != "" {
				c.tmu.Lock()
				delete(c.threads, in.ThreadID)
				c.tmu.Unlock()
			}
		case "ping":
			pong, _ := json.Marshal(OutboundMsg{Type: "pong"})
			select {
			case c.send <- pong:
			default:
			}
		}
	}
}

// WritePump drains the send channel and writes text frames to the WebSocket.
// It also sends WebSocket-level ping frames to detect dead connections.
// Must run in its own goroutine.
func (c *Client) WritePump() {
	ticker := time.NewTicker(pingPeriod)
	defer func() {
		ticker.Stop()
		c.conn.Close()
	}()
	for {
		select {
		case msg, ok := <-c.send:
			_ = c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if !ok {
				// Hub closed the channel; send a clean WebSocket close frame.
				_ = c.conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}
			if err := c.conn.WriteMessage(websocket.TextMessage, msg); err != nil {
				return
			}
		case <-ticker.C:
			_ = c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if err := c.conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}
