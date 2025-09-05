import { AsyncAPIDocument } from '../types/asyncapi';
import { writeFileSync } from 'fs';
import path from 'path';

export class ClientIndexGenerator {
  private capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
  
  private getReceiveOperations(doc: AsyncAPIDocument): Array<[string, any]> {
    const receiveMessages: Array<[string, any]> = [];
    
    if (doc.operations) {
      Object.entries(doc.operations).forEach(([opName, operation]) => {
        if (operation.action === 'receive' && operation.messages) {
          operation.messages.forEach(msgRef => {
            // Extract message name from reference
            const msgPath = msgRef.$ref?.split('/').pop();
            if (msgPath && doc.components.messages[msgPath]) {
              receiveMessages.push([msgPath, doc.components.messages[msgPath]]);
            }
          });
        }
      });
    }
    
    // Remove duplicates
    const uniqueMessages = new Map();
    receiveMessages.forEach(([msgType, message]) => {
      uniqueMessages.set(msgType, message);
    });
    
    return Array.from(uniqueMessages.entries());
  }

  generate(doc: AsyncAPIDocument, outputDir: string): void {
    const receiveOperations = this.getReceiveOperations(doc);
    
    const index: string[] = [
      '// Example WebSocket client implementation',
      "import { AsyncApiWebSocketClient } from './client';",
      '',
      '// Create and connect client',
      'const client = new AsyncApiWebSocketClient();',
      '',
      '// Register message handlers',
    ];
    
    receiveOperations.forEach(([msgType, msg]) => {
      index.push(`client.on${this.capitalize(msgType)}((message) => {`);
      index.push(`  console.log('Received ${msgType}:', message);`);
      index.push(`  // TODO: Implement ${msgType} handling logic`);
      index.push('});');
      index.push('');
    });
    
    index.push('// Connect to server');
    index.push('client.connect()');
    index.push('  .then(() => {');
    index.push('    console.log("Connected to WebSocket server");');
    index.push('    ');
    index.push('    // Example: Send a ping message after connecting');
    index.push('    // client.sendPing({ type: "ping" });');
    index.push('  })');
    index.push('  .catch((error) => {');
    index.push('    console.error("Failed to connect:", error);');
    index.push('  });');
    index.push('');
    index.push('// Graceful shutdown');
    index.push('process.on("SIGINT", () => {');
    index.push('  console.log("\\nDisconnecting...");');
    index.push('  client.close();');
    index.push('  process.exit(0);');
    index.push('});');
    
    const outputPath = path.join(outputDir, 'client-example.ts');
    writeFileSync(outputPath, index.join('\n'));
    console.log(`Generated client example at: ${outputPath}`);
  }
}