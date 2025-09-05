import { AsyncAPIDocument } from '../types/asyncapi';
import { writeFileSync } from 'fs';
import path from 'path';

export class ClientGenerator {
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
    const serverInfo = Object.values(doc.servers || {})[0] || { host: 'localhost', port: 8080 };
    const host = serverInfo.host || 'localhost';
    const port = serverInfo.port || 8080;
    const pathname = serverInfo.pathname || '';
    const protocol = serverInfo.protocol === 'wss' ? 'wss' : 'ws';
    
    const client: string[] = [
      '// WebSocket client generated from AsyncAPI schema',
      "import { AsyncApiMessage",
    ];
    
    // Import all message types
    const schemaTypes = Object.keys(doc.components.schemas);
    if (schemaTypes.length > 0) {
      client[client.length - 1] += ', ' + schemaTypes.join(', ');
    }
    client[client.length - 1] += " } from './types';";
    
    client.push('');
    
    // Generate message handler types for client (receive operations)
    const receiveOperations = this.getReceiveOperations(doc);
    const sendOperations = this.getSendOperations(doc);
    
    client.push('// Message handler types for client');
    receiveOperations.forEach(([msgType, msg]) => {
      const schemaName = msg.payload.$ref?.split('/').pop();
      client.push(`export type ${this.capitalize(msgType)}Handler = (message: ${schemaName}) => void | Promise<void>;`);
    });
    
    client.push('');
    client.push('// WebSocket client implementation');
    client.push('export class AsyncApiWebSocketClient {');
    client.push('  private ws?: WebSocket;');
    client.push('  private url: string;');
    client.push('  private handlers = new Map<string, Function>();');
    client.push('');
    
    // Constructor
    client.push(`  constructor(url?: string) {`);
    client.push(`    this.url = url || '${protocol}://${host}:${port}${pathname}';`);
    client.push('  }');
    client.push('');
    
    // Connection methods
    client.push('  async connect(): Promise<void> {');
    client.push('    return new Promise((resolve, reject) => {');
    client.push('      this.ws = new WebSocket(this.url);');
    client.push('      ');
    client.push('      this.ws.onopen = () => {');
    client.push('        console.log("WebSocket connected");');
    client.push('        resolve();');
    client.push('      };');
    client.push('      ');
    client.push('      this.ws.onerror = (error) => {');
    client.push('        console.error("WebSocket error:", error);');
    client.push('        reject(error);');
    client.push('      };');
    client.push('      ');
    client.push('      this.ws.onmessage = (event) => {');
    client.push('        this.handleMessage(event.data);');
    client.push('      };');
    client.push('      ');
    client.push('      this.ws.onclose = () => {');
    client.push('        console.log("WebSocket disconnected");');
    client.push('      };');
    client.push('    });');
    client.push('  }');
    client.push('');
    
    // Message handling
    client.push('  private handleMessage(data: string): void {');
    client.push('    let message: AsyncApiMessage;');
    client.push('    ');
    client.push('    try {');
    client.push('      message = JSON.parse(data);');
    client.push('    } catch (err) {');
    client.push('      console.error("Failed to parse message:", err);');
    client.push('      return;');
    client.push('    }');
    client.push('    ');
    client.push('    // Call appropriate handler based on message type');
    client.push('    const handler = this.handlers.get(message.type);');
    client.push('    if (handler) {');
    client.push('      handler(message);');
    client.push('    } else {');
    client.push('      console.warn(`No handler registered for message type: ${message.type}`);');
    client.push('    }');
    client.push('  }');
    client.push('');
    
    // Handler registration methods
    receiveOperations.forEach(([msgType, msg]) => {
      client.push(`  on${this.capitalize(msgType)}(handler: ${this.capitalize(msgType)}Handler): void {`);
      client.push(`    this.handlers.set('${msgType}', handler);`);
      client.push('  }');
      client.push('');
    });
    
    // Send methods for client (send operations from client perspective)
    sendOperations.forEach(([msgType, msg]) => {
      const schemaName = msg.payload.$ref?.split('/').pop();
      client.push(`  send${this.capitalize(msgType)}(message: ${schemaName}): void {`);
      client.push('    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {');
      client.push('      throw new Error("WebSocket is not connected");');
      client.push('    }');
      client.push('    this.ws.send(JSON.stringify(message));');
      client.push('  }');
      client.push('');
    });
    
    // Close method
    client.push('  close(): void {');
    client.push('    if (this.ws) {');
    client.push('      this.ws.close();');
    client.push('    }');
    client.push('  }');
    client.push('');
    
    // Connection status
    client.push('  get isConnected(): boolean {');
    client.push('    return this.ws?.readyState === WebSocket.OPEN;');
    client.push('  }');
    client.push('}');
    
    const outputPath = path.join(outputDir, 'client.ts');
    writeFileSync(outputPath, client.join('\n'));
    console.log(`Generated client at: ${outputPath}`);
  }
}