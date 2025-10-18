// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import invariant from "tiny-invariant";
import * as vscode from "vscode";
import {
  startDebugging,
  getScopes,
  stepAndGetVariables,
  stopDebugging,
} from "./debugger/api";
import * as mcp from "./debugger/mcp";

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  mcp.listen();

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
      let debugSession;
      try {
        debugSession = await startDebugging();
      } catch (e: any) {
        vscode.window.showErrorMessage(e.message ?? String(e));
        return;
      }

      const scopeSnapshots: any[] = [];

      for (let i = 0; i < 5; i++) {
        // small delay between steps
        await new Promise((resolve) => setTimeout(resolve, 1000));
        const scopes = await stepAndGetVariables(
          "workbench.action.debug.stepInto",
          3
        );
        scopeSnapshots.push(scopes);
        const activeStackItem = vscode.debug.activeStackItem;
        if (activeStackItem && "frameId" in activeStackItem) {
          vscode.window.showInformationMessage(
            `Stepped into frame ${activeStackItem.frameId}`
          );
        }
      }

      await stopDebugging(debugSession);

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
export function deactivate() {
  mcp.close();
}
