export function getChatWebviewContent(): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>RCDBG API Chat</title>
    <style>
        :root {
            color-scheme: dark;
            --rc-bg: #02040a;
            --rc-foreground: #0d1116;
            --rc-blue: #74daff;
            --rc-green: #34ee89;
            --rc-text: #f4fbff;
            --rc-muted: rgba(244, 251, 255, 0.6);
        }
        * {
            box-sizing: border-box;
        }
        body {
            margin: 0;
            height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            background: var(--rc-bg);
            font-family: var(--vscode-font-family, 'Segoe UI', sans-serif);
            color: var(--rc-text);
            padding: 48px 24px;
        }
        .chat-shell {
            width: min(560px, calc(100vw - 48px));
            min-width: 360px;
            height: clamp(360px, calc(100vh - 96px), 720px);
            display: flex;
            flex-direction: column;
            align-items: stretch;
            justify-content: flex-start;
            padding: 32px 36px 28px;
            gap: 24px;
        }
        .header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 12px 18px;
            border-radius: 16px;
            border: 1px solid rgba(116, 218, 255, 0.18);
            background: rgba(2, 4, 10, 0.7);
            font-size: 13px;
            letter-spacing: 0.04em;
        }
        .header span {
            text-transform: uppercase;
            color: var(--rc-muted);
        }
        .debug-button {
            padding: 8px 16px;
            border-radius: 999px;
            border: 1px solid rgba(116, 218, 255, 0.35);
            background: linear-gradient(135deg, rgba(116, 218, 255, 0.3), rgba(52, 238, 137, 0.25));
            color: var(--rc-text);
            font-weight: 700;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.12em;
            cursor: pointer;
            transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .debug-button.debug {
            border-color: rgba(52, 238, 137, 0.55);
            background: rgba(52, 238, 137, 0.3);
        }
        .debug-button:hover {
            transform: translateY(-1px);
            box-shadow: 0 14px 28px rgba(116, 218, 255, 0.25);
        }
        .status {
            display: none;
            font-size: 12px;
            color: var(--rc-muted);
            padding: 12px 16px;
            border-radius: 14px;
            border: 1px solid rgba(116, 218, 255, 0.12);
            background: rgba(2, 4, 10, 0.55);
        }
        .hero {
            flex: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 24px;
            width: 100%;
        }
        .logo-wrapper {
            width: 90px;
            max-width: 50%;
        }
        .logo-wrapper img {
            width: 100%;
            height: auto;
            display: block;
        }
        .messages {
            display: none;
            flex: 1;
            flex-direction: column;
            gap: 12px;
            width: 100%;
            overflow-y: auto;
            padding-right: 4px;
        }
        .message {
            padding: 12px 16px;
            border-radius: 12px;
            background: rgba(13, 17, 22, 0.8);
            color: var(--rc-text);
            max-width: 80%;
            line-height: 1.5;
            border: 1px solid rgba(116, 218, 255, 0.2);
        }
        .message.user {
            align-self: flex-end;
            background: rgba(116, 218, 255, 0.12);
            border-color: rgba(116, 218, 255, 0.5);
        }
        .message.api {
            align-self: flex-start;
        }
        .message.system {
            font-style: italic;
            border-color: rgba(52, 238, 137, 0.45);
        }
        .input-wrapper {
            width: 100%;
            border-radius: 16px;
            padding: 2px;
            background: linear-gradient(135deg, var(--rc-blue), var(--rc-green));
            margin-top: auto;
        }
        body:not(.chat-active) .header,
        body:not(.chat-active) .status,
        body:not(.chat-active) .messages {
            display: none;
        }
        body.chat-active .hero {
            display: none;
        }
        body.chat-active .status {
            display: block;
        }
        body.chat-active .messages {
            display: flex;
        }
        .input-container {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 14px 18px;
            border-radius: 14px;
            background: var(--rc-bg);
        }
        .message-input {
            flex: 1;
            background: transparent;
            border: none;
            color: var(--rc-text);
            font-size: 15px;
            font-weight: 500;
            outline: none;
        }
        .message-input::placeholder {
            color: var(--rc-muted);
        }
        .send-button {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            padding: 0;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            border: none;
            background: linear-gradient(135deg, var(--rc-blue), var(--rc-green));
            color: var(--rc-foreground);
            font-weight: 700;
            cursor: pointer;
        }
        .send-button span {
            font-size: 16px;
        }
        .send-button:disabled {
            opacity: 0.45;
            cursor: not-allowed;
        }
        @media (max-width: 540px) {
            body {
                padding: 32px 16px;
            }
            .chat-shell {
                width: calc(100vw - 32px);
                min-width: unset;
                padding: 24px 24px 20px;
            }
        }
    </style>
</head>
<body>
    <div class="chat-shell">
        <div class="header" id="header">
            <span>Reality Check · Command Link</span>
            <button class="debug-button" id="debugButton">Debug</button>
        </div>
        <div class="status" id="status">🔨 Build mode ready – compile and optimize with Reality Check.</div>
        <div class="hero">
            <div class="logo-wrapper">
                <img src="data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+CjwhRE9DVFlQRSBzdmcgUFVCTElDICItLy9XM0MvL0RURCBTVkcgMS4xLy9FTiIgImh0dHA6Ly93d3cudzMub3JnL0dyYXBoaWNzL1NWRy8xLjEvRFREL3N2ZzExLmR0ZCI+Cjxzdmcgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgdmlld0JveD0iMCAwIDMzNSA2MDciIHZlcnNpb249IjEuMSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayIgeG1sOnNwYWNlPSJwcmVzZXJ2ZSIgeG1sbnM6c2VyaWY9Imh0dHA6Ly93d3cuc2VyaWYuY29tLyIgc3R5bGU9ImZpbGwtcnVsZTpldmVub2RkO2NsaXAtcnVsZTpldmVub2RkO3N0cm9rZS1saW5lam9pbjpyb3VuZDtzdHJva2UtbWl0ZXJsaW1pdDoyOyI+CiAgICA8ZyB0cmFuc2Zvcm09Im1hdHJpeCgxLDAsMCwxLC02NC4zODc1LC01NS4xMTMyKSI+CiAgICAgICAgPGcgdHJhbnNmb3JtPSJtYXRyaXgoMC4yNTY3NTcsMCwwLDAuMjU2NzU3LDQ5LjIyNDcsLTkxLjk2NTkpIj4KICAgICAgICAgICAgPGc+CiAgICAgICAgICAgICAgICA8ZyB0cmFuc2Zvcm09Im1hdHJpeCgyLjcxMDA4LDAsMCwxLjU2NTQxLC0xMzQ4LjE5LC05OTQuODU5KSI+CiAgICAgICAgICAgICAgICAgICAgPHJlY3QgeD0iNTE5LjI2MiIgeT0iMTAwMS40NiIgd2lkdGg9IjIxNy45MDkiIGhlaWdodD0iMTUwOSIgc3R5bGU9ImZpbGw6cmdiKDUyLDIzOCwxMzcpOyIvPgogICAgICAgICAgICAgICAgPC9nPgogICAgICAgICAgICAgICAgPGcgdHJhbnNmb3JtPSJtYXRyaXgoOS42MzI4MywwLDAsOS42MzI4MywtMTM2NDAuNywtMTI4NTMpIj4KICAgICAgICAgICAgICAgICAgICA8cGF0aCBkPSJNMTQ5NS45NCwxMzkzLjc2TDE0OTUuOTQsMTQzMi45NkMxNTA4LjE0LDE0MzIuOTYgMTUxOC4wNSwxNDQyLjg2IDE1MTguMDUsMTQ1NS4wNkMxNTE4LjA1LDE0NjcuMjYgMTUwOC4xNCwxNDc3LjE2IDE0OTUuOTQsMTQ3Ny4xNkwxNDk1Ljk0LDE1MTYuMzdDMTUyOS43OCwxNTE2LjM3IDE1NTcuMjUsMTQ4OC45IDE1NTcuMjUsMTQ1NS4wNkMxNTU3LjI1LDE0MjEuMjMgMTUyOS43OCwxMzkzLjc2IDE0OTUuOTQsMTM5My43NloiIHN0eWxlPSJmaWxsOnJnYig1MiwyMzgsMTM3KTsiLz4KICAgICAgICAgICAgICAgIDwvZz4KICAgICAgICAgICAgICAgIDxnIHRyYW5zZm9ybT0ibWF0cml4KDkuNjMyODMsMCwwLDkuNjMyODMsLTEzMDUwLjIsLTExNjcxLjkpIj4KICAgICAgICAgICAgICAgICAgICA8cGF0aCBkPSJNMTQ5NS45NCwxNTE2LjM3QzE0NjIuMTEsMTUxNi4zNyAxNDM0LjY0LDE0ODguOSAxNDM0LjY0LDE0NTUuMDZDMTQzNC42NCwxNDIxLjIzIDE0NjIuMTEsMTM5My43NiAxNDk1Ljk0LDEzOTMuNzZMMTQ5NS45NCwxNDMyLjk2QzE0ODMuNzUsMTQzMi45NiAxNDczLjg0LDE0NDIuODYgMTQ3My44NCwxNDU1LjA2QzE0NzMuODQsMTQ2Ny4yNiAxNDgzLjc1LDE0NzcuMTYgMTQ5NS45NCwxNDc3LjE2TDE0OTUuOTQsMTUxNi4zN1oiIHN0eWxlPSJmaWxsOnJnYig1MiwyMzgsMTM3KTsiLz4KICAgICAgICAgICAgICAgIDwvZz4KICAgICAgICAgICAgPC9nPgogICAgICAgIDwvZz4KICAgIDwvZz4KPC9zdmc+Cg==" alt="Reality Check logo">
            </div>
        </div>
        <div class="messages" id="messages"></div>
        <div class="input-wrapper">
            <div class="input-container">
                <input type="text" class="message-input" id="messageInput" placeholder="Ask Reality Check about anything...">
                <button class="send-button" id="sendButton" aria-label="Send message">
                    <span>➤</span>
                </button>
            </div>
        </div>
    </div>

    <script>
        const vscode = acquireVsCodeApi();
        const messagesContainer = document.getElementById('messages');
        const messageInput = document.getElementById('messageInput');
        const sendButton = document.getElementById('sendButton');
        const debugButton = document.getElementById('debugButton');
        const status = document.getElementById('status');

        let isDebugging = false;

        function activateChatView() {
            if (!document.body.classList.contains('chat-active')) {
                document.body.classList.add('chat-active');
            }
        }
        
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
            activateChatView();
        }

        function updateDebugState(debugging) {
            isDebugging = debugging;
            if (debugButton) {
                debugButton.textContent = debugging ? 'Build' : 'Debug';
                debugButton.classList.toggle('debug', debugging);
            }
            if (status) {
                status.textContent = debugging ?
                    '🟢 Debug mode engaged – live runtime monitoring is flowing.' :
                    '🔨 Build mode ready – compile and optimize with Reality Check.';
            }
            messageInput.placeholder = debugging ? 
                'Probe runtime with a debug command...' : 
                'Ask Reality Check about anything...';
        }

        function sendMessage() {
            const text = messageInput.value.trim();
            if (text) {
                activateChatView();
                addMessage(text, 'user');
                vscode.postMessage({ command: 'sendMessage', text });
                messageInput.value = '';
            }
        }

        messageInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });
        sendButton.addEventListener('click', sendMessage);
        debugButton.addEventListener('click', () => {
            vscode.postMessage({ command: 'toggleDebug' });
        });
    </script>
</body>
</html>`;
}
