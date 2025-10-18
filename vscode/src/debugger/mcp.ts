import {
  McpServer,
  ResourceTemplate,
} from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import express from "express";
import { z } from "zod";
import * as vscode from "vscode";
import {
  startDebugging as startDebuggingApi,
  getScopes as getScopesApi,
  stepAndGetVariables,
  stopDebugging as stopDebuggingApi,
} from "./api";

// Create an MCP server
const server = new McpServer({
  name: "debugger-mcp-server",
  version: "1.0.0",
});

// ========== DEBUGGING TOOLS ==========

// 1. Start Debugging
server.registerTool(
  "startDebugging",
  {
    title: "Start Debugging Session",
    description:
      "Start a new debugging session on the currently active file in VS Code. The debugger will launch using debugpy and pause at the entry point of the program. This must be called before any other debugging operations. Returns session information including whether the session started successfully.",
    inputSchema: {},
    outputSchema: { success: z.boolean(), message: z.string() },
  },
  async () => {
    try {
      await startDebuggingApi();
      const output = {
        success: true,
        message: "Debug session started successfully",
      };
      return {
        content: [{ type: "text", text: JSON.stringify(output, null, 2) }],
        structuredContent: output,
      };
    } catch (error: any) {
      const output = {
        success: false,
        message: error.message ?? String(error),
      };
      return {
        content: [{ type: "text", text: JSON.stringify(output, null, 2) }],
        structuredContent: output,
      };
    }
  }
);

// 2. Get Scopes
server.registerTool(
  "getScopes",
  {
    title: "Get Variable Scopes",
    description:
      "Retrieve all variable scopes (locals, globals, etc.) for a specific stack frame during an active debugging session. Variables are recursively resolved up to the specified depth, allowing you to inspect nested objects and data structures. Use this to examine the program state at any point during debugging. Requires an active debug session.",
    inputSchema: {
      frameId: z.number(),
      maxDepth: z.number().optional().default(3),
    },
    outputSchema: { scopes: z.array(z.any()) },
  },
  async ({ frameId, maxDepth }: any) => {
    try {
      const debugSession = vscode.debug.activeDebugSession;
      if (!debugSession) {
        throw new Error("No active debug session");
      }

      const scopes = await getScopesApi(debugSession, frameId, maxDepth ?? 3);
      const output = { scopes };
      return {
        content: [{ type: "text", text: JSON.stringify(output, null, 2) }],
        structuredContent: output,
      };
    } catch (error: any) {
      const output = { error: error.message ?? String(error) };
      return {
        content: [{ type: "text", text: JSON.stringify(output, null, 2) }],
        structuredContent: output,
      };
    }
  }
);

// 3. Step
server.registerTool(
  "step",
  {
    title: "Step Through Code",
    description:
      "Execute a single step in the debugger and automatically retrieve the variable scopes after stepping. Choose 'into' to step into function calls, 'over' to step over them, or 'out' to step out of the current function. The debugger will pause at the next line and return all variable states at that point. This is the primary way to advance through code execution while inspecting state. Requires an active debug session.",
    inputSchema: {
      stepType: z.enum(["into", "over", "out"]),
      maxDepth: z.number().optional().default(3),
    },
    outputSchema: { scopes: z.array(z.any()) },
  },
  async ({ stepType, maxDepth }: any) => {
    try {
      if (!vscode.debug.activeDebugSession) {
        throw new Error("No active debug session");
      }

      const stepCommandMap: Record<string, string> = {
        into: "workbench.action.debug.stepInto",
        over: "workbench.action.debug.stepOver",
        out: "workbench.action.debug.stepOut",
      };

      const stepCommand = stepCommandMap[stepType];
      if (!stepCommand) {
        throw new Error(`Invalid step type: ${stepType}`);
      }

      const scopes = await stepAndGetVariables(stepCommand, maxDepth ?? 3);
      const output = { scopes };
      return {
        content: [{ type: "text", text: JSON.stringify(output, null, 2) }],
        structuredContent: output,
      };
    } catch (error: any) {
      const output = { error: error.message ?? String(error) };
      return {
        content: [{ type: "text", text: JSON.stringify(output, null, 2) }],
        structuredContent: output,
      };
    }
  }
);

