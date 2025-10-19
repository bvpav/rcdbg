import * as vscode from "vscode";
import { detectHost, getConfigurationMethod } from "./host";
import { getConfigSnippet, validateConfig, isAlreadyConfigured, removeConfig } from "./configs";
import {
  showDiffAndConfirm,
  backupAndWriteFile,
  restoreFromBackup,
  withProgress,
  createMCPStatusBar,
  updateMCPStatus,
  showSetupGuide
} from "./ui";
import * as mcp from "../debugger/mcp";

let statusBarItem: vscode.StatusBarItem | undefined;

export async function activate(ctx: vscode.ExtensionContext) {
  // Create status bar item
  statusBarItem = createMCPStatusBar();
  ctx.subscriptions.push(statusBarItem);

  // Update status bar based on MCP server state
  updateMCPStatus(statusBarItem, mcp.isRunning(), mcp.getPort());

  // Register: Enable MCP
  ctx.subscriptions.push(
    vscode.commands.registerCommand("rcdbg.enableMcp", async () => {
      const host = detectHost();

      // Show setup guide
      await showSetupGuide(host.name, getConfigurationMethod(host));

      // Check if already configured
      if (isAlreadyConfigured(host)) {
        const reconfigure = await vscode.window.showWarningMessage(
          `RCDBG MCP is already configured for ${host.name}. Do you want to reconfigure?`,
          "Yes, Reconfigure",
          "Cancel"
        );
        if (reconfigure !== "Yes, Reconfigure") {
          return;
        }
      }

      const consent = await vscode.window.showQuickPick(
        [
          { label: "✓ Enable for this editor", description: host.name },
          { label: "✗ Cancel" },
        ],
        { placeHolder: "Set up MCP server integration" }
      );

      if (!consent || consent.label.includes("Cancel")) {
        return;
      }

      await withProgress("Configuring MCP server...", async () => {
        const snippet = await getConfigSnippet(host);
        const plan = await validateConfig(host, snippet);

        if (!plan.ok) {
          vscode.window.showErrorMessage(`Configuration failed: ${plan.message}`);
          return;
        }

        if (host.supportsProgrammaticSettings) {
          // Use standard settings API
          const cfg = vscode.workspace.getConfiguration("rcdbg");
          await cfg.update(
            "mcp.enabled",
            true,
            vscode.ConfigurationTarget.Global
          );
          await cfg.update(
            "mcp.autoStart",
            true,
            vscode.ConfigurationTarget.Global
          );
          vscode.window.showInformationMessage("✓ MCP server enabled in settings");
        } else if (host.usesConfigFile && plan.targetPath && plan.finalText) {
          const accepted = await showDiffAndConfirm(
            plan.oldText || "",
            plan.finalText,
            plan.targetPath
          );

          if (!accepted) {
            vscode.window.showInformationMessage("Configuration cancelled");
            return;
          }

          await backupAndWriteFile(plan.targetPath, plan.finalText);
          vscode.window.showInformationMessage(
            `✓ MCP configuration applied to ${plan.targetPath}\n\n` +
            `Please restart ${host.name} for changes to take effect.`
          );
        } else {
          // Fallback: copy + open
          await vscode.env.clipboard.writeText(snippet);
          await vscode.commands.executeCommand(
            "workbench.action.openSettingsJson"
          );
          vscode.window.showInformationMessage(
            "✓ Configuration copied to clipboard.\n" +
            "Please paste it into your settings file."
          );
        }
      });
    })
  );

  // Register: Test MCP Connection
  ctx.subscriptions.push(
    vscode.commands.registerCommand("rcdbg.testMcpConnection", async () => {
      const port = mcp.getPort();

      await withProgress("Testing MCP server connection...", async () => {
        try {
          const response = await fetch(`http://localhost:${port}/health`);

          if (response.ok) {
            const data = await response.json() as { status: string; version: string };
            vscode.window.showInformationMessage(
              `✓ MCP Server is running!\n\n` +
              `Port: ${port}\n` +
              `Status: ${data.status}\n` +
              `Version: ${data.version}`
            );
            updateMCPStatus(statusBarItem!, true, port);
          } else {
            throw new Error(`Server responded with status ${response.status}`);
          }
        } catch (err: any) {
          vscode.window.showErrorMessage(
            `✗ MCP Server is not responding\n\n` +
            `Error: ${err.message}\n\n` +
            `Try running "RCDBG: Start MCP Server" to start it.`
          );
          updateMCPStatus(statusBarItem!, false);
        }
      });
    })
  );

  // Register: Start MCP Server
  ctx.subscriptions.push(
    vscode.commands.registerCommand("rcdbg.startMcpServer", async () => {
      if (mcp.isRunning()) {
        vscode.window.showInformationMessage(
          `MCP Server is already running on port ${mcp.getPort()}`
        );
        return;
      }

      await withProgress("Starting MCP server...", async () => {
        try {
          mcp.listen();
          const port = mcp.getPort();
          vscode.window.showInformationMessage(
            `✓ MCP Server started on port ${port}`
          );
          updateMCPStatus(statusBarItem!, true, port);
        } catch (err: any) {
          vscode.window.showErrorMessage(
            `Failed to start MCP server: ${err.message}`
          );
        }
      });
    })
  );

  // Register: Stop MCP Server
  ctx.subscriptions.push(
    vscode.commands.registerCommand("rcdbg.stopMcpServer", async () => {
      if (!mcp.isRunning()) {
        vscode.window.showInformationMessage("MCP Server is not running");
        return;
      }

      await withProgress("Stopping MCP server...", async () => {
        try {
          mcp.close();
          vscode.window.showInformationMessage("✓ MCP Server stopped");
          updateMCPStatus(statusBarItem!, false);
        } catch (err: any) {
          vscode.window.showErrorMessage(
            `Failed to stop MCP server: ${err.message}`
          );
        }
      });
    })
  );

  // Register: Disable MCP
  ctx.subscriptions.push(
    vscode.commands.registerCommand("rcdbg.disableMcp", async () => {
      const host = detectHost();

      if (!isAlreadyConfigured(host)) {
        vscode.window.showInformationMessage(
          "RCDBG MCP is not currently configured"
        );
        return;
      }

      const confirm = await vscode.window.showWarningMessage(
        `Remove RCDBG MCP configuration from ${host.name}?`,
        { modal: true },
        "Remove Configuration",
        "Cancel"
      );

      if (confirm !== "Remove Configuration") {
        return;
      }

      await withProgress("Removing MCP configuration...", async () => {
        const result = await removeConfig(host);

        if (!result.ok) {
          vscode.window.showErrorMessage(
            `Failed to remove configuration: ${result.message}`
          );
          return;
        }

        if (host.usesConfigFile && result.targetPath && result.finalText) {
          const accepted = await showDiffAndConfirm(
            result.oldText || "",
            result.finalText,
            result.targetPath
          );

          if (!accepted) {
            return;
          }

          await backupAndWriteFile(result.targetPath, result.finalText);
          vscode.window.showInformationMessage(
            `✓ RCDBG configuration removed from ${result.targetPath}`
          );
        } else if (host.supportsProgrammaticSettings) {
          const cfg = vscode.workspace.getConfiguration("rcdbg");
          await cfg.update(
            "mcp.enabled",
            false,
            vscode.ConfigurationTarget.Global
          );
          vscode.window.showInformationMessage(
            "✓ RCDBG MCP disabled in settings"
          );
        }
      });
    })
  );

  // Register: Cleanup MCP (for uninstall)
  ctx.subscriptions.push(
    vscode.commands.registerCommand("rcdbg.cleanupMcp", async () => {
      const host = detectHost();

      const confirm = await vscode.window.showWarningMessage(
        `This will remove all RCDBG configuration from ${host.name}.\n\n` +
        `Use this before uninstalling the extension.\n\n` +
        `Continue?`,
        { modal: true },
        "Yes, Clean Up",
        "Cancel"
      );

      if (confirm !== "Yes, Clean Up") {
        return;
      }

      // Stop MCP server if running
      if (mcp.isRunning()) {
        mcp.close();
      }

      // Remove configuration
      await vscode.commands.executeCommand("rcdbg.disableMcp");

      vscode.window.showInformationMessage(
        "✓ RCDBG cleanup complete. You can now safely uninstall the extension."
      );
    })
  );
}

export function deactivate() {
  if (statusBarItem) {
    statusBarItem.dispose();
  }
}
