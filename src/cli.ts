#!/usr/bin/env node
import { AsyncAPIParser } from './parsers/asyncapi';
import { TypesGenerator } from './generators/types';
import { HandlersGenerator } from './generators/handlers';
import { ServerGenerator } from './generators/server';
import { IndexGenerator } from './generators/index';
import { ClientGenerator } from './generators/client';
import { ClientIndexGenerator } from './generators/client-index';
import { GeneratorOptions } from './types/asyncapi';
import { existsSync, mkdirSync } from 'fs';
import path from 'path';

function parseArgs(): GeneratorOptions {
  const args = process.argv.slice(2);
  const options: GeneratorOptions = {
    schema: '',
    out: './generated',
    mode: 'both',
    generateTypes: true,
    generateServer: true,
    generateClient: false,
    generateHandlers: true
  };
  
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--schema':
      case '-s':
        options.schema = args[++i];
        break;
      case '--out':
      case '-o':
        options.out = args[++i];
        break;
      case '--mode':
      case '-m':
        const mode = args[++i];
        if (mode !== 'server' && mode !== 'client' && mode !== 'both') {
          console.error('Error: Invalid mode. Must be server, client, or both');
          process.exit(1);
        }
        options.mode = mode;
        // Auto-configure based on mode
        if (mode === 'server') {
          options.generateServer = true;
          options.generateClient = false;
        } else if (mode === 'client') {
          options.generateServer = false;
          options.generateClient = true;
        } else {
          options.generateServer = true;
          options.generateClient = true;
        }
        break;
      case '--no-types':
        options.generateTypes = false;
        break;
      case '--no-server':
        options.generateServer = false;
        break;
      case '--no-client':
        options.generateClient = false;
        break;
      case '--no-handlers':
        options.generateHandlers = false;
        break;
      case '--help':
      case '-h':
        showHelp();
        process.exit(0);
      default:
        if (args[i] === 'generate') {
          continue;
        }
        console.error(`Unknown option: ${args[i]}`);
        showHelp();
        process.exit(1);
    }
  }
  
  if (!options.schema) {
    console.error('Error: Schema file is required');
    showHelp();
    process.exit(1);
  }
  
  if (!existsSync(options.schema)) {
    console.error(`Error: Schema file not found: ${options.schema}`);
    process.exit(1);
  }
  
  return options;
}

function showHelp(): void {
  console.log(`
ws-ts-gen - Generate TypeScript code from AsyncAPI schemas

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

Examples:
  ws-ts-gen generate --schema ./asyncapi.yaml --out ./src/generated
  ws-ts-gen generate -s ./api.yaml -o ./output --mode server
  ws-ts-gen generate --schema ./api.yaml --mode client
  `);
}

async function main() {
  try {
    const options = parseArgs();
    
    // Create output directory if it doesn't exist
    if (!existsSync(options.out)) {
      mkdirSync(options.out, { recursive: true });
    }
    
    // Parse AsyncAPI document
    console.log(`Parsing schema: ${options.schema}`);
    const parser = new AsyncAPIParser();
    const doc = parser.parse(options.schema);
    
    console.log(`Generating code to: ${options.out} (mode: ${options.mode})`);
    
    // Generate types
    if (options.generateTypes) {
      const typesGenerator = new TypesGenerator();
      typesGenerator.generate(doc, options.out);
    }
    
    // Generate server-side code
    if (options.generateServer) {
      if (options.generateHandlers) {
        const handlersGenerator = new HandlersGenerator();
        handlersGenerator.generate(doc, options.out);
      }
      
      const serverGenerator = new ServerGenerator();
      serverGenerator.generate(doc, options.out);
      
      // Also generate server index.ts as an example
      const indexGenerator = new IndexGenerator();
      indexGenerator.generate(doc, options.out);
    }
    
    // Generate client-side code
    if (options.generateClient) {
      const clientGenerator = new ClientGenerator();
      clientGenerator.generate(doc, options.out);
      
      // Also generate client example
      const clientIndexGenerator = new ClientIndexGenerator();
      clientIndexGenerator.generate(doc, options.out);
    }
    
    console.log('\\n✅ Code generation completed successfully!');
    console.log('\\nGenerated files:');
    if (options.generateTypes) console.log(`  - ${path.join(options.out, 'types.ts')}`);
    if (options.generateHandlers) console.log(`  - ${path.join(options.out, 'handlers.ts')}`);
    if (options.generateServer) {
      console.log(`  - ${path.join(options.out, 'server.ts')}`);
      console.log(`  - ${path.join(options.out, 'server-sample.ts')}`);
    }
    if (options.generateClient) {
      console.log(`  - ${path.join(options.out, 'client.ts')}`);
      console.log(`  - ${path.join(options.out, 'client-example.ts')}`);
    }
    
    console.log('\\nNext steps:');
    console.log('1. Install dependencies: npm install ws @types/ws');
    if (options.generateServer) {
      console.log(`2. Implement your custom handlers in ${path.join(options.out, 'handlers.ts')}`);
      console.log(`3. Run the server: ts-node ${path.join(options.out, 'server-sample.ts')}`);
    }
    if (options.generateClient) {
      console.log(`2. Run the client example: ts-node ${path.join(options.out, 'client-example.ts')}`);
    }
    
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}