// 4. Stop Debugging
server.registerTool(
  "stopDebugging",
  {
    title: "Stop Debugging Session",
    description:
      "Terminate the currently active debugging session. The debugged program will stop executing and all debugging state will be cleaned up. Call this when you're done analyzing the program. Requires an active debug session.",
    inputSchema: {},
    outputSchema: { success: z.boolean(), message: z.string() },
  },
  async () => {
    try {
      const debugSession = vscode.debug.activeDebugSession;
      if (!debugSession) {
        throw new Error("No active debug session");
      }

      await stopDebuggingApi(debugSession);
      const output = {
        success: true,
        message: "Debug session stopped successfully",
      };
      return {
        content: [{ type: "text", text: JSON.stringify(output, null, 2) }],
        structuredContent: output,
      };
    } catch (error: any) {
      const output = {
        success: false,
        message: error.message ?? String(error),
      };
      return {
        content: [{ type: "text", text: JSON.stringify(output, null, 2) }],
        structuredContent: output,
      };
    }
  }
);

// 5. Get Stack Trace
server.registerTool(
  "getStackTrace",
  {
    title: "Get Call Stack",
    description:
      "Get the current call stack showing all active function calls and their locations in the source code. Each frame includes a frameId that can be used with getScopes() to inspect variables at that level. This helps understand the execution path and context. Requires an active debug session.",
    inputSchema: {},
    outputSchema: {
      stackFrames: z.array(
        z.object({
          frameId: z.number(),
          name: z.string(),
          source: z.string(),
          line: z.number(),
        })
      ),
    },
  },
  async () => {
    try {
      const debugSession = vscode.debug.activeDebugSession;
      if (!debugSession) {
        throw new Error("No active debug session");
      }

      const activeStackItem = vscode.debug.activeStackItem;
      if (!activeStackItem) {
        throw new Error("No active stack item");
      }

      // Get the thread ID from the active stack item
      let threadId: number;
      if ("threadId" in activeStackItem) {
        threadId = activeStackItem.threadId;
      } else if ("thread" in activeStackItem) {
        threadId = (activeStackItem as any).thread.threadId;
      } else {
        throw new Error("Unable to determine thread ID from active stack item");
      }

      // Request the stack trace
      const response = await debugSession.customRequest("stackTrace", {
        threadId,
      });

      const stackFrames = response.stackFrames.map((frame: any) => ({
        frameId: frame.id,
        name: frame.name,
        source: frame.source?.path ?? frame.source?.name ?? "unknown",
        line: frame.line,
      }));

      const output = { stackFrames };
      return {
        content: [{ type: "text", text: JSON.stringify(output, null, 2) }],
        structuredContent: output,
      };
    } catch (error: any) {
      const output = { error: error.message ?? String(error) };
      return {
        content: [{ type: "text", text: JSON.stringify(output, null, 2) }],
        structuredContent: output,
      };
    }
  }
);

// Set up Express and HTTP transport
const app = express();
app.use(express.json());

app.post("/mcp", async (req, res) => {
  // Create a new transport for each request to prevent request ID collisions
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });

  res.on("close", () => {
    transport.close();
  });

  await server.connect(transport);
  await transport.handleRequest(req, res, req.body);
});

let isRunning = false;

const port = 2114;
export function listen() {
  if (isRunning) {
    return;
  }

  isRunning = true;
  app
    .listen(port, () => {
      console.log(`RCDBG MCP Server running on http://localhost:${port}/mcp`);
    })
    .on("error", (error: any) => {
      console.error("Server error:", error);
      process.exit(1);
    });
}

export async function close() {
  await server.close();
}
