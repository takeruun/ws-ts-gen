// Example WebSocket server implementation
import { AsyncApiWebSocketServer } from './server';
import { MessageHandlerRegistry } from './handlers';
import { DefaultPingHandler } from './handlers';
import { DefaultErrorHandler } from './handlers';

// Initialize handler registry
const handlerRegistry = new MessageHandlerRegistry();

// Register message handlers
handlerRegistry.registerPing(new DefaultPingHandler());
handlerRegistry.registerError(new DefaultErrorHandler());

// Create and start server
const server = new AsyncApiWebSocketServer(5001, handlerRegistry);
console.log('WebSocket server started on port 5001');

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down server...');
  server.close();
  process.exit(0);
});