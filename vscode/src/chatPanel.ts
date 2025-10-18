import * as vscode from "vscode";
import { getChatWebviewContent } from "./ui/chatWebview";

export class ChatPanelManager {
	private chatPanel: vscode.WebviewPanel | undefined;
	private isDebugging = false;
	private context: vscode.ExtensionContext;

	constructor(context: vscode.ExtensionContext) {
		this.context = context;
	}

	public openChatPanel() {
		if (this.chatPanel) {
			this.chatPanel.reveal(vscode.ViewColumn.Two);
			return;
		}

		this.chatPanel = vscode.window.createWebviewPanel(
			"rcdbgChat",
			"RCDBG API Chat",
			vscode.ViewColumn.Two,
			{
				enableScripts: true,
				retainContextWhenHidden: true,
			},
		);

		this.chatPanel.webview.html = getChatWebviewContent();

		this.chatPanel.webview.onDidReceiveMessage(
			(message) => {
				switch (message.command) {
					case "sendMessage":
						this.simulateApiResponse(message.text);
						break;
					case "toggleDebug":
						this.toggleDebugMode();
						break;
				}
			},
			undefined,
			this.context.subscriptions,
		);

		this.chatPanel.onDidDispose(() => {
			this.chatPanel = undefined;
			this.isDebugging = false;
		});
	}

	private toggleDebugMode() {
		this.isDebugging = !this.isDebugging;

		this.chatPanel?.webview.postMessage({
			command: "updateDebugState",
			isDebugging: this.isDebugging,
		});

		const statusMessage = this.isDebugging
			? "🟢 Debug mode started. API monitoring active."
			: "🔨 Build mode activated. Ready for production builds.";

		this.chatPanel?.webview.postMessage({
			command: "addMessage",
			text: statusMessage,
			sender: "system",
		});
	}

	private simulateApiResponse(userMessage: string) {
		// Simulate API processing delay
		setTimeout(() => {
			let apiResponse = "";

			if (this.isDebugging) {
				// Debug mode responses
				if (userMessage.toLowerCase().includes("hello")) {
					apiResponse = "API: Hello! Debug session is active. How can I help?";
				} else if (userMessage.toLowerCase().includes("status")) {
					apiResponse =
						"API: Debug Status - Breakpoints active, variable inspection enabled.";
				} else if (userMessage.toLowerCase().includes("test")) {
					apiResponse =
						"API: Debug test successful. Monitoring all debug events.";
				} else {
					apiResponse = `API: Debug received "${userMessage}". Analyzing runtime state.`;
				}
			} else {
				// Build mode responses
				if (userMessage.toLowerCase().includes("hello")) {
					apiResponse =
						"API: Hello! Build mode is active. Ready for compilation.";
				} else if (userMessage.toLowerCase().includes("status")) {
					apiResponse =
						"API: Build Status - Compiler ready, optimization enabled.";
				} else if (userMessage.toLowerCase().includes("build")) {
					apiResponse =
						"API: Starting build process... Compiling sources and optimizing output.";
				} else if (userMessage.toLowerCase().includes("test")) {
					apiResponse =
						"API: Build test successful. All dependencies resolved.";
				} else {
					apiResponse = `API: Build received "${userMessage}". Processing for compilation.`;
				}
			}

			this.chatPanel?.webview.postMessage({
				command: "addMessage",
				text: apiResponse,
				sender: "api",
			});
		}, 500);
	}

	public dispose() {
		this.chatPanel?.dispose();
		this.chatPanel = undefined;
		this.isDebugging = false;
	}
}
