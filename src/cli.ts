#!/usr/bin/env node

import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';

// ---------------------
// CLI引数解析
// ---------------------
function parseArgs(argv: string[]) {
  const [,, command, schemaPath, outDir] = argv;
  return { command, schemaPath, outDir: outDir || 'dist' };
}

// ---------------------
// スキーマ読込
// ---------------------
function loadSchema(schemaPath: string) {
  const ext = path.extname(schemaPath).toLowerCase();
  const content = fs.readFileSync(schemaPath, 'utf-8');
  return ext === '.yaml' || ext === '.yml' ? yaml.load(content) : JSON.parse(content);
}

// ---------------------
// 型生成ロジック
// ---------------------
function resolveType(prop: any): string {
  if (prop.enum) return prop.enum.map((v: string) => `'${v}'`).join(' | ');
  if (prop.type === 'string') return 'string';
  if (prop.type === 'integer' || prop.type === 'number') return 'number';
  if (prop.type === 'boolean') return 'boolean';
  if (prop.type === 'array') return `${resolveType(prop.items)}[]`;
  if (prop.type === 'object') {
    if (prop.properties) {
      return `{ ${Object.entries(prop.properties).map(([k, v]: [string, any]) => `${k}: ${resolveType(v)}`).join('; ')} }`;
    } else {
      return 'Record<string, any>';
    }
  }
  if (prop.oneOf) return prop.oneOf.map(resolveType).join(' | ');
  if (prop.anyOf) return prop.anyOf.map(resolveType).join(' | ');
  return 'any';
}

function generateTypes(schema: any): string {
  // 1. Components > schemas
  let types = `// Type definitions generated from AsyncAPI schema\n`;
  const schemas = schema.components?.schemas || {};

  for (const [name, def] of Object.entries(schemas)) {
    types += `export type ${name} = ${resolveType(def)};\n\n`;
  }

  // 2. Messages
  if (schema.components?.messages) {
    types += `export type MessageType =\n  ${Object.keys(schema.components.messages).map(m => `'${m}'`).join(' | ')};\n\n`;
    types += `export type AsyncApiMessage = {\n  type: MessageType;\n  payload: any;\n};\n\n`;
  }

  return types;
}

// ---------------------
// サーバーテンプレート生成ロジック
// ---------------------
function generateServerTemplate(schema: any): string {
  // メッセージ型情報取得
  const messageTypes = schema.components?.messages ? Object.keys(schema.components.messages) : [];
  return `// WebSocket server template generated from AsyncAPI schema\nimport { WebSocketServer } from 'ws';\nimport { MessageType, AsyncApiMessage } from './types';\n\nconst wss = new WebSocketServer({ port: 8080 });\n\nwss.on('connection', (ws) => {\n  ws.on('message', (data) => {\n    let msg: AsyncApiMessage;\n    try {\n      msg = JSON.parse(data.toString());\n    } catch (err) {\n      ws.send(JSON.stringify({ type: 'error', payload: { error: 'Invalid JSON' } }));\n      return;\n    }\n\n    switch (msg.type) {\n${messageTypes.map(m => `      case '${m}':\n        // TODO: Implement handler for '${m}'\n        ws.send(JSON.stringify({ type: '${m}:response', payload: { echo: msg.payload } }));\n        break;`).join('\n')}\n      default:\n        ws.send(JSON.stringify({ type: 'error', payload: { error: 'Unknown message type' } }));\n    }\n  });\n\n  ws.send(JSON.stringify({ type: 'hello', payload: {} }));\n});\n`;
}

// ---------------------
// メイン処理
// ---------------------
function main() {
  const { command, schemaPath, outDir } = parseArgs(process.argv);
  if (!command || !schemaPath) {
    console.error('Usage:\n  ws-ts-gen typegen [schema.yaml] [outDir]\n  ws-ts-gen server-template [schema.yaml] [outDir]');
    process.exit(1);
  }

  const schema = loadSchema(schemaPath);

  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);

  if (command === 'typegen') {
    const typeCode = generateTypes(schema);
    fs.writeFileSync(path.join(outDir, 'types.ts'), typeCode);
    console.log(`✅ Type definitions generated at ${path.join(outDir, 'types.ts')}`);
  } else if (command === 'server-template') {
    const serverCode = generateServerTemplate(schema);
    fs.writeFileSync(path.join(outDir, 'server.ts'), serverCode);
    console.log(`✅ Server template generated at ${path.join(outDir, 'server.ts')}`);
  } else {
    console.error(`Unknown command: ${command}`);
    process.exit(1);
  }
}

main();
