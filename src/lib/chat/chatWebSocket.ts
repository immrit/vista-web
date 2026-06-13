'use client';

import { fetchChatWebSocketConnection } from '@/lib/chat/chatApi';

export type ChatWsConnectionState = 'disconnected' | 'connecting' | 'connected';

export type ChatWsEventType =
  | 'connected'
  | 'new_message'
  | 'message_updated'
  | 'message_deleted'
  | 'typing'
  | 'read_receipt'
  | 'reaction_updated'
  | 'conversation_updated'
  | 'kicked';

export interface ChatWsEvent {
  type: ChatWsEventType;
  data?: Record<string, unknown>;
  user_id?: string;
}

type EventListener = (event: ChatWsEvent) => void;
type StateListener = (state: ChatWsConnectionState) => void;

class ChatWebSocketManager {
  private ws: WebSocket | null = null;
  private state: ChatWsConnectionState = 'disconnected';
  private listeners = new Set<EventListener>();
  private stateListeners = new Set<StateListener>();
  private running = false;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private backoffMs = 1000;

  subscribe(listener: EventListener): () => void {
    this.listeners.add(listener);
    this.ensureStarted();
    return () => this.listeners.delete(listener);
  }

  subscribeState(listener: StateListener): () => void {
    this.stateListeners.add(listener);
    listener(this.state);
    this.ensureStarted();
    return () => this.stateListeners.delete(listener);
  }

  getState(): ChatWsConnectionState {
    return this.state;
  }

  sendTyping(conversationId: string): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    this.ws.send(JSON.stringify({ type: 'typing', conversation_id: conversationId }));
  }

  private connecting = false;

  stop(): void {
    this.running = false;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.ws?.close();
    this.ws = null;
    this.setState('disconnected');
  }

  private ensureStarted(): void {
    if (this.running) return;
    this.running = true;
    void this.connectLoop();
  }

  private setState(next: ChatWsConnectionState): void {
    if (this.state === next) return;
    this.state = next;
    this.stateListeners.forEach(listener => listener(next));
  }

  private emit(event: ChatWsEvent): void {
    this.listeners.forEach(listener => listener(event));
  }

  private scheduleReconnect(): void {
    if (!this.running || this.connecting) return;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      void this.connectLoop();
    }, this.backoffMs);
    this.backoffMs = Math.min(this.backoffMs * 2, 30000);
  }

  private async connectLoop(): Promise<void> {
    if (this.connecting) return;
    this.connecting = true;

    while (this.running) {
      this.setState('connecting');
      try {
        const { url, protocols } = await fetchChatWebSocketConnection();
        await this.openSocket(url, protocols);
        this.backoffMs = 1000;
        this.connecting = false;
        return;
      } catch {
        this.setState('disconnected');
        await new Promise<void>(resolve => {
          this.reconnectTimer = setTimeout(resolve, this.backoffMs);
        });
        this.backoffMs = Math.min(this.backoffMs * 2, 30000);
      }
    }

    this.connecting = false;
  }

  private openSocket(url: string, protocols: string[]): Promise<void> {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(url, protocols);
      this.ws = ws;

      ws.onopen = () => {
        this.setState('connected');
        resolve();
      };

      ws.onmessage = event => {
        try {
          const parsed = JSON.parse(String(event.data)) as Record<string, unknown>;
          const type = String(parsed.type ?? '') as ChatWsEventType;
          const data = (parsed.data ?? parsed) as Record<string, unknown> | undefined;
          this.emit({ type, data });
        } catch {
          // ignore malformed frames
        }
      };

      ws.onerror = () => {
        reject(new Error('ws_error'));
      };

      ws.onclose = () => {
        this.ws = null;
        if (!this.running) {
          this.setState('disconnected');
          return;
        }
        this.setState('disconnected');
        this.scheduleReconnect();
      };
    });
  }
}

export const chatWebSocket = typeof window !== 'undefined' ? new ChatWebSocketManager() : null;

export function getChatWebSocket(): ChatWebSocketManager | null {
  return chatWebSocket;
}
