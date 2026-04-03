package handlers

import (
	"net/http"

	"myapp/internal/middleware"
	"myapp/internal/wschat"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
)

var wsUpgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	// Mobile clients connect from arbitrary Origins.
	// Security is enforced by JWT token validation, not the Origin header.
	CheckOrigin: func(r *http.Request) bool { return true },
}

// ChatWSHandler handles the WebSocket upgrade endpoint for real-time chat events.
type ChatWSHandler struct {
	hub *wschat.Hub
}

// NewChatWSHandler creates a ChatWSHandler backed by hub.
func NewChatWSHandler(hub *wschat.Hub) *ChatWSHandler {
	return &ChatWSHandler{hub: hub}
}

// Connect godoc
// @Summary Real-time chat WebSocket connection
// @Description Upgrades HTTP to WebSocket for real-time chat events.
// Pass the JWT via the `token` query parameter.
// After connecting, send {"type":"subscribe","thread_id":"<id>"} to receive events for a thread.
// @Tags Chat
// @Param token query string true "JWT bearer token"
// @Router /chat/ws [get]
func (h *ChatWSHandler) Connect(c *gin.Context) {
	// Auth: JWT via query param — WebSocket clients cannot set HTTP headers
	// during the upgrade handshake in React Native's built-in WebSocket API.
	token := c.Query("token")
	if token == "" {
		c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"message": "missing token query parameter",
		})
		return
	}
	userID, _, err := middleware.ValidateToken(token)
	if err != nil {
		c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"message": "invalid or expired token",
		})
		return
	}

	conn, err := wsUpgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		// Upgrader already wrote a 400 Bad Request to the client; nothing more to do.
		return
	}

	client := h.hub.Register(userID, conn)
	go client.WritePump()
	client.ReadPump() // blocks until the connection is closed
}
