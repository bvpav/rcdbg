import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";

/**
 * Shows a diff preview and asks for user consent before applying changes
 * @param oldText Original file content (empty string for new files)
 * @param newText New file content after changes
 * @param targetPath Path to the file being modified
 * @returns true if user accepted, false if cancelled
 */
export async function showDiffAndConfirm(
  oldText: string,
  newText: string,
  targetPath: string
): Promise<boolean> {
  // Create temporary documents for diff view
  const oldUri = vscode.Uri.parse(
    `untitled:${path.basename(targetPath)}.old`
  );
  const newUri = vscode.Uri.parse(
    `untitled:${path.basename(targetPath)}.new`
  );

  // Open diff editor
  try {
    // Create temporary files for comparison
    const oldDoc = await vscode.workspace.openTextDocument(
      oldUri.with({ scheme: "untitled" })
    );
    const newDoc = await vscode.workspace.openTextDocument(
      newUri.with({ scheme: "untitled" })
    );

    const oldEditor = await vscode.window.showTextDocument(oldDoc, {
      preview: true,
      preserveFocus: false,
    });
    await oldEditor.edit((editBuilder) => {
      editBuilder.insert(new vscode.Position(0, 0), oldText || "// Empty file");
    });

    const newEditor = await vscode.window.showTextDocument(newDoc, {
      preview: true,
      preserveFocus: false,
    });
    await newEditor.edit((editBuilder) => {
      editBuilder.insert(new vscode.Position(0, 0), newText);
    });

    // Show diff
    await vscode.commands.executeCommand(
      "vscode.diff",
      oldDoc.uri,
      newDoc.uri,
      `RCDBG Config: ${path.basename(targetPath)} (Before ↔ After)`
    );

    // Show confirmation dialog
    const action = await vscode.window.showInformationMessage(
      `Apply changes to ${targetPath}?\n\n` +
        `✓ A backup will be created at ${targetPath}.bak\n` +
        `✓ You can revert using "RCDBG: Disable MCP"\n` +
        `✓ Review the diff to see what will change`,
      { modal: true },
      "Apply Changes",
      "Cancel"
    );

    // Close temporary documents
    await vscode.commands.executeCommand(
      "workbench.action.closeActiveEditor"
    );

    return action === "Apply Changes";
  } catch (err: any) {
    vscode.window.showErrorMessage(
      `Failed to show diff preview: ${err.message}`
    );
    return false;
  }
}

/**
 * Creates a backup of the file and writes new content
 * @param targetPath Path to file to modify
 * @param newContent New file content
 */
export async function backupAndWriteFile(
  targetPath: string,
  newContent: string
): Promise<void> {
  try {
    // Create backup if file exists
    if (fs.existsSync(targetPath)) {
      const backupPath = `${targetPath}.bak`;
      const originalContent = fs.readFileSync(targetPath, "utf-8");
      fs.writeFileSync(backupPath, originalContent, "utf-8");

      vscode.window.showInformationMessage(
        `Backup created at ${backupPath}`
      );
    }

    // Write new content
    const parentDir = path.dirname(targetPath);
    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true });
    }

    fs.writeFileSync(targetPath, newContent, "utf-8");
  } catch (err: any) {
    throw new Error(`Failed to write file: ${err.message}`);
  }
}

/**
 * Restores a file from its backup
 * @param targetPath Path to file to restore
 * @returns true if restored successfully
 */
export async function restoreFromBackup(
  targetPath: string
): Promise<boolean> {
  const backupPath = `${targetPath}.bak`;

  try {
    if (!fs.existsSync(backupPath)) {
      vscode.window.showWarningMessage(
        `No backup found at ${backupPath}`
      );
      return false;
    }

    const backupContent = fs.readFileSync(backupPath, "utf-8");
    fs.writeFileSync(targetPath, backupContent, "utf-8");

    vscode.window.showInformationMessage(
      `Configuration restored from backup`
    );

    return true;
  } catch (err: any) {
    vscode.window.showErrorMessage(
      `Failed to restore from backup: ${err.message}`
    );
    return false;
  }
}

/**
 * Shows a progress indicator while executing an async operation
 */
export async function withProgress<T>(
  title: string,
  task: () => Promise<T>
): Promise<T> {
  return vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title,
      cancellable: false,
    },
    async () => {
      return await task();
    }
  );
}

/**
 * Creates a status bar item for MCP server status
 */
export function createMCPStatusBar(): vscode.StatusBarItem {
  const statusBar = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    100
  );

  statusBar.text = "$(debug-disconnect) MCP";
  statusBar.tooltip = "MCP Server: Not Running";
  statusBar.command = "rcdbg.testMcpConnection";

  return statusBar;
}

/**
 * Updates MCP status bar based on server state
 */
export function updateMCPStatus(
  statusBar: vscode.StatusBarItem,
  isRunning: boolean,
  port?: number
): void {
  if (isRunning) {
    statusBar.text = "$(debug-start) MCP";
    statusBar.tooltip = `MCP Server: Running on port ${port || 2114}`;
    statusBar.backgroundColor = undefined;
  } else {
    statusBar.text = "$(debug-disconnect) MCP";
    statusBar.tooltip = "MCP Server: Not Running";
    statusBar.backgroundColor = new vscode.ThemeColor(
      "statusBarItem.warningBackground"
    );
  }

  statusBar.show();
}

/**
 * Shows a detailed information message with options
 */
export async function showSetupGuide(
  hostName: string,
  configMethod: string
): Promise<void> {
  const message =
    `**RCDBG MCP Setup for ${hostName}**\n\n` +
    `${configMethod}\n\n` +
    `This extension will:\n` +
    `• Show you a diff of changes before applying\n` +
    `• Create a backup (.bak) of your existing config\n` +
    `• Allow you to revert changes at any time\n\n` +
    `The MCP server runs locally on your machine (localhost:2114)\n` +
    `and does not send any data externally.`;

  await vscode.window.showInformationMessage(message, { modal: false }, "OK");
}
