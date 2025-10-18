import * as vscode from 'vscode';
import OpenAI from 'openai';

/**
 * Anchor-based patch suggestions (robust to blank lines / miscounted line numbers).
 * We keep backward compatibility with the old line-number format by converting
 * it to anchor patches on the fly.
 */
type PatchKind = 'replace' | 'insert_after' | 'insert_before' | 'delete';

interface PatchSuggestion {
  kind: PatchKind;
  issue: string;
  // For replace/delete we require an exact target snippet from the CURRENT file.
  target?: string;
  // For insert_* we require an exact anchor snippet from the CURRENT file.
  anchor?: string;
  // For replace/insert_* this is the code to put in.
  replacement?: string; // for replace
  insertion?: string;   // for insert_*

  /**
   * If the target/anchor occurs multiple times, 0-based index selects which occurrence to patch.
   * Defaults to 0 (the first).
   */
  occurrence_index?: number;
}

/** Legacy format for compatibility */
interface LegacyFixSuggestion {
  start_line: number;
  end_line?: number;
  issue: string;
  operation: 'replace' | 'insert' | 'delete' | 'append';
  suggested_fix?: string;
}

export function registerFixPythonScriptCommand(context: vscode.ExtensionContext) {
  const disposable = vscode.commands.registerCommand('rcdbg.fixPythonScript', async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showErrorMessage('No active editor found.');
      return;
    }
    const document = editor.document;
    if (document.languageId !== 'python') {
      vscode.window.showErrorMessage('Only Python files are supported.');
      return;
    }

    const fileText = document.getText();
    const debugTrace = 'DEBUG TRACE NOT IMPLEMENTED YET';

    const prompt = buildPrompt(fileText, debugTrace);

    try {
      vscode.window.showInformationMessage('Analyzing Python file with OpenAI (anchor patches)...');

      const apiKey = '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';
      if (!apiKey) {
        vscode.window.showErrorMessage('Missing OpenAI API key. Please set OPENAI_API_KEY.');
        return;
      }
      const client = new OpenAI({ apiKey });

      const response = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a careful debugging assistant. Always follow the output schema exactly.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.1,
      });

      const content = response.choices?.[0]?.message?.content?.trim();
      if (!content) {
        vscode.window.showErrorMessage('No response received from OpenAI.');
        return;
      }

      const jsonText = sanitizeJSON(content);
      let patches = parsePatchSuggestions(jsonText);
      if (!patches) {
        // Try legacy format and convert
        const legacy = parseLegacyFixes(jsonText);
        if (legacy) {
          patches = convertLegacyToPatches(fileText, legacy);
        }
      }
      if (!patches || patches.length === 0) {
        vscode.window.showInformationMessage('No fixes suggested.');
        return;
      }

      vscode.window.showInformationMessage(`Received ${patches.length} patch(es).`);
      await applyPatchesSequentially(editor, fileText, patches);
      vscode.window.showInformationMessage('All selected fixes applied successfully.');
    } catch (err: any) {
      vscode.window.showErrorMessage(`OpenAI API error: ${err?.message ?? String(err)}`);
      console.error(err);
    }
  });

  context.subscriptions.push(disposable);
}

/* -------------------------------- Prompt ---------------------------------- */

function buildPrompt(fileText: string, debugTrace: string): string {
  const asArray = JSON.stringify(fileText.split('\n')); // helps model reason about exact lines & blanks

  return `You are a Python debugging expert.
Given the Python script and its debug stack trace, produce a list of ANCHOR-BASED patches that do not depend on line numbers.
Return ONLY valid JSON matching this exact TypeScript type (no markdown, no commentary):

type PatchSuggestion = {
  "kind": "replace" | "insert_after" | "insert_before" | "delete",
  "issue": string,
  // For "replace" or "delete": exact "target" snippet from the CURRENT file.
  "target"?: string,
  // For "insert_after" or "insert_before": exact "anchor" snippet from the CURRENT file.
  "anchor"?: string,
  // For "replace": "replacement" code; For "insert_*": "insertion" code.
  "replacement"?: string,
  "insertion"?: string,
  // If the target/anchor appears multiple times, select with 0-based index. Defaults to 0.
  "occurrence_index"?: number
}[]

Rules:
- Snippets in "target" or "anchor" MUST be copied exactly from the current file, including indentation and blank lines.
- Keep snippets as small as possible while uniquely identifying the location (e.g., one or a few lines).
- Do NOT rely on or mention line numbers anywhere.
- Ensure Python indentation is correct in "replacement"/"insertion".
- Return JSON ONLY.

Python Script (verbatim):
\`\`\`python
${fileText}
\`\`\`

Python Script as array of lines (for precise blanks):
${asArray}

Stack Trace:
\`\`\`
${debugTrace}
\`\`\``;
}

