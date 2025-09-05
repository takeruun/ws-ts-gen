# ws-ts-gen

AsyncAPIスキーマ（YAML/JSON）からTypeScriptコードを自動生成するCLIツールです。

## 特徴

- **WebSocketサーバー・クライアント両対応**: サーバー側とクライアント側のコードを生成
- **型安全なメッセージハンドリング**: TypeScriptの型システムを活用した安全なWebSocket通信
- **AsyncAPI 3.0.0対応**: 最新のAsyncAPI仕様に準拠
- **DIパターンサポート**: ハンドラーの依存性注入による拡張可能な設計
- **operationsベース生成**: `action: send/receive`に基づく適切なコード生成

## 使い方

### 基本コマンド

```bash
# 依存関係をインストール
yarn install

# サーバーとクライアント両方を生成（デフォルト）
npx ws-ts-gen generate --schema ./asyncapi.yaml --out ./src/generated

# サーバーのみ生成
npx ws-ts-gen generate --schema ./asyncapi.yaml --out ./src/server --mode server

# クライアントのみ生成
npx ws-ts-gen generate --schema ./asyncapi.yaml --out ./src/client --mode client
```

### コマンドオプション

```bash
Usage:
  ws-ts-gen generate [options]

Options:
  -s, --schema <path>     AsyncAPI schema file (YAML/JSON) [required]
  -o, --out <dir>         Output directory (default: ./generated)
  -m, --mode <mode>       Generation mode: server, client, or both (default: both)
  --no-types              Skip type definitions generation
  --no-server             Skip server generation
  --no-client             Skip client generation
  --no-handlers           Skip handlers generation
  -h, --help              Show help
```

## 生成されるファイル

### サーバーモード (`--mode server`)

- `types.ts` - メッセージ型定義
- `handlers.ts` - メッセージハンドラーインターフェース・DIレジストリ・デフォルト実装
- `server.ts` - WebSocketサーバー実装
- `server-sample.ts` - サーバー起動サンプル

### クライアントモード (`--mode client`)

- `types.ts` - メッセージ型定義  
- `client.ts` - WebSocketクライアント実装
- `client-example.ts` - クライアント使用例

### 両方モード (`--mode both`)

上記すべてのファイルが生成されます。

## AsyncAPIスキーマ例

```yaml
asyncapi: "3.0.0"
info:
  title: WebSocket API
  version: "1.0.0"

servers:
  local:
    host: localhost
    port: 8080
    protocol: ws
    pathname: /ws

operations:
  sendPing:
    action: send
    description: Client sends a ping message to the server
    channel:
      $ref: "#/channels/websocket"
    messages:
      - $ref: "#/channels/websocket/messages/ping"

  receivePong:
    action: receive
    description: Client receives a pong message from the server
    channel:
      $ref: "#/channels/websocket"
    messages:
      - $ref: "#/channels/websocket/messages/pong"

channels:
  websocket:
    address: /ws
    messages:
      ping:
        $ref: "#/components/messages/ping"
      pong:
        $ref: "#/components/messages/pong"

components:
  messages:
    ping:
      name: ping
      payload:
        $ref: "#/components/schemas/PingMessage"
    pong:
      name: pong
      payload:
        $ref: "#/components/schemas/PongMessage"

  schemas:
    PingMessage:
      type: object
      required: [type]
      properties:
        type:
          type: string
          const: ping
    PongMessage:
      type: object
      required: [type]
      properties:
        type:
          type: string
          const: pong
        timestamp:
          type: number
```

## 使用例

### サーバー側

```typescript
import { AsyncApiWebSocketServer } from './server';
import { MessageHandlerRegistry, DefaultPingHandler } from './handlers';

const handlerRegistry = new MessageHandlerRegistry();
handlerRegistry.registerPing(new DefaultPingHandler());

const server = new AsyncApiWebSocketServer(8080, handlerRegistry);
console.log('Server started on port 8080');
```

### クライアント側

```typescript
import { AsyncApiWebSocketClient } from './client';

const client = new AsyncApiWebSocketClient();

// メッセージハンドラーを登録
client.onPong((message) => {
  console.log('Received pong:', message);
});

// サーバーに接続
await client.connect();

// メッセージを送信
client.sendPing({ type: 'ping' });
```

## 開発

### 開発モード起動

```bash
yarn dev generate --schema ./example/example.yaml --out ./example/generated
```

### ビルド

```bash
yarn build
```

### リント

```bash
yarn lint
```

## ライセンス

MIT