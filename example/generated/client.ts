// WebSocket client generated from AsyncAPI schema
import { AsyncApiMessage, PingMessage, PongMessage, ErrorMessage } from './types';

// Message handler types for client
export type PongHandler = (message: PongMessage) => void | Promise<void>;
export type ErrorHandler = (message: ErrorMessage) => void | Promise<void>;

// WebSocket client implementation
export class AsyncApiWebSocketClient {
  private ws?: WebSocket;
  private url: string;
  private handlers = new Map<string, Function>();

  constructor(url?: string) {
    this.url = url || 'ws://localhost:5001/ws';
  }

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.url);
      
      this.ws.onopen = () => {
        console.log("WebSocket connected");
        resolve();
      };
      
      this.ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        reject(error);
      };
      
      this.ws.onmessage = (event) => {
        this.handleMessage(event.data);
      };
      
      this.ws.onclose = () => {
        console.log("WebSocket disconnected");
      };
    });
  }

  private handleMessage(data: string): void {
    let message: AsyncApiMessage;
    
    try {
      message = JSON.parse(data);
    } catch (err) {
      console.error("Failed to parse message:", err);
      return;
    }
    
    // Call appropriate handler based on message type
    const handler = this.handlers.get(message.type);
    if (handler) {
      handler(message);
    } else {
      console.warn(`No handler registered for message type: ${message.type}`);
    }
  }

  onPong(handler: PongHandler): void {
    this.handlers.set('pong', handler);
  }

  onError(handler: ErrorHandler): void {
    this.handlers.set('error', handler);
  }

  sendPing(message: PingMessage): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error("WebSocket is not connected");
    }
    this.ws.send(JSON.stringify(message));
  }

  sendError(message: ErrorMessage): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error("WebSocket is not connected");
    }
    this.ws.send(JSON.stringify(message));
  }

  close(): void {
    if (this.ws) {
      this.ws.close();
    }
  }

  get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}