/* ------------------------------ JSON helpers ------------------------------- */

function sanitizeJSON(text: string): string {
  return text
    .replace(/```json\s*/gi, '')
    .replace(/```/g, '')
    .replace(/^[^\[\{]*/, '') // strip leading junk
    .replace(/[^\]\}]*$/, '') // strip trailing junk
    .trim();
}

function parsePatchSuggestions(jsonText: string): PatchSuggestion[] | null {
  try {
    const parsed = JSON.parse(jsonText);
    if (!Array.isArray(parsed)) return null;

    const valid = parsed.filter((p: any) => {
      const okKind = ['replace', 'insert_after', 'insert_before', 'delete'].includes(p?.kind);
      const okIssue = typeof p?.issue === 'string' && p.issue.length > 0;
      const hasTarget = typeof p?.target === 'string' && p.target.length > 0;
      const hasAnchor = typeof p?.anchor === 'string' && p.anchor.length > 0;
      const hasReplacement = typeof p?.replacement === 'string';
      const hasInsertion = typeof p?.insertion === 'string';

      if (!okKind || !okIssue) return false;
      if (p.kind === 'replace') return hasTarget && hasReplacement;
      if (p.kind === 'delete') return hasTarget;
      if (p.kind === 'insert_after' || p.kind === 'insert_before') return hasAnchor && hasInsertion;
      return false;
    });

    return valid as PatchSuggestion[];
  } catch (e) {
    return null;
  }
}

function parseLegacyFixes(jsonText: string): LegacyFixSuggestion[] | null {
  try {
    const parsed = JSON.parse(jsonText);
    if (!Array.isArray(parsed)) return null;
    return parsed as LegacyFixSuggestion[];
  } catch {
    return null;
  }
}

function convertLegacyToPatches(fileText: string, fixes: LegacyFixSuggestion[]): PatchSuggestion[] {
  const lines = fileText.split('\n');
  const patches: PatchSuggestion[] = [];

  for (const f of fixes) {
    const start = Math.max(1, f.start_line);
    const end = Math.max(start, f.end_line ?? f.start_line);
    const targetText = lines.slice(start - 1, end).join('\n');

    if (f.operation === 'replace') {
      patches.push({
        kind: 'replace',
        issue: f.issue,
        target: targetText,
        replacement: f.suggested_fix ?? ''
      });
    } else if (f.operation === 'delete') {
      patches.push({
        kind: 'delete',
        issue: f.issue,
        target: targetText
      });
    } else if (f.operation === 'insert') {
      const anchor = lines[Math.max(0, start - 2)] ?? '';
      patches.push({
        kind: 'insert_before',
        issue: f.issue,
        anchor,
        insertion: f.suggested_fix ?? ''
      });
    } else if (f.operation === 'append') {
      const anchor = lines[Math.max(0, end - 1)] ?? '';
      patches.push({
        kind: 'insert_after',
        issue: f.issue,
        anchor,
        insertion: f.suggested_fix ?? ''
      });
    }
  }
  return patches;
}

/* -------------------------- Patch application flow ------------------------- */

async function applyPatchesSequentially(
  editor: vscode.TextEditor,
  initialText: string,
  patches: PatchSuggestion[]
) {
  // We'll recompute occurrences on the latest document text each time.
  for (const patch of patches) {
    const found = locatePatchInDocument(editor.document, patch);
    if (!found) {
      vscode.window.showWarningMessage(`Could not locate patch in document: ${patch.issue}`);
      continue;
    }

    const label = buildPatchLabel(patch);
    await showPatchPreview(editor, found, patch);

    const selection = await vscode.window.showQuickPick(['✅ Apply Fix', '❌ Skip'], {
      placeHolder: label,
      ignoreFocusOut: true,
    });

    clearPatchPreview(editor);

    if (selection === '✅ Apply Fix') {
      await applyLocatedPatch(editor, found, patch);
    }
  }
}

function buildPatchLabel(patch: PatchSuggestion): string {
  switch (patch.kind) {
    case 'replace': return `REPLACE: ${patch.issue}`;
    case 'delete': return `DELETE: ${patch.issue}`;
    case 'insert_after': return `INSERT AFTER: ${patch.issue}`;
    case 'insert_before': return `INSERT BEFORE: ${patch.issue}`;
  }
}

/* ------------------------------ Locating text ------------------------------ */

interface LocatedPatch {
  range?: vscode.Range; // for replace/delete
  anchorRange?: vscode.Range; // for insert_before/after
}

