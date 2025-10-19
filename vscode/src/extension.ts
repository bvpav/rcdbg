import * as vscode from "vscode";
import * as agent from "./agent";
import * as mcp from "./debugger/mcp";

export function activate(context: vscode.ExtensionContext) {
  mcp.listen();

  agent.activate(context);
}

export function deactivate() {
  mcp.close();
}
