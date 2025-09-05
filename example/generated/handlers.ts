// WebSocket message handlers with dependency injection
import { AsyncApiMessage, PingMessage, PongMessage, ErrorMessage } from './types';
import { WebSocket } from 'ws';

// Handler interface for each message type
export interface PingHandler {
  handle(ws: WebSocket, message: PingMessage): void | Promise<void>;
}

export interface ErrorHandler {
  handle(ws: WebSocket, message: ErrorMessage): void | Promise<void>;
}

// Handler registry for dependency injection
type MessageHandler = PingHandler | ErrorHandler;

export class MessageHandlerRegistry {
  private handlers = new Map<string, MessageHandler>();

  registerPing(handler: PingHandler): void {
    this.handlers.set('ping', handler);
  }

  registerError(handler: ErrorHandler): void {
    this.handlers.set('error', handler);
  }

  getHandler<T extends MessageHandler>(messageType: string): T | undefined {
    return this.handlers.get(messageType) as T | undefined;
  }
}

// Default handler implementations

export class DefaultPingHandler implements PingHandler {
  async handle(ws: WebSocket, message: PingMessage): Promise<void> {
    console.log('Handling ping message:', message);
    // TODO: Implement ping handling logic
    ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
  }
}

export class DefaultErrorHandler implements ErrorHandler {
  async handle(ws: WebSocket, message: ErrorMessage): Promise<void> {
    console.log('Handling error message:', message);
    // TODO: Implement error handling logic
    // Error messages typically don't send a response
  }
}