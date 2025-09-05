import { writeFileSync } from 'fs';
import path from 'path';

// TODO: パースロジックやコマンド引数は未実装。雛形のみ。
function generateTypes() {
  const types = `// Type definitions generated from AsyncAPI schema\n\nexport type PingMessage = { type: 'ping'; timestamp: number };\n\nexport type PongMessage = { type: 'pong'; timestamp: number };\n\nexport type ErrorMessage = {\n  type: 'error';\n  error: string;\n  details?: Record<string, any>;\n};\n\nexport type MessageType = 'ping' | 'pong' | 'error';\n\nexport type AsyncApiMessage =\n  { type: 'ping'; payload: PingMessage } |\n  { type: 'pong'; payload: PongMessage } |\n  { type: 'error'; payload: ErrorMessage };\n`;
  writeFileSync(path.join(__dirname, '../example/types.ts'), types);
  console.log('types.ts generated');
}

function generateServer() {
  const server = `// WebSocket server template generated from AsyncAPI schema\nimport { WebSocketServer } from 'ws';\nimport { MessageType, AsyncApiMessage, PingMessage, PongMessage, ErrorMessage } from './types';\n\nfunction isPingMessage(msg: any): msg is PingMessage {\n  return msg?.type === 'ping' && typeof msg.timestamp === 'number';\n}\n\nfunction isPongMessage(msg: any): msg is PongMessage {\n  return msg?.type === 'pong' && typeof msg.timestamp === 'number';\n}\n\nfunction isErrorMessage(msg: any): msg is ErrorMessage {\n  return msg?.type === 'error' && typeof msg.error === 'string';\n}\n\nconst wss = new WebSocketServer({ port: 8080 });\n\nwss.on('connection', (ws) => {\n  ws.on('message', (data) => {\n    let parsed: AsyncApiMessage | undefined;\n    try {\n      parsed = JSON.parse(data.toString());\n    } catch (err) {\n      ws.send(JSON.stringify({ type: 'error', payload: { type: 'error', error: 'Invalid JSON' } }));\n      return;\n    }\n\n    switch (parsed.type) {\n      case 'ping':\n        if (!isPingMessage(parsed.payload)) {\n          ws.send(JSON.stringify({ type: 'error', payload: { type: 'error', error: 'Invalid ping payload' } }));\n          return;\n        }\n        // TODO: Handle ping\n        ws.send(JSON.stringify({ type: 'pong', payload: { type: 'pong', timestamp: Date.now() } }));\n        break;\n      case 'pong':\n        if (!isPongMessage(parsed.payload)) {\n          ws.send(JSON.stringify({ type: 'error', payload: { type: 'error', error: 'Invalid pong payload' } }));\n          return;\n        }\n        // TODO: Handle pong\n        break;\n      case 'error':\n        if (!isErrorMessage(parsed.payload)) {\n          ws.send(JSON.stringify({ type: 'error', payload: { type: 'error', error: 'Invalid error payload' } }));\n          return;\n        }\n        // TODO: Handle error\n        break;\n      default:\n        ws.send(JSON.stringify({ type: 'error', payload: { type: 'error', error: 'Unknown message type' } }));\n    }\n  });\n\n  ws.send(JSON.stringify({ type: 'pong', payload: { type: 'pong', timestamp: Date.now() } }));\n});\n`;
  writeFileSync(path.join(__dirname, '../example/server.ts'), server);
  console.log('server.ts generated');
}

function main() {
  // ここでコマンド振り分け、現状は全生成
  generateTypes();
  generateServer();
}

main();
