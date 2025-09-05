# ws-ts-gen

AsyncAPIスキーマ（YAML/JSON）からTypeScriptコードを自動生成するCLIツールです。

## 特徴

- WebSocketメッセージ型自動生成（TypeScript）
- スキーマから型・ユーティリティを出力
- CLIコマンドで簡単に生成

## 使い方

```bash
npm install
npx ws-ts-gen generate --schema ./asyncapi.yaml --out ./src/generated
```

## 依存関係

- typescript
- ts-node
- js-yaml
- eslint

## 開発起動

```bash
npm run dev
```

## ライセンス

MIT
