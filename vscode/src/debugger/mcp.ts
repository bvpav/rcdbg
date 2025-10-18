import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
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
      "Retrieve all variable scopes (locals, globals, etc.) for a specific stack frame during an active debugging session. Variables are recursively resolved up to the specified depth, allowing you to inspect nested objects and data structures. By default, underscore-prefixed properties (Python internals like __dict__, __class__) are excluded to reduce noise. Large collections are limited to prevent context flooding. Use this to examine the program state at any point during debugging. Requires an active debug session.",
    inputSchema: {
      frameId: z.number(),
      maxDepth: z.number().optional().default(2),
      excludeUnderscoreProps: z.boolean().optional().default(true),
      maxCollectionSize: z.number().optional().default(20),
    },
    outputSchema: { scopes: z.array(z.any()) },
  },
  async ({
    frameId,
    maxDepth,
    excludeUnderscoreProps,
    maxCollectionSize,
  }: any) => {
    try {
      const debugSession = vscode.debug.activeDebugSession;
      if (!debugSession) {
        throw new Error(
          "No active debug session. Start debugging first using the startDebugging tool."
        );
      }

      const scopes = await getScopesApi(debugSession, frameId, {
        maxDepth: maxDepth ?? 2,
        excludeUnderscoreProps: excludeUnderscoreProps ?? true,
        maxCollectionSize: maxCollectionSize ?? 20,
      });
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
      "Execute a single step in the debugger and retrieve the execution context and variable scopes. Returns: current location (file, line, function), source code snippet showing current line with context, abbreviated stack trace (top 5 frames), and variable scopes. Choose 'into' to step into function calls, 'over' to step over them, or 'out' to step out of the current function. This is the primary way to advance through code execution while inspecting state. Requires an active debug session.",
    inputSchema: {
      stepType: z.enum(["into", "over", "out"]),
      maxDepth: z.number().optional().default(2),
      excludeUnderscoreProps: z.boolean().optional().default(true),
      maxCollectionSize: z.number().optional().default(20),
    },
    outputSchema: {
      executionContext: z.object({
        location: z.object({
          file: z.string(),
          line: z.number(),
          column: z.number().optional(),
          function: z.string(),
        }),
        sourceSnippet: z.string().optional(),
        stackTrace: z.array(
          z.object({
            frameId: z.number(),
            name: z.string(),
            source: z.string(),
            line: z.number(),
            column: z.number().optional(),
          })
        ),
      }),
      scopes: z.array(z.any()),
    },
  },
  async ({
    stepType,
    maxDepth,
    excludeUnderscoreProps,
    maxCollectionSize,
  }: any) => {
    try {
      if (!vscode.debug.activeDebugSession) {
        throw new Error(
          "No active debug session. Start debugging first using the startDebugging tool."
        );
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

      const result = await stepAndGetVariables(stepCommand, {
        maxDepth: maxDepth ?? 2,
        excludeUnderscoreProps: excludeUnderscoreProps ?? true,
        maxCollectionSize: maxCollectionSize ?? 20,
      });

      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        structuredContent: result,
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
        throw new Error(
          "No active debug session to stop. Use the debug://session/status resource to check session state."
        );
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
      "Get the current call stack showing all active function calls and their locations in the source code. Each frame includes a frameId that can be used with getScopes() to inspect variables at that level. This helps understand the execution path and context. Note: The step tool already includes an abbreviated stack trace (top 5 frames), so this tool is only needed if you want the complete call stack. Requires an active debug session.",
    inputSchema: {},
    outputSchema: {
      stackFrames: z.array(
        z.object({
          frameId: z.number(),
          name: z.string(),
          source: z.string(),
          line: z.number(),
          column: z.number().optional(),
        })
      ),
    },
  },
  async () => {
    try {
      const debugSession = vscode.debug.activeDebugSession;
      if (!debugSession) {
        throw new Error(
          "No active debug session. Use the debug://session/status resource to check session state."
        );
      }

      const activeStackItem = vscode.debug.activeStackItem;
      if (!activeStackItem) {
        throw new Error(
          "No active stack item. The debugger may not be paused at a breakpoint or step."
        );
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
        column: frame.column,
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

// 6. Get Session Status
server.registerTool(
  "getSessionStatus",
  {
    title: "Get Debug Session Status",
    description:
      "Check if a debug session is currently active and get the current execution location if available. This is a lightweight, non-intrusive way to check the debugging state before performing other operations. Returns session information including whether it's active, session name/type, and current location (file, line, function) if the debugger is paused.",
    inputSchema: {},
    outputSchema: {
      active: z.boolean(),
      sessionName: z.string().optional(),
      sessionType: z.string().optional(),
      location: z
        .object({
          file: z.string(),
          line: z.number(),
          column: z.number().optional(),
          function: z.string(),
        })
        .optional(),
      message: z.string().optional(),
    },
  },
  async () => {
    try {
      const debugSession = vscode.debug.activeDebugSession;

      if (!debugSession) {
        const output = {
          active: false,
          message: "No active debug session",
        };
        return {
          content: [{ type: "text", text: JSON.stringify(output, null, 2) }],
          structuredContent: output,
        };
      }

      // Get current execution context if we have an active stack item
      const activeStackItem = vscode.debug.activeStackItem;
      if (!activeStackItem) {
        const output = {
          active: true,
          sessionName: debugSession.name,
          sessionType: debugSession.type,
          message: "Debug session active but no stack item available",
        };
        return {
          content: [{ type: "text", text: JSON.stringify(output, null, 2) }],
          structuredContent: output,
        };
      }

      // Get thread ID
      let threadId: number | undefined;
      if ("threadId" in activeStackItem) {
        threadId = activeStackItem.threadId;
      } else if ("thread" in activeStackItem) {
        threadId = (activeStackItem as any).thread.threadId;
      }

      // Get stack trace if we have a thread ID
      let location: any = undefined;
      if (threadId !== undefined) {
        try {
          const response = await debugSession.customRequest("stackTrace", {
            threadId,
          });
          if (response.stackFrames.length > 0) {
            const topFrame = response.stackFrames[0];
            location = {
              file: topFrame.source?.path ?? topFrame.source?.name ?? "unknown",
              line: topFrame.line,
              column: topFrame.column,
              function: topFrame.name,
            };
          }
        } catch (error) {
          // Ignore errors getting stack trace
        }
      }

      const output = {
        active: true,
        sessionName: debugSession.name,
        sessionType: debugSession.type,
        location,
      };

      return {
        content: [{ type: "text", text: JSON.stringify(output, null, 2) }],
        structuredContent: output,
      };
    } catch (error: any) {
      const output = {
        active: false,
        error: error.message ?? String(error),
      };
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
