import { AsyncAPIDocument } from '../types/asyncapi';
import { writeFileSync } from 'fs';
import path from 'path';

export class HandlersGenerator {
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
    const handlers: string[] = [
      '// WebSocket message handlers with dependency injection',
      "import { AsyncApiMessage",
    ];
    
    // Import all message types
    const schemaTypes = Object.keys(doc.components.schemas);
    const allTypes = [...schemaTypes];
    
    if (allTypes.length > 0) {
      handlers[handlers.length - 1] += ', ' + allTypes.join(', ');
    }
    handlers[handlers.length - 1] += " } from './types';";
    
    handlers.push(
      "import { WebSocket } from 'ws';",
      '',
      '// Handler interface for each message type',
    );
    
    // Generate handler interfaces only for messages that are sent to the server (action: send)
    const sendOperations = this.getSendOperations(doc);
    sendOperations.forEach(([msgType, message]) => {
      const schemaName = message.payload.$ref?.split('/').pop();
      handlers.push(`export interface ${this.capitalize(msgType)}Handler {
  handle(ws: WebSocket, message: ${schemaName}): void | Promise<void>;
}\n`);
    });
    
    // Generate handler registry
    handlers.push('// Handler registry for dependency injection');
    const handlerTypes = sendOperations.map(([msgType]) => `${this.capitalize(msgType)}Handler`);
    if (handlerTypes.length > 0) {
      handlers.push('type MessageHandler = ' + handlerTypes.join(' | ') + ';');
    } else {
      handlers.push('type MessageHandler = never;');
    }
    handlers.push('');
    handlers.push('export class MessageHandlerRegistry {');
    handlers.push('  private handlers = new Map<string, MessageHandler>();');
    handlers.push('');
    
    // Add register methods
    sendOperations.forEach(([msgType]) => {
      const handlerName = `${this.capitalize(msgType)}Handler`;
      handlers.push(`  register${this.capitalize(msgType)}(handler: ${handlerName}): void {
    this.handlers.set('${msgType}', handler);
  }\n`);
    });
    
    // Add getHandler method
    handlers.push(`  getHandler<T extends MessageHandler>(messageType: string): T | undefined {
    return this.handlers.get(messageType) as T | undefined;
  }`);
    
    handlers.push('}');
    
    // Generate default handler implementations
    handlers.push('\n// Default handler implementations');
    sendOperations.forEach(([msgType, message]) => {
      const schemaName = message.payload.$ref?.split('/').pop();
      handlers.push(`
export class Default${this.capitalize(msgType)}Handler implements ${this.capitalize(msgType)}Handler {
  async handle(ws: WebSocket, message: ${schemaName}): Promise<void> {
    console.log('Handling ${msgType} message:', message);
    // TODO: Implement ${msgType} handling logic
    ${this.generateDefaultResponse(msgType, doc)}
  }
}`);
    });
    
    const outputPath = path.join(outputDir, 'handlers.ts');
    writeFileSync(outputPath, handlers.join('\n'));
    console.log(`Generated handlers at: ${outputPath}`);
  }
  
  private capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
  
  private generateDefaultResponse(msgType: string, doc: AsyncAPIDocument): string {
    // Generate appropriate response based on message type
    if (msgType === 'ping') {
      return `ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));`;
    } else if (msgType === 'error') {
      return `// Error messages typically don't send a response`;
    }
    return `// Implement response logic for ${msgType}`;
  }
}