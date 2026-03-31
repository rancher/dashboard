import type { Extension, EditorState } from '@codemirror/state';
import { foldGutter as cmFoldGutter, foldService, foldEffect, foldable, syntaxTree } from '@codemirror/language';
import type { EditorView } from '@codemirror/view';
import type { SyntaxNode } from '@lezer/common';

/** The raw callback signature accepted by foldService.of() */
export type FoldServiceFn = (
  state: EditorState,
  lineStart: number,
  lineEnd: number
) => { from: number; to: number } | null;

export interface FoldOptions {
  strategy?: 'indent' | 'bracket' | 'language';
  /** A custom foldService Extension (e.g. foldService.of(...)) or any extra fold Extension */
  custom?: Extension;
}

/**
 * Folds by indentation level — useful for YAML and whitespace-sensitive languages.
 */
export const indentFoldService: Extension = foldService.of(
  (state: EditorState, lineStart: number): { from: number; to: number } | null => {
    const line = state.doc.lineAt(lineStart);
    const lineText = line.text;
    const indent = (lineText.match(/^(\s*)/)?.[1] ?? '').length;

    if (lineText.trim() === '') {
      return null;
    }

    let foldTo = line.to;

    for (let i = line.number + 1; i <= state.doc.lines; i++) {
      const nextLine = state.doc.line(i);
      const nextText = nextLine.text;
      if (nextText.trim() === '') {
        foldTo = nextLine.to;
        continue;
      }
      const nextIndent = (nextText.match(/^(\s*)/)?.[1] ?? '').length;
      if (nextIndent <= indent) {
        break;
      }
      foldTo = nextLine.to;
    }

    if (foldTo === line.to) {
      return null;
    }
    return { from: line.to, to: foldTo };
  }
);

/**
 * Folds matching bracket pairs: {}, [], ()
 */
export const bracketFoldService: Extension = foldService.of(
  (state: EditorState, lineStart: number): { from: number; to: number } | null => {
    const line = state.doc.lineAt(lineStart);
    const text = line.text;

    const openBrackets: Record<string, string> = { '{': '}', '[': ']', '(': ')' };
    let openChar: string | null = null;
    let openPos = -1;

    for (let i = 0; i < text.length; i++) {
      const ch = text.charAt(i);
      if (ch in openBrackets) {
        openChar = ch;
        openPos = line.from + i;
        break;
      }
    }

    if (!openChar || openPos === -1) {
      return null;
    }

    const closeChar = openBrackets[openChar];
    let depth = 0;

    for (let pos = openPos; pos < state.doc.length; pos++) {
      const ch = state.doc.sliceString(pos, pos + 1);
      if (ch === openChar) {
        depth++;
      }
      else if (ch === closeChar) {
        depth--;
        if (depth === 0) {
          const closeLine = state.doc.lineAt(pos);
          if (closeLine.number > line.number) {
            return { from: line.to, to: closeLine.from - 1 };
          }
          break;
        }
      }
    }

    return null;
  }
);

export function buildFoldExtension(opts?: FoldOptions): Extension {
  const extensions: Extension[] = [cmFoldGutter()];
  const strategy = opts?.strategy ?? 'language';
  if (strategy === 'indent') {
    extensions.push(indentFoldService);
  }
  else if (strategy === 'bracket') {
    extensions.push(bracketFoldService);
  }
  // 'language' relies on the language extension's own fold service
  if (opts?.custom) {
    extensions.push(opts.custom);
  }
  return extensions;
}

/**
 * Declarative fold service: marks lines matching `pattern` as foldable.
 * The fold range covers the indented block below the matching line.
 */
export function foldByLineMatch(pattern: RegExp): Extension {
  return foldService.of((state, lineStart) => {
    const line = state.doc.lineAt(lineStart);
    if (!pattern.test(line.text)) {
      return null;
    }

    const indent = (line.text.match(/^(\s*)/)?.[1] ?? '').length;
    let foldTo = line.to;
    for (let i = line.number + 1; i <= state.doc.lines; i++) {
      const nextLine = state.doc.line(i);
      const nextText = nextLine.text;
      if (nextText.trim() === '') {
        foldTo = nextLine.to;
        continue;
      }
      if ((nextText.match(/^(\s*)/)?.[1] ?? '').length <= indent) {
        break;
      }
      foldTo = nextLine.to;
    }
    if (foldTo === line.to) {
      return null;
    }
    return { from: line.to, to: foldTo };
  });
}

/** Walks a Key node's ancestor Pairs to reconstruct the full dot-notation path. */
function getKeyPath(keyNode: SyntaxNode, state: EditorState): string[] {
  const path: string[] = [state.doc.sliceString(keyNode.from, keyNode.to).trim()];
  // Key → Pair → BlockMapping → Pair → BlockMapping → ...
  let cur: SyntaxNode | null = keyNode.parent; // Pair
  while (cur) {
    cur = cur.parent; // BlockMapping
    if (!cur) {
      break;
    }
    cur = cur.parent; // parent Pair
    if (!cur || cur.name !== 'Pair') {
      break;
    }
    const parentKey = cur.firstChild;
    if (parentKey?.name === 'Key') {
      path.unshift(state.doc.sliceString(parentKey.from, parentKey.to).trim());
    }
  }
  return path;
}

/**
 * Declarative fold service: marks the line at the given YAML dot-notation path as foldable.
 * Requires a YAML language extension to be active (uses the lezer syntax tree).
 */
