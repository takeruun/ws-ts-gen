import { AsyncAPIDocument } from '../types/asyncapi';
import { writeFileSync } from 'fs';
import path from 'path';

export class ServerGenerator {
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
    const server: string[] = [
      '// WebSocket server generated from AsyncAPI schema',
      "import { WebSocketServer, WebSocket } from 'ws';",
      "import { AsyncApiMessage",
    ];
    
    // Import all message types
    const schemaTypes = Object.keys(doc.components.schemas);
    const allTypes = [...schemaTypes];
    
    if (allTypes.length > 0) {
      server[server.length - 1] += ', ' + allTypes.join(', ');
    }
    server[server.length - 1] += " } from './types';";
    
    server.push("import { MessageHandlerRegistry");
    
    // Import handler interfaces only for send operations
    const sendOperations = this.getSendOperations(doc);
    const handlerInterfaces = sendOperations.map(([msgType]) => `${this.capitalize(msgType)}Handler`);
    if (handlerInterfaces.length > 0) {
      server[server.length - 1] += ', ' + handlerInterfaces.join(', ');
    }
    server[server.length - 1] += " } from './handlers';";
    
    server.push('');
    
    // Note: Type guards are commented out as payload validation is not required
    // If you need payload validation, uncomment the following section:
    /*
    server.push('// Type guards for message validation');
    Object.entries(doc.components.schemas).forEach(([schemaName, schema]) => {
      server.push(this.generateTypeGuard(schemaName, schema));
    });
    */
    
    // Generate server class
    server.push('\n// WebSocket server implementation');
    server.push('export class AsyncApiWebSocketServer {');
    server.push('  private wss: WebSocketServer;');
    server.push('  private handlerRegistry: MessageHandlerRegistry;');
    server.push('');
    server.push('  constructor(');
    server.push('    port: number,');
    server.push('    handlerRegistry: MessageHandlerRegistry');
    server.push('  ) {');
    server.push('    this.wss = new WebSocketServer({ port });');
    server.push('    this.handlerRegistry = handlerRegistry;');
    server.push('    this.setupServer();');
    server.push('  }');
    server.push('');
    server.push('  private setupServer(): void {');
    server.push(`    this.wss.on('connection', (ws: WebSocket) => {`);
    server.push('      console.log(\'New WebSocket connection established\');');
    server.push('      ');
    server.push(`      ws.on('message', async (data: Buffer) => {`);
    server.push('        await this.handleMessage(ws, data);');
    server.push('      });');
    server.push('      ');
    server.push(`      ws.on('close', () => {`);
    server.push('        console.log(\'WebSocket connection closed\');');
    server.push('      });');
    server.push('      ');
    server.push(`      ws.on('error', (error) => {`);
    server.push('        console.error(\'WebSocket error:\', error);');
    server.push('      });');
    
    // Add initial connection message if needed
    if (doc.operations) {
      const receiveOps = Object.entries(doc.operations)
        .filter(([_, op]) => op.action === 'receive')
        .map(([_, op]) => op);
      if (receiveOps.length > 0) {
        server.push('      ');
        server.push('      // Send initial message on connection');
        server.push(`      ws.send(JSON.stringify({ type: 'connected', timestamp: Date.now() }));`);
      }
    }
    
    server.push('    });');
    server.push('  }');
    server.push('');
    
    // Generate message handler
    server.push('  private async handleMessage(ws: WebSocket, data: Buffer): Promise<void> {');
    server.push('    let parsedData: unknown;');
    server.push('    ');
    server.push('    try {');
    server.push('      parsedData = JSON.parse(data.toString());');
    server.push('    } catch (err) {');
    server.push(`      ws.send(JSON.stringify({`);
    server.push(`        type: 'error',`);
    server.push(`        error: 'Invalid JSON',`);
    server.push(`        details: { parseError: err instanceof Error ? err.message : 'Unknown parse error' }`);
    server.push(`      }));`);
    server.push('      return;');
    server.push('    }');
    server.push('    ');
    server.push('    // Check if parsed data has a type property');
    server.push('    if (!parsedData || typeof parsedData !== \'object\' || !(\'type\' in parsedData)) {');
    server.push(`      ws.send(JSON.stringify({ type: 'error', error: 'Invalid message format' }));`);
    server.push('      return;');
    server.push('    }');
    server.push('    ');
    server.push('    const message = parsedData as { type: string; payload?: unknown };');
    server.push('    ');
    server.push('    // Validate and handle message based on type');
    server.push('    switch (message.type) {');
    
    // Only handle messages that are sent to the server (action: send)
    sendOperations.forEach(([msgType, msg]) => {
      const schemaName = msg.payload.$ref?.split('/').pop();
      server.push(`      case '${msgType}':`);
      server.push(`        const ${msgType}Handler = this.handlerRegistry.getHandler<${this.capitalize(msgType)}Handler>('${msgType}');`);
      server.push(`        if (${msgType}Handler) {`);
      server.push(`          // Pass the parsed message to the handler`);
      server.push(`          await ${msgType}Handler.handle(ws, message as ${schemaName});`);
      server.push('        } else {');
      server.push(`          console.warn('No handler registered for message type: ${msgType}');`);
      server.push('        }');
      server.push('        break;');
    });
    
    server.push('      default:');
    server.push(`        ws.send(JSON.stringify({ type: 'error', error: 'Unknown message type', details: { type: message.type } }));`);
    server.push('    }');
    server.push('  }');
    server.push('');
    server.push('  public close(): void {');
    server.push('    this.wss.close();');
    server.push('  }');
    server.push('}');
    
    const outputPath = path.join(outputDir, 'server.ts');
    writeFileSync(outputPath, server.join('\n'));
    console.log(`Generated server at: ${outputPath}`);
  }
  
  private generateTypeGuard(name: string, schema: any): string {
    const lines: string[] = [`function is${name}(obj: any): obj is ${name} {`];
    lines.push(`  if (!obj || typeof obj !== 'object') return false;`);
    
    if (schema.required && schema.required.length > 0) {
      schema.required.forEach((field: string) => {
        const prop = schema.properties[field];
        if (prop.type === 'string') {
          if (prop.const) {
            lines.push(`  if (obj.${field} !== '${prop.const}') return false;`);
          } else {
            lines.push(`  if (typeof obj.${field} !== 'string') return false;`);
          }
        } else if (prop.type === 'number') {
          lines.push(`  if (typeof obj.${field} !== 'number') return false;`);
        } else if (prop.type === 'boolean') {
          lines.push(`  if (typeof obj.${field} !== 'boolean') return false;`);
        }
      });
    }
    
    lines.push('  return true;');
    lines.push('}\n');
    return lines.join('\n');
  }
}