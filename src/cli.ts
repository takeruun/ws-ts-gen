#!/usr/bin/env ts-node

import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';

function generateTypes(schemaPath: string, outDir: string) {
  const ext = path.extname(schemaPath).toLowerCase();
  const content = fs.readFileSync(schemaPath, 'utf-8');
  const schema = ext === '.yaml' || ext === '.yml' ? yaml.load(content) : JSON.parse(content);

  // TODO: スキーマからTypeScript型を生成する処理
  const typeDef = `// Generated types\nexport interface Message {}`;

  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'types.ts'), typeDef);
  console.log(`Generated types at ${path.join(outDir, 'types.ts')}`);
}

const args = process.argv.slice(2);
if (args[0] === 'generate' && args[1] === '--schema' && args[3] === '--out' && args[2] && args[4]) {
  generateTypes(args[2], args[4]);
} else {
  console.log('Usage: ws-ts-gen generate --schema <path> --out <outDir>');
}