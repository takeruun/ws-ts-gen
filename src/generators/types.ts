import { AsyncAPIDocument } from '../types/asyncapi';
import { writeFileSync } from 'fs';
import path from 'path';

export class TypesGenerator {
  private capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
  
  generate(doc: AsyncAPIDocument, outputDir: string): void {
    const types: string[] = ['// Type definitions generated from AsyncAPI schema\n'];
    
    // Generate schema types
    Object.entries(doc.components.schemas).forEach(([schemaName, schema]) => {
      types.push(this.generateInterface(schemaName, schema));
    });
    
    // Generate message type union
    const messageTypes = Object.keys(doc.components.messages);
    types.push(`export type MessageType = ${messageTypes.map(m => `'${m}'`).join(' | ')};\n`);
    
    // Generate AsyncApiMessage union type
    const messageUnions = messageTypes.map(msgType => {
      const schemaName = doc.components.messages[msgType].payload.$ref?.split('/').pop();
      return `  ${schemaName}`;
    });
    
    types.push(`export type AsyncApiMessage =\n${messageUnions.join(' |\n')};\n`);
    
    const outputPath = path.join(outputDir, 'types.ts');
    writeFileSync(outputPath, types.join('\n'));
    console.log(`Generated types at: ${outputPath}`);
  }
  
  private generateInterface(name: string, schema: any): string {
    const lines: string[] = [`export interface ${name} {`];
    
    if (schema.properties) {
      Object.entries(schema.properties).forEach(([propName, prop]: [string, any]) => {
        const required = schema.required?.includes(propName) ?? false;
        const optional = required ? '' : '?';
        const type = this.getTypeScriptType(prop);
        const description = prop.description ? ` // ${prop.description}` : '';
        lines.push(`  ${propName}${optional}: ${type};${description}`);
      });
    }
    
    lines.push('}\n');
    return lines.join('\n');
  }
  
  private getTypeScriptType(prop: any): string {
    switch (prop.type) {
      case 'string':
        return prop.const ? `'${prop.const}'` : 'string';
      case 'number':
        return 'number';
      case 'boolean':
        return 'boolean';
      case 'object':
        return prop.properties ? 'Record<string, any>' : 'any';
      case 'array':
        return prop.items ? `${this.getTypeScriptType(prop.items)}[]` : 'any[]';
      default:
        return 'any';
    }
  }
}