export function foldByYamlPath(path: string): Extension {
  const segments = path.split('.');
  const lastSegment = segments[segments.length - 1];

  return foldService.of((state, lineStart) => {
    const line = state.doc.lineAt(lineStart);
    const tree = syntaxTree(state);

    let keyNode: SyntaxNode | null = null;
    tree.iterate({
      from: line.from,
      to: line.to,
      enter(node) {
        if (node.name !== 'Key') {
          return;
        }
        if (state.doc.sliceString(node.from, node.to).trim() !== lastSegment) {
          return;
        }
        if (getKeyPath(node.node, state).join('.') === path) {
          keyNode = node.node;
          return false;
        }
      }
    });

    if (!keyNode) {
      return null;
    }

    const indent = (line.text.match(/^(\s*)/)?.[1] ?? '').length;
    let foldTo = line.to;
    for (let i = line.number + 1; i <= state.doc.lines; i++) {
      const nextLine = state.doc.line(i);
      const nextText = nextLine.text;
      if (nextText.trim() === '') {
        foldTo = nextLine.to;
        continue;
      }
      if ((nextText.match(/^(\s*)/)?.[1] ?? '').length <= indent) {
        break;
      }
      foldTo = nextLine.to;
    }
    if (foldTo === line.to) {
      return null;
    }
    return { from: line.to, to: foldTo };
  });
}

/**
 * Returns the indentation depth of the content after the leading `#` on a comment line,
 * or null if the line is not a comment.
 */
function commentContentIndent(text: string): number | null {
  const match = text.match(/^\s*#(.*)$/);
  if (!match) {
    return null;
  }
  return ((match[1] ?? '').match(/^(\s*)/)?.[1] ?? '').length;
}

/**
 * Declarative fold service: folds comment lines whose immediately-following comment lines
 * have deeper content indentation (i.e. the comment has "children").
 * A plain `# note` line with no deeper-indented comment siblings will not get a fold widget.
 */
export const commentFoldService: Extension = foldService.of((state, lineStart) => {
  const line = state.doc.lineAt(lineStart);
  const indent = commentContentIndent(line.text);
  if (indent === null) {
    return null;
  }

  let foldTo = line.to;
  for (let i = line.number + 1; i <= state.doc.lines; i++) {
    const next = state.doc.line(i);
    const nextIndent = commentContentIndent(next.text);
    if (nextIndent === null) {
      break;
    }
    if (nextIndent <= indent) {
      break;
    }
    foldTo = next.to;
  }

  if (foldTo === line.to) {
    return null;
  }
  return { from: line.to, to: foldTo };
});

/**
 * Imperative: folds all comment lines that have deeper-indented comment children.
 * Folds at every nesting level so nested structure is preserved when unfolding.
 * Call in a `ready` handler. Requires `commentFoldService` to be registered.
 */
export function foldAllComments(view: EditorView): void {
  const { state } = view;
  const ranges: { from: number; to: number }[] = [];

  for (let i = 1; i <= state.doc.lines; i++) {
    const line = state.doc.line(i);
    const indent = commentContentIndent(line.text);
    if (indent === null) {
      continue;
    }

    let foldTo = line.to;
    for (let j = i + 1; j <= state.doc.lines; j++) {
      const next = state.doc.line(j);
      const nextIndent = commentContentIndent(next.text);
      if (nextIndent === null) {
        break;
      }
      if (nextIndent <= indent) {
        break;
      }
      foldTo = next.to;
    }

    if (foldTo !== line.to) {
      ranges.push({ from: line.to, to: foldTo });
    }
  }

  if (ranges.length > 0) {
    view.dispatch({ effects: ranges.map(r => foldEffect.of(r)) });
  }
}

/**
 * Imperative: folds all lines matching `pattern`. Call in a `ready` handler.
 * Delegates range detection to registered fold services via `foldable()`.
 */
export function foldMatchingLines(view: EditorView, pattern: RegExp): void {
  const { state } = view;
  const ranges: { from: number; to: number }[] = [];
  for (let i = 1; i <= state.doc.lines; i++) {
    const line = state.doc.line(i);
    if (!pattern.test(line.text)) {
      continue;
    }
    const range = foldable(state, line.from, line.to);
    if (range) {
      ranges.push(range);
    }
  }
  if (ranges.length > 0) {
    view.dispatch({ effects: ranges.map(r => foldEffect.of(r)) });
  }
}

/**
 * Imperative: folds the line at the given YAML dot-notation path. Call in a `ready` handler.
 */
export function foldYamlPath(view: EditorView, path: string): void {
  const { state } = view;
  const segments = path.split('.');
  const lastSegment = segments[segments.length - 1];
  const tree = syntaxTree(state);

  let targetFrom: number | null = null;
  tree.iterate({
    enter(node) {
      if (targetFrom !== null) {
        return false;
      }
      if (node.name !== 'Key') {
        return;
      }
      if (state.doc.sliceString(node.from, node.to).trim() !== lastSegment) {
        return;
      }
      if (getKeyPath(node.node, state).join('.') === path) {
        targetFrom = state.doc.lineAt(node.from).from;
        return false;
      }
    }
  });

  if (targetFrom === null) {
    return;
  }
  const line = state.doc.lineAt(targetFrom);
  const range = foldable(state, line.from, line.to);
  if (range) {
    view.dispatch({ effects: foldEffect.of(range) });
  }
}
