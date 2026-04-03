// ── Real-time chat WebSocket service ──────────────────────────────────────────
//
// Singleton that manages a single WebSocket connection to the backend chat hub.
// Multiple screens/components can attach event handlers without owning the conn.
//
// Usage:
//   chatSocket.connect()                     // open (or reuse) the connection
//   chatSocket.subscribeThread(threadId)     // receive events for a thread
//   const off = chatSocket.addHandler(fn)    // listen; call off() to detach
//   chatSocket.unsubscribeThread(threadId)   // stop receiving events
//   chatSocket.disconnect()                  // close + stop reconnecting

import { getAuthToken } from '@/utils/storage';

const BASE_URL: string = (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8080');

// Reconnect back-off delays (ms): 1 s → 2 s → 5 s → 10 s → 30 s (capped)
const RECONNECT_DELAYS_MS = [1000, 2000, 5000, 10000, 30000];

// ── Event types pushed from server → client ──────────────────────────────────

export interface ChatSocketMessage {
    id: string;
    threadId: string;
    senderId: string;
    messageText: string;
    attachmentUrls: string[];
    isRead: boolean;
    readAt: string | null;
    deliveredAt: string | null;
    replyToMessageId: string | null;
    replyToText: string | null;
    replyToSenderId: string | null;
    createdAt: string;
}

export type ChatSocketEvent =
    | { type: 'new_message'; thread_id: string; message: ChatSocketMessage }
    | { type: 'message_read'; thread_id: string }
    | { type: 'subscribed'; thread_id: string }
    | { type: 'pong' };

type EventHandler = (event: ChatSocketEvent) => void;

// ── Singleton class ───────────────────────────────────────────────────────────

class ChatSocketService {
    private ws: WebSocket | null = null;
    private handlers = new Set<EventHandler>();
    private reconnectAttempt = 0;
    private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    private isConnecting = false;
    // active=true while we want the connection alive; set to false on disconnect()
    private active = false;
    // track subscribed threads so we can re-subscribe after reconnection
    private subscribedThreads = new Set<string>();

    // ── Public API ────────────────────────────────────────────────────────────

    /**
     * Open the WebSocket connection. Idempotent — safe to call multiple times.
     * If already open or connecting, this is a no-op.
     */
    connect(): void {
        this.active = true;
        if (this.ws?.readyState === WebSocket.OPEN || this.isConnecting) return;
        this._doConnect();
    }

    /**
     * Close the connection and stop all reconnection attempts.
     * All thread subscriptions are cleared.
     */
    disconnect(): void {
        this.active = false;
        if (this.reconnectTimer !== null) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }
        this.ws?.close();
        this.ws = null;
        this.subscribedThreads.clear();
        this.reconnectAttempt = 0;
    }

    /**
     * Subscribe to real-time events for threadId.
     * Tracked internally so subscriptions are replayed after reconnection.
     */
    subscribeThread(threadId: string): void {
        this.subscribedThreads.add(threadId);
        this._rawSend({ type: 'subscribe', thread_id: threadId });
    }

    /**
     * Stop receiving events for threadId.
     */
    unsubscribeThread(threadId: string): void {
        this.subscribedThreads.delete(threadId);
        this._rawSend({ type: 'unsubscribe', thread_id: threadId });
    }

    /**
     * Register an event handler. Returns a cleanup function that removes it.
     */
    addHandler(handler: EventHandler): () => void {
        this.handlers.add(handler);
        return () => this.handlers.delete(handler);
    }

    /** True when the WebSocket is in OPEN state. */
    get isConnected(): boolean {
        return this.ws?.readyState === WebSocket.OPEN;
    }

    // ── Internal ──────────────────────────────────────────────────────────────

    private async _doConnect(): Promise<void> {
        this.isConnecting = true;
        try {
            const token = await getAuthToken();
            if (!token) {
                // Not logged in yet — do not attempt connection
                this.isConnecting = false;
                return;
            }
            // Convert http(s):// base URL to ws(s)://
            const wsBase = BASE_URL.replace(/^http/, 'ws');
            const url = `${wsBase}/api/v1/chat/ws?token=${encodeURIComponent(token)}`;

            const ws = new WebSocket(url);
            this.ws = ws;

            ws.onopen = () => {
                this.isConnecting = false;
                this.reconnectAttempt = 0;
                // Re-subscribe to all threads tracked before this connection
                for (const tid of this.subscribedThreads) {
                    this._rawSend({ type: 'subscribe', thread_id: tid });
                }
            };

            ws.onmessage = (evt) => {
                try {
                    const data = JSON.parse(evt.data as string) as ChatSocketEvent;
                    for (const h of this.handlers) h(data);
                } catch { /* ignore malformed frames */ }
            };

            ws.onerror = () => {
                // onerror always precedes onclose; let onclose handle reconnect
                this.isConnecting = false;
            };

            ws.onclose = () => {
                this.isConnecting = false;
                this.ws = null;
                if (this.active) this._scheduleReconnect();
            };
        } catch {
            this.isConnecting = false;
            if (this.active) this._scheduleReconnect();
        }
    }

    private _scheduleReconnect(): void {
        const delay = RECONNECT_DELAYS_MS[
            Math.min(this.reconnectAttempt, RECONNECT_DELAYS_MS.length - 1)
        ];
        this.reconnectAttempt++;
        this.reconnectTimer = setTimeout(() => this._doConnect(), delay);
    }

    private _rawSend(data: object): void {
        if (this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(data));
        }
    }
}

// Export a single shared instance used across the whole app
export const chatSocket = new ChatSocketService();
