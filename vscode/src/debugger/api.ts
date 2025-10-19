import invariant from "tiny-invariant";
import * as vscode from "vscode";

type AnyObject = { [k: string]: any };

export interface StackFrameInfo {
  [key: string]: unknown;
  frameId: number;
  name: string;
  source: string;
  line: number;
  column?: number;
}

export interface ExecutionContext {
  [key: string]: unknown;
  location: {
    file: string;
    line: number;
    column?: number;
    function: string;
  };
  sourceSnippet?: string;
  stackTrace: StackFrameInfo[];
}

export interface StepResult {
  [key: string]: unknown;
  executionContext: ExecutionContext;
  scopes: AnyObject[];
}

export interface ScopeOptions {
  maxDepth?: number;
  excludeUnderscoreProps?: boolean;
  maxCollectionSize?: number;
}

/**
 * Get the current stack trace from the debug session
 */
async function getStackTrace(
  debugSession: vscode.DebugSession,
  threadId: number
): Promise<StackFrameInfo[]> {
  const response = await debugSession.customRequest("stackTrace", {
    threadId,
  });

  return response.stackFrames.map((frame: any) => ({
    frameId: frame.id,
    name: frame.name,
    source: frame.source?.path ?? frame.source?.name ?? "unknown",
    line: frame.line,
    column: frame.column,
  }));
}

/**
 * Get a snippet of source code around a specific line
 */
async function getSourceSnippet(
  filePath: string,
  line: number,
  contextLines: number = 2
): Promise<string | undefined> {
  try {
    const uri = vscode.Uri.file(filePath);
    const document = await vscode.workspace.openTextDocument(uri);
    const startLine = Math.max(0, line - contextLines - 1);
    const endLine = Math.min(document.lineCount - 1, line + contextLines);

    const lines: string[] = [];
    for (let i = startLine; i <= endLine; i++) {
      const lineText = document.lineAt(i).text;
      const marker = i === line - 1 ? "→ " : "  ";
      lines.push(`${marker}${i + 1}: ${lineText}`);
    }
    return lines.join("\n");
  } catch (error) {
    return undefined;
  }
}

/**
 * Get the current execution context including location and stack trace
 */
async function getExecutionContext(
  debugSession: vscode.DebugSession
): Promise<ExecutionContext> {
  const activeStackItem = vscode.debug.activeStackItem;
  invariant(activeStackItem, "Expected to have active stack item");

  // Get thread ID
  let threadId: number;
  if ("threadId" in activeStackItem) {
    threadId = activeStackItem.threadId;
  } else if ("thread" in activeStackItem) {
    threadId = (activeStackItem as any).thread.threadId;
  } else {
    throw new Error("Unable to determine thread ID from active stack item");
  }

  // Get full stack trace
  const stackTrace = await getStackTrace(debugSession, threadId);
  const topFrame = stackTrace[0];

  // Get source snippet if we have a valid file path
  let sourceSnippet: string | undefined;
  if (topFrame.source !== "unknown" && !topFrame.source.startsWith("<")) {
    sourceSnippet = await getSourceSnippet(topFrame.source, topFrame.line);
  }

  return {
    location: {
      file: topFrame.source,
      line: topFrame.line,
      column: topFrame.column,
      function: topFrame.name,
    },
    sourceSnippet,
    stackTrace: stackTrace.slice(0, 5), // Include top 5 frames
  };
}

export async function startDebugging(): Promise<vscode.DebugSession> {
  const startedSuccessfully = await vscode.debug.startDebugging(undefined, {
    type: "debugpy",
    request: "launch",
    name: "My RCDBG Session",
    program: "${file}",
    stopOnEntry: true,
  });
  if (!startedSuccessfully) {
    throw new Error("Failed to start debugging session");
  }

  // Small delay to let the debug session become active
  await new Promise((resolve) => setTimeout(resolve, 2000));

  const debugSession = vscode.debug.activeDebugSession;
  invariant(
    debugSession,
    "Expected to have active debug session, but none found"
  );
  return debugSession;
}

/**
 * Resolve scopes for a given stack frame up to maxDepth.
 * Returns an array of resolved scope objects.
 */
export async function getScopes(
  debugSession: vscode.DebugSession,
  frameId: number,
  options: ScopeOptions = {}
): Promise<AnyObject[]> {
  const {
    maxDepth = 2,
    excludeUnderscoreProps = true,
    maxCollectionSize = 20,
  } = options;

  const visited = new Set<number>();

  const { scopes } = await debugSession.customRequest("scopes", {
    frameId,
  });

  const shouldIncludeVariable = (varName: string): boolean => {
    if (!excludeUnderscoreProps) {
      return true;
    }
    // Exclude variables starting with _ or __ (common Python internals)
    return !varName.startsWith("_");
  };

  const resolveChildren = async (o: any, depth: number = 0): Promise<any> => {
    if (depth >= maxDepth) {
      return { ...o, note: "Max depth reached" };
    }

    const { variablesReference, ...rest } = o;
    if (variablesReference === 0 || visited.has(variablesReference)) {
      return rest;
    }

    visited.add(variablesReference);

    const { variables } = await debugSession.customRequest("variables", {
      variablesReference: o.variablesReference,
    });

    // Filter variables based on options
    let filteredVariables = variables.filter((v: any) =>
      shouldIncludeVariable(v.name)
    );

    // Limit collection size if needed
    const originalCount = filteredVariables.length;
    if (filteredVariables.length > maxCollectionSize) {
      filteredVariables = filteredVariables.slice(0, maxCollectionSize);
    }

    const resolvedVariables = await Promise.all(
      filteredVariables.map((v: any) => resolveChildren(v, depth + 1))
    );

    // Add note if we truncated the collection
    const result: any = {
      ...rest,
      variables: resolvedVariables,
    };

    if (originalCount > maxCollectionSize) {
      result.note = `Showing ${maxCollectionSize} of ${originalCount} items`;
    }

    return result;
  };

  return Promise.all(scopes.map(resolveChildren));
}

/**
 * Steps once using the given step command (e.g. "workbench.action.debug.stepInto")
 * and returns the execution context and resolved scopes for the new active stack frame.
 */
export async function stepAndGetVariables(
  stepCommand: string,
  options: ScopeOptions = {}
): Promise<StepResult> {
  // perform the step action in the workbench
  await vscode.commands.executeCommand(stepCommand);

  // Small delay to ensure debug state is updated
  await new Promise((resolve) => setTimeout(resolve, 100));

  const activeStackItem = vscode.debug.activeStackItem;
  invariant(activeStackItem, "Expected to have active stack frame");
  invariant(
    "frameId" in activeStackItem,
    "Expected stack frame, got thread, vscode api sucks x_x"
  );

  const debugSession = vscode.debug.activeDebugSession;
  invariant(debugSession, "Expected to have active debug session");

  // Get execution context (location, source snippet, stack trace)
  const executionContext = await getExecutionContext(debugSession);

  // Get variable scopes with filtering
  const scopes = await getScopes(debugSession, activeStackItem.frameId, options);

  return {
    executionContext,
    scopes,
  };
}

export async function stopDebugging(debugSession: vscode.DebugSession) {
  await vscode.debug.stopDebugging(debugSession);
}
