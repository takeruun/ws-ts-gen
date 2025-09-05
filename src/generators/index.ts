import { AsyncAPIDocument } from '../types/asyncapi';
import { writeFileSync } from 'fs';
import path from 'path';

export class IndexGenerator {
  private capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
  
  private getSendOperations(doc: AsyncAPIDocument): Array<[string, any]> {
    const sendMessages: Array<[string, any]> = [];
    
    if (doc.operations) {
      Object.entries(doc.operations).forEach(([opName, operation]) => {
        if (operation.action === 'send' && operation.messages) {
          operation.messages.forEach(msgRef => {
            // Extract message name from reference
            const msgPath = msgRef.$ref?.split('/').pop();
            if (msgPath && doc.components.messages[msgPath]) {
              sendMessages.push([msgPath, doc.components.messages[msgPath]]);
            }
          });
        }
      });
    }
    
    // Remove duplicates
    const uniqueMessages = new Map();
    sendMessages.forEach(([msgType, message]) => {
      uniqueMessages.set(msgType, message);
    });
    
    return Array.from(uniqueMessages.entries());
  }
  
  generate(doc: AsyncAPIDocument, outputDir: string): void {
    const serverInfo = Object.values(doc.servers || {})[0] || { port: 8080 };
    const port = serverInfo.port || 8080;
    
    const index: string[] = [
      '// Example WebSocket server implementation',
      "import { AsyncApiWebSocketServer } from './server';",
      "import { MessageHandlerRegistry } from './handlers';",
    ];
    
    const sendOperations = this.getSendOperations(doc);
    
    // Import default handlers only for send operations
    sendOperations.forEach(([msgType]) => {
      const handlerName = `Default${this.capitalize(msgType)}Handler`;
      index.push(`import { ${handlerName} } from './handlers';`);
    });
    
    index.push('');
    index.push('// Initialize handler registry');
    index.push('const handlerRegistry = new MessageHandlerRegistry();');
    index.push('');
    index.push('// Register message handlers');
    
    sendOperations.forEach(([msgType]) => {
      const handlerName = `Default${this.capitalize(msgType)}Handler`;
      index.push(`handlerRegistry.register${this.capitalize(msgType)}(new ${handlerName}());`);
    });
    
    index.push('');
    index.push('// Create and start server');
    index.push(`const server = new AsyncApiWebSocketServer(${port}, handlerRegistry);`);
    index.push(`console.log('WebSocket server started on port ${port}');`);
    index.push('');
    index.push('// Graceful shutdown');
    index.push(`process.on('SIGINT', () => {`);
    index.push('  console.log(\'\\nShutting down server...\');');
    index.push('  server.close();');
    index.push('  process.exit(0);');
    index.push('});');
    
    const outputPath = path.join(outputDir, 'index.ts');
    writeFileSync(outputPath, index.join('\n'));
    console.log(`Generated index at: ${outputPath}`);
  }
}