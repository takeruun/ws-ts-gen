# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ws-ts-gen is a CLI tool that generates TypeScript code from AsyncAPI schemas (YAML/JSON). It automates the creation of WebSocket message types and server templates.

## Common Commands

### Development
- `yarn dev` - Run the CLI in development mode using ts-node
- `yarn build` - Compile TypeScript to JavaScript (output to dist/)
- `yarn lint` - Run ESLint on TypeScript files

### CLI Usage
```bash
npx ws-ts-gen generate --schema ./asyncapi.yaml --out ./src/generated
```

## Architecture

### Core Components

1. **CLI Entry Point** (`src/cli.ts`)
   - Main entry point for the CLI tool
   - Currently contains hardcoded type generation logic (TODO: implement command parsing and YAML/JSON schema parsing)
   - Generates two files: `types.ts` and `server.ts` in the example directory

2. **Generated Output Structure**
   - `types.ts`: Contains TypeScript interfaces and types for WebSocket messages
   - `server.ts`: WebSocket server template with message validation and handling

### Key Technical Details

- Uses CommonJS module system
- TypeScript compilation targets ES2020
- Strict TypeScript mode enabled
- WebSocket implementation uses the `ws` library
- YAML parsing uses `js-yaml` library (dependency installed but not yet implemented)

### Current Implementation Status

The project is in early development stage:
- Basic file generation is implemented but hardcoded
- Command-line argument parsing is not yet implemented
- AsyncAPI schema parsing logic is not yet implemented
- The tool currently generates example files based on hardcoded templates

### AsyncAPI Schema Structure

The tool expects AsyncAPI 3.0.0 format schemas with:
- WebSocket server configuration
- Channel definitions for WebSocket endpoints
- Message schemas defining payload structure
- Operations defining send/receive patterns

Example schema location: `example/example.yaml`