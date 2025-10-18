export function getChatWebviewContent(): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>RCDBG API Chat</title>
    <style>
        body {
            font-family: var(--vscode-font-family);
            background-color: var(--vscode-editor-background);
            color: var(--vscode-editor-foreground);
            margin: 0;
            padding: 15px;
            height: 100vh;
            display: flex;
            flex-direction: column;
        }
        .header {
            background-color: var(--vscode-titleBar-activeBackground);
            color: var(--vscode-titleBar-activeForeground);
            padding: 8px 12px;
            margin: -15px -15px 0 -15px;
            font-weight: bold;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .debug-button {
            padding: 6px 12px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-weight: bold;
            transition: background-color 0.2s;
        }
        .debug-button.build {
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
        }
        .debug-button.build:hover {
            background-color: var(--vscode-button-hoverBackground);
        }
        .debug-button.debug {
            background-color: var(--vscode-errorForeground);
            color: white;
        }
        .debug-button.debug:hover {
            background-color: var(--vscode-errorForeground);
            opacity: 0.8;
        }
        .status {
            font-size: 12px;
            color: var(--vscode-descriptionForeground);
            margin: 15px 0 10px 0;
            padding: 8px;
            background-color: var(--vscode-sideBar-background);
            border-radius: 4px;
        }
        .chat-container {
            flex: 1;
            display: flex;
            flex-direction: column;
            max-height: calc(100vh - 120px);
        }
        .messages {
            flex: 1;
            overflow-y: auto;
            border: 1px solid var(--vscode-panel-border);
            padding: 10px;
            margin-bottom: 10px;
            border-radius: 4px;
            background-color: var(--vscode-editor-background);
        }
        .message {
            margin-bottom: 10px;
            padding: 8px;
            border-radius: 4px;
            word-wrap: break-word;
        }
        .message.user {
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            margin-left: 20px;
        }
        .message.api {
            background-color: var(--vscode-textCodeBlock-background);
            border-left: 3px solid var(--vscode-notificationsInfoIcon-foreground);
            padding-left: 12px;
        }
        .message.system {
            background-color: var(--vscode-sideBar-background);
            border-left: 3px solid var(--vscode-notificationsWarningIcon-foreground);
            padding-left: 12px;
            font-style: italic;
        }
        .input-container {
            display: flex;
            gap: 10px;
        }
        .message-input {
            flex: 1;
            padding: 8px;
            background-color: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            border: 1px solid var(--vscode-input-border);
            border-radius: 4px;
        }
        .send-button {
            padding: 8px 16px;
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            border-radius: 4px;
            cursor: pointer;
        }
        .send-button:hover {
            background-color: var(--vscode-button-hoverBackground);
        }
        .send-button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
    </style>
</head>
<body>
    <div class="header">
        <span>🔗 API Chat Interface</span>
        <button class="debug-button build" id="debugButton" onclick="toggleDebug()">Debug</button>
    </div>
    <div class="status" id="status">🔨 Build mode active - Click Debug to switch to debug monitoring</div>
    <div class="chat-container">
        <div class="messages" id="messages"></div>
        <div class="input-container">
            <input type="text" class="message-input" id="messageInput" placeholder="Send build command to API...">
            <button class="send-button" id="sendButton" onclick="sendMessage()">Send</button>
        </div>
    </div>

    <script>
        const vscode = acquireVsCodeApi();
        const messagesContainer = document.getElementById('messages');
        const messageInput = document.getElementById('messageInput');
        const debugButton = document.getElementById('debugButton');
        const status = document.getElementById('status');
        const sendButton = document.getElementById('sendButton');
        
        let isDebugging = false;

        window.addEventListener('message', event => {
            const message = event.data;
            switch (message.command) {
                case 'addMessage':
                    addMessage(message.text, message.sender);
                    break;
                case 'updateDebugState':
                    updateDebugState(message.isDebugging);
                    break;
            }
        });

        function addMessage(text, sender) {
            const messageDiv = document.createElement('div');
            messageDiv.className = \`message \${sender}\`;
            messageDiv.textContent = text;
            messagesContainer.appendChild(messageDiv);
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }

        function toggleDebug() {
            vscode.postMessage({
                command: 'toggleDebug'
            });
        }

        function updateDebugState(debugging) {
            isDebugging = debugging;
            debugButton.textContent = debugging ? 'Build' : 'Debug';
            debugButton.className = debugging ? 'debug-button debug' : 'debug-button build';
            status.textContent = debugging ? 
                '🟢 Debug mode active - Runtime monitoring enabled' : 
                '🔨 Build mode active - Compilation and optimization ready';
            
            messageInput.placeholder = debugging ? 
                'Send debug command to API...' : 
                'Send build command to API...';
        }

        function sendMessage() {
            const text = messageInput.value.trim();
            if (text) {
                addMessage(text, 'user');
                vscode.postMessage({
                    command: 'sendMessage',
                    text: text
                });
                messageInput.value = '';
            }
        }

        messageInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });
    </script>
</body>
</html>`;
}