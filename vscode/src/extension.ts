// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import { ChatPanelManager } from "./chatPanel";
import { registerFixPythonScriptCommand } from "./fixPythonScript";

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log('Congratulations, your extension "rcdbg" is now active!');

  // Initialize chat panel manager
  chatPanelManager = new ChatPanelManager(context);

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json
  const disposable = vscode.commands.registerCommand("rcdbg.helloWorld", () => {
    // The code you place here will be executed every time your command is executed
    // Display a message box to the user
    chatPanelManager?.openChatPanel();
  });

  const openChatCommand = vscode.commands.registerCommand(
    "rcdbg.openChatPanel",
    () => {
      chatPanelManager?.openChatPanel();
    },
  );

  const debugSessionStarted = vscode.debug.onDidStartDebugSession(() => {
    chatPanelManager?.openChatPanel();
  });

  context.subscriptions.push(disposable, openChatCommand, debugSessionStarted);
  registerFixPythonScriptCommand(context);

  context.subscriptions.push(disposable);
}

// Global reference for cleanup
let chatPanelManager: ChatPanelManager | undefined;

// This method is called when your extension is deactivated
export function deactivate() {
  chatPanelManager?.dispose();
}
