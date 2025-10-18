export const promptData = {
  "failure": {
    "file": "main.py",
    "line": 9,
    "message": "ZeroDivisionError: division by zero"
  },
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
  "constraints": [
    "Do not add unrelated code or refactors.",
    "No hardcoded constants to pass tests.",
    "Limit change set to ≤ 6 lines per file.",
    "Explain failure location and chosen fix in ≤ 4 bullets."
  ],
  "repoContext": {
    "files": [
      { "path": "main.py", "digest": "sha256:7f94d21c" },
      { "path": "utils/math.py", "digest": "sha256:0ab15f2e" }
    ]
  }
}
