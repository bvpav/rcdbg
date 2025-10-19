# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Reality Check** (rcdbg) enables AI agents to debug code using a real debugger, giving them new superpowers in the programming feedback loop.

Agentic programming is here to stay, but it's a long way from perfect. AI code editors like Cursor, GitHub Copilot, and Windsurf treat source code like text, but we can get better results if we teach AI agents to treat code like a structure. Reality Check is a VS Code extension that bridges this gap by allowing AI agents to use actual debugging capabilities rather than just static code analysis.

The project is in early development stages.

## Repository Structure

- `vscode/` - VS Code extension implementation
  - `src/extension.ts` - Main extension entry point with command registration
  - `src/debugger/` - Core debugging API module
    - `api.ts` - High-level debugging API (startDebugging, getScopes, stepAndGetVariables, stopDebugging)
    - `mcp.ts` - MCP (Model Context Protocol) server exposing debugger API to AI agents via HTTP
  - `package.json` - Extension manifest and dependencies
- `example/` - Example code for testing the extension (currently contains `main.py`)

## Development Commands

All commands should be run from the `vscode/` directory.

### Building and Running

```bash
# Install dependencies
npm install

# Compile TypeScript
npm run compile

# Watch mode for development
npm run watch

# Run linter
npm run lint

# Run tests
npm run test
```

### Testing the Extension

Press F5 in VS Code from the `vscode/` directory to launch the Extension Development Host.

## Architecture

### Debugger API (`src/debugger/api.ts`)

The core debugging functionality is abstracted into reusable functions:

- **`startDebugging()`** - Starts a debugpy session with stopOnEntry enabled, returns the DebugSession
- **`getScopes(debugSession, frameId, maxDepth)`** - Recursively resolves variables in all scopes for a stack frame up to maxDepth
- **`stepAndGetVariables(stepCommand, maxDepth)`** - Executes a step command and returns resolved scopes for the new frame
- **`stopDebugging(debugSession)`** - Stops the debug session

### MCP Server (`src/debugger/mcp.ts`)

An HTTP-based MCP (Model Context Protocol) server for exposing debugging capabilities to AI agents:

- Runs on `http://localhost:2114/mcp`
- Exposes 5 MCP tools that wrap the debugger API:
  - **startDebugging** - Start a new debug session on the active file
  - **getScopes** - Get variable scopes for a specific stack frame
  - **step** - Step through code (into/over/out) and get variables
  - **stopDebugging** - Stop the active debug session
  - **getStackTrace** - Get the current call stack with frame IDs
- All tools include LLM-optimized descriptions and proper error handling
- Automatically started when the extension activates

### Extension Commands

The extension currently registers two commands in `package.json`:
- `rcdbg.helloWorld` - Basic test command
- `rcdbg.fuckWithDebugging` - Main debugging workflow (vscode/src/extension.ts:29)
  - Starts a debug session on the active file
  - Steps through 5 iterations, capturing variable scopes at each step
  - Opens a new document showing the JSON snapshot of all captured scopes

## Technology Stack

- TypeScript (strict mode enabled)
- Node 16 module system
- VS Code Extension API 1.103.0+
- npm for package management

## Git Workflow

- Main branch: `master`
- Current working branch: `bozho/controlling-debugger`
