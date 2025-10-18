// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import invariant from "tiny-invariant";
import * as vscode from "vscode";

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log('Congratulations, your extension "rcdbg" is now active!');

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json
  let disposable = vscode.commands.registerCommand("rcdbg.helloWorld", () => {
    // The code you place here will be executed every time your command is executed
    // Display a message box to the user
    vscode.window.showInformationMessage("Hello World from rcdbg!");
  });
  context.subscriptions.push(disposable);

  disposable = vscode.commands.registerCommand(
    "rcdbg.fuckWithDebugging",
    async () => {
      const startedSuccessfully = await vscode.debug.startDebugging(undefined, {
        type: "debugpy",
        request: "launch",
        name: "My RCDBG Session",
        program: "${file}",
        stopOnEntry: true,
      });
      if (!startedSuccessfully) {
        vscode.window.showErrorMessage("Failed to start debugging session");
        return;
      }

      // Wait a bit for the debugger to start and keep single stepping
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const debugSession = vscode.debug.activeDebugSession;
      invariant(
        debugSession,
        "Expected to have active debug session, but none found"
      );

      const scopeSnapshots: any[] = [];

      for (let i = 0; i < 5; i++) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        await vscode.commands.executeCommand("workbench.action.debug.stepInto");

        const activeStackItem = vscode.debug.activeStackItem;
        invariant(activeStackItem, "Expected to have active stack frame");
        invariant(
          "frameId" in activeStackItem,
          "Expected stack frame, got thread, vscode api sucks x_x"
        );

        vscode.window.showInformationMessage(
          `Stepped into frame ${activeStackItem.frameId}`
        );

        const visited = new Set<number>();
        const { scopes } = await debugSession.customRequest("scopes", {
          frameId: activeStackItem.frameId,
        });

        const maxDepth = 3;

        const resolveChildren = async (o: any, depth: number = 0) => {
          if (depth >= maxDepth) {
            return { ...o, note: "Max depth reached" };
          }

          const { variablesReference, ...rest } = o;
          if (variablesReference === 0 || visited.has(variablesReference)) {
            return rest;
          }

          visited.add(variablesReference);

          console.log(
            "Resolving children for",
            o.name,
            variablesReference,
            "depth",
            depth
          );
          const { variables } = await debugSession.customRequest("variables", {
            variablesReference: o.variablesReference,
          });
          return {
            ...rest,
            variables: await Promise.all(
              variables.map((o: any) => resolveChildren(o, depth + 1))
            ),
          };
        };
        scopeSnapshots.push(await Promise.all(scopes.map(resolveChildren)));
      }

      const scopesJson = JSON.stringify(scopeSnapshots, null, 2);
      const doc = await vscode.workspace.openTextDocument({
        content: scopesJson,
        language: "json",
      });
      await vscode.window.showTextDocument(doc, { preview: false });
    }
  );
  context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}
