# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**RCDBG** enables AI agents to debug code using a real debugger, giving them new superpowers in the programming feedback loop.

Agentic programming is here to stay, but it's a long way from perfect. AI code editors like Cursor, GitHub Copilot, and Windsurf treat source code like text, but we can get better results if we teach AI agents to treat code like a structure. RCDBG is a VS Code extension that bridges this gap by allowing AI agents to use actual debugging capabilities rather than just static code analysis.

The project is in early development stages.

## Repository Structure

- `vscode/` - VS Code extension implementation
  - `src/extension.ts` - Main extension entry point with command registration
  - `package.json` - Extension manifest and dependencies
- `example/` - Example code for testing the extension (currently contains `main.py`)

## Development Commands

All commands should be run from the `vscode/` directory.

### Building and Running

```bash
# Install dependencies
pnpm install

# Compile TypeScript
pnpm run compile

# Watch mode for development
pnpm run watch

# Run linter
pnpm run lint

# Run tests
pnpm run test
```

### Testing the Extension

Press F5 in VS Code from the `vscode/` directory to launch the Extension Development Host.

## Extension Commands

The extension currently registers two commands in `package.json`:
- `rcdbg.helloWorld` - Basic test command
- `rcdbg.fuckWithDebugging` - Experimental debugging command (vscode/src/extension.ts:22)

## Technology Stack

- TypeScript (strict mode enabled)
- Node 16 module system
- VS Code Extension API 1.103.0+
- pnpm for package management

## Git Workflow

- Main branch: `master`
- Current working branch: `bozho/controlling-debugger`
