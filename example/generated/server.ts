// WebSocket server generated from AsyncAPI schema
import { WebSocketServer, WebSocket } from 'ws';
import { AsyncApiMessage, PingMessage, PongMessage, ErrorMessage } from './types';
import { MessageHandlerRegistry, PingHandler, ErrorHandler } from './handlers';


// WebSocket server implementation
export class AsyncApiWebSocketServer {
  private wss: WebSocketServer;
  private handlerRegistry: MessageHandlerRegistry;

  constructor(
    port: number,
    handlerRegistry: MessageHandlerRegistry
  ) {
    this.wss = new WebSocketServer({ port });
    this.handlerRegistry = handlerRegistry;
    this.setupServer();
  }

  private setupServer(): void {
    this.wss.on('connection', (ws: WebSocket) => {
      console.log('New WebSocket connection established');
      
      ws.on('message', async (data: Buffer) => {
        await this.handleMessage(ws, data);
      });
      
      ws.on('close', () => {
        console.log('WebSocket connection closed');
      });
      
      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
      });
      
      // Send initial message on connection
      ws.send(JSON.stringify({ type: 'connected', timestamp: Date.now() }));
    });
  }

  private async handleMessage(ws: WebSocket, data: Buffer): Promise<void> {
    let parsedData: unknown;
    
    try {
      parsedData = JSON.parse(data.toString());
    } catch (err) {
      ws.send(JSON.stringify({
        type: 'error',
        error: 'Invalid JSON',
        details: { parseError: err instanceof Error ? err.message : 'Unknown parse error' }
      }));
      return;
    }
    
    // Check if parsed data has a type property
    if (!parsedData || typeof parsedData !== 'object' || !('type' in parsedData)) {
      ws.send(JSON.stringify({ type: 'error', error: 'Invalid message format' }));
      return;
    }
    
    const message = parsedData as { type: string; payload?: unknown };
    
    // Validate and handle message based on type
    switch (message.type) {
      case 'ping':
        const pingHandler = this.handlerRegistry.getHandler<PingHandler>('ping');
        if (pingHandler) {
          // Pass the parsed message to the handler
          await pingHandler.handle(ws, message as PingMessage);
        } else {
          console.warn('No handler registered for message type: ping');
        }
        break;
      case 'error':
        const errorHandler = this.handlerRegistry.getHandler<ErrorHandler>('error');
        if (errorHandler) {
          // Pass the parsed message to the handler
          await errorHandler.handle(ws, message as ErrorMessage);
        } else {
          console.warn('No handler registered for message type: error');
        }
        break;
      default:
        ws.send(JSON.stringify({ type: 'error', error: 'Unknown message type', details: { type: message.type } }));
    }
  }

  public close(): void {
    this.wss.close();
  }
}