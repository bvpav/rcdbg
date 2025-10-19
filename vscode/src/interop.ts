import * as vscode from "vscode";

const mcpConfigKey = "reality-check-debugger";

export function addVscodeMcpConfig() {
  const config = vscode.workspace.getConfiguration();
  const mcpConfig = config.get(mcpConfigKey);
  if (!mcpConfig) {
    config.update(
      mcpConfigKey,
      {
        host: "localhost",
        port: 9229,
      },
      vscode.ConfigurationTarget.Workspace
    );
  }
}
