import * as vscode from "vscode";
import * as os from "os";
import * as path from "path";

/**
 * Represents the detected host environment and its capabilities
 */
export interface Host {
  /** Host type identifier */
  type: "vscode" | "cursor" | "windsurf" | "unknown";
  /** Human-readable name */
  name: string;
  /** Can configure via VS Code Settings API */
  supportsProgrammaticSettings: boolean;
  /** Uses a config file (like ~/.cursor/mcp.json) */
  usesConfigFile: boolean;
  /** Path to config file if usesConfigFile is true */
  configFilePath?: string;
  /** Default MCP server port for this host */
  defaultPort: number;
}

/**
 * Detects the current host environment (VS Code, Cursor, Windsurf, etc.)
 * using documented VS Code APIs only
 */
export function detectHost(): Host {
  const appName = vscode.env.appName.toLowerCase();
  const uriScheme = vscode.env.uriScheme.toLowerCase();

  // Detect Cursor
  if (appName.includes("cursor") || uriScheme.includes("cursor")) {
    return {
      type: "cursor",
      name: "Cursor",
      supportsProgrammaticSettings: false,
      usesConfigFile: true,
      configFilePath: getCursorConfigPath(),
      defaultPort: 2114,
    };
  }

  // Detect Windsurf
  if (appName.includes("windsurf") || uriScheme.includes("windsurf")) {
    return {
      type: "windsurf",
      name: "Windsurf",
      supportsProgrammaticSettings: false,
      usesConfigFile: true,
      configFilePath: getWindsurfConfigPath(),
      defaultPort: 2114,
    };
  }

  // Default to VS Code
  return {
    type: "vscode",
    name: "Visual Studio Code",
    supportsProgrammaticSettings: true,
    usesConfigFile: false,
    defaultPort: 2114,
  };
}

/**
 * Gets the path to Cursor's MCP configuration file
 * Cursor stores MCP configuration in ~/.cursor/mcp.json
 */
function getCursorConfigPath(): string {
  const homeDir = os.homedir();
  return path.join(homeDir, ".cursor", "mcp.json");
}

/**
 * Gets the path to Windsurf's MCP configuration file
 * Note: This is based on common patterns. May need adjustment
 * based on actual Windsurf implementation
 */
function getWindsurfConfigPath(): string {
  const homeDir = os.homedir();
  // Windsurf likely follows similar pattern to Cursor
  // This may need to be updated based on actual Windsurf behavior
  return path.join(homeDir, ".windsurf", "mcp.json");
}

/**
 * Validates that the host environment supports MCP integration
 */
export function isHostSupported(host: Host): boolean {
  return (
    host.supportsProgrammaticSettings || host.usesConfigFile
  );
}

/**
 * Gets a human-readable description of how MCP will be configured
 * for the detected host
 */
export function getConfigurationMethod(host: Host): string {
  if (host.supportsProgrammaticSettings) {
    return "Configuration will be applied via VS Code Settings API";
  }

  if (host.usesConfigFile && host.configFilePath) {
    return `Configuration will be written to ${host.configFilePath}`;
  }

  return "Configuration will need to be applied manually";
}
