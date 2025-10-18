import invariant from "tiny-invariant";
import * as vscode from "vscode";

type AnyObject = { [k: string]: any };

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
  maxDepth: number = 3
): Promise<AnyObject[]> {
  const visited = new Set<number>();

  const { scopes } = await debugSession.customRequest("scopes", {
    frameId,
  });

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

    return {
      ...rest,
      variables: await Promise.all(
        variables.map((v: any) => resolveChildren(v, depth + 1))
      ),
    };
  };

  return Promise.all(scopes.map(resolveChildren));
}

/**
 * Steps once using the given step command (e.g. "workbench.action.debug.stepInto")
 * and returns the resolved scopes for the new active stack frame.
 */
export async function stepAndGetVariables(
  stepCommand: string,
  maxDepth: number = 3
): Promise<AnyObject[]> {
  // perform the step action in the workbench
  await vscode.commands.executeCommand(stepCommand);

  const activeStackItem = vscode.debug.activeStackItem;
  invariant(activeStackItem, "Expected to have active stack frame");
  invariant(
    "frameId" in activeStackItem,
    "Expected stack frame, got thread, vscode api sucks x_x"
  );

  const debugSession = vscode.debug.activeDebugSession;
  invariant(debugSession, "Expected to have active debug session");

  return getScopes(debugSession, activeStackItem.frameId, maxDepth);
}

export async function stopDebugging(debugSession: vscode.DebugSession) {
  await vscode.debug.stopDebugging(debugSession);
}
