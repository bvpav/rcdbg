import * as fs from "fs";
import * as path from "path";
import { Host } from "./host";

/**
 * Validation result for configuration changes
 */
export interface ValidationResult {
  ok: boolean;
  message: string;
  targetPath?: string;
  oldText?: string;
  finalText?: string;
}

/**
 * MCP server configuration for Cursor/Windsurf mcp.json
 */
interface MCPServerConfig {
  command: string;
  args: string[];
  env?: Record<string, string>;
}

/**
 * Cursor/Windsurf mcp.json file structure
 */
interface MCPConfigFile {
  mcpServers?: Record<string, MCPServerConfig>;
}

/**
 * Generates the MCP configuration snippet for the detected host
 */
export async function getConfigSnippet(host: Host): Promise<string> {
  if (host.type === "cursor" || host.type === "windsurf") {
    return generateFileBasedConfig(host);
  }

  if (host.type === "vscode") {
    return generateVSCodeConfig();
  }

  throw new Error(`Unsupported host type: ${host.type}`);
}

/**
 * Generates MCP config for file-based hosts (Cursor, Windsurf)
 */
function generateFileBasedConfig(host: Host): string {
  const config: MCPServerConfig = {
    command: "node",
    args: [
      // This will need to be updated to point to the bundled MCP server
      // For now, we're using a placeholder
      "${extensionPath}/out/debugger/mcp-standalone.js",
    ],
    env: {
      RCDBG_PORT: host.defaultPort.toString(),
    },
  };

  return JSON.stringify(config, null, 2);
}

/**
 * Generates MCP config for VS Code (settings-based)
 */
function generateVSCodeConfig(): string {
  return JSON.stringify(
    {
      "rcdbg.mcp.enabled": true,
      "rcdbg.mcp.autoStart": true,
      "rcdbg.mcp.port": 2114,
    },
    null,
    2
  );
}

/**
 * Validates configuration before applying it
 * For file-based configs, reads existing file and prepares merged result
 */
export async function validateConfig(
  host: Host,
  snippet: string
): Promise<ValidationResult> {
  if (!host.usesConfigFile || !host.configFilePath) {
    // For programmatic settings, validation happens during apply
    return {
      ok: true,
      message: "Configuration ready to apply",
    };
  }

  const targetPath = host.configFilePath;

  try {
    // Check if parent directory exists
    const parentDir = path.dirname(targetPath);
    if (!fs.existsSync(parentDir)) {
      try {
        fs.mkdirSync(parentDir, { recursive: true });
      } catch (err: any) {
        return {
          ok: false,
          message: `Failed to create directory ${parentDir}: ${err.message}`,
        };
      }
    }

    // Read existing config if it exists
    let existingConfig: MCPConfigFile = {};
    let oldText = "";

    if (fs.existsSync(targetPath)) {
      try {
        oldText = fs.readFileSync(targetPath, "utf-8");
        existingConfig = JSON.parse(oldText);
      } catch (err: any) {
        return {
          ok: false,
          message: `Failed to parse existing config at ${targetPath}: ${err.message}`,
        };
      }
    }

    // Merge RCDBG config
    if (!existingConfig.mcpServers) {
      existingConfig.mcpServers = {};
    }

    const rcdbgConfig: MCPServerConfig = JSON.parse(snippet);
    existingConfig.mcpServers.rcdbg = rcdbgConfig;

    const finalText = JSON.stringify(existingConfig, null, 2);

    return {
      ok: true,
      message: "Configuration validated successfully",
      targetPath,
      oldText,
      finalText,
    };
  } catch (err: any) {
    return {
      ok: false,
      message: `Validation failed: ${err.message}`,
    };
  }
}

/**
 * Checks if RCDBG is already configured in the host's config file
 */
export function isAlreadyConfigured(host: Host): boolean {
  if (!host.usesConfigFile || !host.configFilePath) {
    return false;
  }

  try {
    if (!fs.existsSync(host.configFilePath)) {
      return false;
    }

    const content = fs.readFileSync(host.configFilePath, "utf-8");
    const config: MCPConfigFile = JSON.parse(content);

    return (
      config.mcpServers !== undefined &&
      config.mcpServers.rcdbg !== undefined
    );
  } catch {
    return false;
  }
}

/**
 * Removes RCDBG configuration from the host's config file
 * Used for clean uninstall
 */
export async function removeConfig(host: Host): Promise<ValidationResult> {
  if (!host.usesConfigFile || !host.configFilePath) {
    return {
      ok: true,
      message: "No file-based config to remove",
    };
  }

  const targetPath = host.configFilePath;

  try {
    if (!fs.existsSync(targetPath)) {
      return {
        ok: true,
        message: "Config file does not exist",
      };
    }

    const oldText = fs.readFileSync(targetPath, "utf-8");
    const config: MCPConfigFile = JSON.parse(oldText);

    if (!config.mcpServers || !config.mcpServers.rcdbg) {
      return {
        ok: true,
        message: "RCDBG not found in config",
      };
    }

    // Remove RCDBG entry
    delete config.mcpServers.rcdbg;

    // If mcpServers is now empty, optionally remove it
    if (Object.keys(config.mcpServers).length === 0) {
      delete config.mcpServers;
    }

    const finalText = JSON.stringify(config, null, 2);

    return {
      ok: true,
      message: "Config removal validated",
      targetPath,
      oldText,
      finalText,
    };
  } catch (err: any) {
    return {
      ok: false,
      message: `Failed to remove config: ${err.message}`,
    };
  }
}