function locatePatchInDocument(doc: vscode.TextDocument, patch: PatchSuggestion): LocatedPatch | null {
  const text = doc.getText();
  const idx = patch.occurrence_index ?? 0;

  if (patch.kind === 'replace' || patch.kind === 'delete') {
    const target = patch.target!;
    const pos = nthIndexOf(text, target, idx);
    if (pos === -1) return null;
    return { range: rangeFromOffsetLength(doc, pos, target.length) };
  }

  if (patch.kind === 'insert_after' || patch.kind === 'insert_before') {
    const anchor = patch.anchor!;
    const pos = nthIndexOf(text, anchor, idx);
    if (pos === -1) return null;
    return { anchorRange: rangeFromOffsetLength(doc, pos, anchor.length) };
  }

  return null;
}

function nthIndexOf(haystack: string, needle: string, n: number): number {
  if (!needle) return -1;
  let pos = -1;
  for (let i = 0; i <= n; i++) {
    pos = haystack.indexOf(needle, pos + 1);
    if (pos === -1) return -1;
  }
  return pos;
}

function rangeFromOffsetLength(doc: vscode.TextDocument, offset: number, length: number): vscode.Range {
  const start = doc.positionAt(offset);
  const end = doc.positionAt(offset + length);
  return new vscode.Range(start, end);
}

/* ------------------------------ Visual preview ----------------------------- */

let addedDecoration: vscode.TextEditorDecorationType | undefined;
let removedDecoration: vscode.TextEditorDecorationType | undefined;

function ensureDecorations() {
  addedDecoration ??= vscode.window.createTextEditorDecorationType({
    backgroundColor: 'rgba(76, 175, 80, 0.25)', // green
    isWholeLine: true,
  });
  removedDecoration ??= vscode.window.createTextEditorDecorationType({
    backgroundColor: 'rgba(244, 67, 54, 0.25)', // red
    isWholeLine: true,
  });
}

async function showPatchPreview(editor: vscode.TextEditor, located: LocatedPatch, patch: PatchSuggestion) {
  ensureDecorations();

  const added: vscode.DecorationOptions[] = [];
  const removed: vscode.DecorationOptions[] = [];

  if ((patch.kind === 'replace' || patch.kind === 'delete') && located.range) {
    removed.push({
      range: located.range,
      hoverMessage: new vscode.MarkdownString('**To be removed:**\n```python\n' + editor.document.getText(located.range) + '\n```')
    });
  }

  if (patch.kind === 'replace' && located.range) {
    // Show where replacement will appear: approximate new range height from replacement lines
    const replacement = patch.replacement ?? '';
    const startLine = located.range.start.line;
    const lineCount = Math.max(1, replacement.split('\n').length);
    const start = new vscode.Position(startLine, 0);
    const end = new vscode.Position(startLine + lineCount, 0);
    added.push({
      range: new vscode.Range(start, end),
      hoverMessage: new vscode.MarkdownString('**Proposed replacement:**\n```python\n' + replacement + '\n```')
    });
  }

  if ((patch.kind === 'insert_after' || patch.kind === 'insert_before') && located.anchorRange) {
    const anchorText = editor.document.getText(located.anchorRange);
    removed.push({
      range: located.anchorRange,
      hoverMessage: new vscode.MarkdownString('**Anchor:**\n```python\n' + anchorText + '\n```')
    });

    const insertion = patch.insertion ?? '';
    const insertLine = patch.kind === 'insert_before' ? located.anchorRange.start.line : located.anchorRange.end.line;
    const start = new vscode.Position(insertLine, 0);
    const end = new vscode.Position(insertLine + Math.max(1, insertion.split('\n').length), 0);
    added.push({
      range: new vscode.Range(start, end),
      hoverMessage: new vscode.MarkdownString('**Proposed insertion:**\n```python\n' + insertion + '\n```')
    });
  }

  editor.setDecorations(addedDecoration!, added);
  editor.setDecorations(removedDecoration!, removed);
}

function clearPatchPreview(editor: vscode.TextEditor) {
  if (addedDecoration) editor.setDecorations(addedDecoration, []);
  if (removedDecoration) editor.setDecorations(removedDecoration, []);
}

/* ------------------------------ Apply patches ------------------------------ */

async function applyLocatedPatch(editor: vscode.TextEditor, located: LocatedPatch, patch: PatchSuggestion) {
  await editor.edit((eb) => {
    if ((patch.kind === 'replace' || patch.kind === 'delete') && located.range) {
      if (patch.kind === 'replace') {
        eb.replace(located.range, (patch.replacement ?? '') + '\n');
      } else {
        eb.delete(located.range);
      }
    } else if ((patch.kind === 'insert_after' || patch.kind === 'insert_before') && located.anchorRange) {
      const insertion = (patch.insertion ?? '') + '\n';
      const pos = patch.kind === 'insert_before' ? located.anchorRange.start : located.anchorRange.end;
      eb.insert(pos, insertion);
    }
  });
}