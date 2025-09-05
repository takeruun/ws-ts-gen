#!/usr/bin/env node
import { AsyncAPIParser } from './parsers/asyncapi';
import { TypesGenerator } from './generators/types';
import { HandlersGenerator } from './generators/handlers';
import { ServerGenerator } from './generators/server';
import { IndexGenerator } from './generators/index';
import { GeneratorOptions } from './types/asyncapi';
import { existsSync, mkdirSync } from 'fs';
import path from 'path';

function parseArgs(): GeneratorOptions {
  const args = process.argv.slice(2);
  const options: GeneratorOptions = {
    schema: '',
    out: './generated',
    generateTypes: true,
    generateServer: true,
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
      case '--no-types':
        options.generateTypes = false;
        break;
      case '--no-server':
        options.generateServer = false;
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
  --no-types              Skip type definitions generation
  --no-server             Skip server generation
  --no-handlers           Skip handlers generation
  -h, --help              Show help

Examples:
  ws-ts-gen generate --schema ./asyncapi.yaml --out ./src/generated
  ws-ts-gen generate -s ./api.yaml -o ./output
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
    
    console.log(`Generating code to: ${options.out}`);
    
    // Generate types
    if (options.generateTypes) {
      const typesGenerator = new TypesGenerator();
      typesGenerator.generate(doc, options.out);
    }
    
    // Generate handlers
    if (options.generateHandlers) {
      const handlersGenerator = new HandlersGenerator();
      handlersGenerator.generate(doc, options.out);
    }
    
    // Generate server
    if (options.generateServer) {
      const serverGenerator = new ServerGenerator();
      serverGenerator.generate(doc, options.out);
      
      // Also generate index.ts as an example
      const indexGenerator = new IndexGenerator();
      indexGenerator.generate(doc, options.out);
    }
    
    console.log('\\n✅ Code generation completed successfully!');
    console.log('\\nGenerated files:');
    if (options.generateTypes) console.log(`  - ${path.join(options.out, 'types.ts')}`);
    if (options.generateHandlers) console.log(`  - ${path.join(options.out, 'handlers.ts')}`);
    if (options.generateServer) {
      console.log(`  - ${path.join(options.out, 'server.ts')}`);
      console.log(`  - ${path.join(options.out, 'index.ts')}`);
    }
    
    console.log('\\nNext steps:');
    console.log('1. Install dependencies: npm install ws @types/ws');
    console.log(`2. Implement your custom handlers in ${path.join(options.out, 'handlers.ts')}`);
    console.log(`3. Run the server: ts-node ${path.join(options.out, 'index.ts')}`);
    
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}