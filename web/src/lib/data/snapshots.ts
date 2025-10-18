export const snapshotsData = [
  {
    "timestamp": "2025-04-10T09:30:12.100Z",
    "event": "launch",
    "message": "Debugger session opened (pid: 5124)",
    "frames": [],
    "activeFrameId": null
  },
  {
    "timestamp": "2025-04-10T09:30:13.482Z",
    "event": "breakpoint",
    "message": "Breakpoint hit at main.py:42",
    "frames": [
      {
        "id": "f1",
        "file": "main.py",
        "line": 9,
        "fn": "calc",
        "locals": [
          { "name": "a", "type": "int", "value": "3" },
          { "name": "b", "type": "int", "value": "0" }
        ]
      },
      {
        "id": "f0",
        "file": "main.py",
        "line": 14,
        "fn": "main",
        "locals": [
          { "name": "jobs", "type": "list", "value": "[{a: 3, b: 0}, {a:10, b:2}]" },
          { "name": "idx", "type": "int", "value": "0" }
        ]
      }
    ],
    "activeFrameId": "f1"
  },
  {
    "timestamp": "2025-04-10T09:30:14.101Z",
    "event": "inject",
    "message": "Context packaged for copilot prompt",
    "frames": [
      {
        "id": "f1",
        "file": "main.py",
        "line": 9,
        "fn": "calc",
        "locals": [
          { "name": "a", "type": "int", "value": "3" },
          { "name": "b", "type": "int", "value": "0" },
          { "name": "error", "type": "ZeroDivisionError", "value": "\"division by zero\"" }
        ]
      }
    ],
    "activeFrameId": "f1"
  },
  {
    "timestamp": "2025-04-10T09:30:16.542Z",
    "event": "fix",
    "message": "Agent proposed patch with rationale (no hallucinations)",
    "frames": [
      {
        "id": "f1",
        "file": "main.py",
        "line": 9,
        "fn": "calc",
        "locals": [
          { "name": "a", "type": "int", "value": "3" },
          { "name": "b", "type": "int", "value": "0" },
          { "name": "error", "type": "ZeroDivisionError", "value": "\"division by zero\"" }
        ]
      }
    ],
    "activeFrameId": "f1"
  }
]
