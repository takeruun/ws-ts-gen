// Example WebSocket client implementation
import { AsyncApiWebSocketClient } from './client';

// Create and connect client
const client = new AsyncApiWebSocketClient();

// Register message handlers
client.onPong((message) => {
  console.log('Received pong:', message);
  // TODO: Implement pong handling logic
});

client.onError((message) => {
  console.log('Received error:', message);
  // TODO: Implement error handling logic
});

// Connect to server
client.connect()
  .then(() => {
    console.log("Connected to WebSocket server");
    
    // Example: Send a ping message after connecting
    // client.sendPing({ type: "ping" });
  })
  .catch((error) => {
    console.error("Failed to connect:", error);
  });

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("\nDisconnecting...");
  client.close();
  process.exit(0);
});