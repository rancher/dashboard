import type { Extension, EditorState } from '@codemirror/state';
import {
  codeFolding, foldService, foldEffect, foldable, matchBrackets, syntaxTree, forceParsing, language
} from '@codemirror/language';
import type { EditorView } from '@codemirror/view';

// Match the Lezer copy used by CodeMirror's parser when dependencies resolve separately.
type SyntaxNode = ReturnType<ReturnType<typeof syntaxTree>['resolve']>;

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

/** Folds matching pairs: {}, [], (). Language syntax distinguishes strings and comments. */
export const bracketFoldService: Extension = foldService.of(
  (state: EditorState, lineStart: number): { from: number; to: number } | null => {
    const line = state.doc.lineAt(lineStart);

    for (let i = 0; i < line.text.length; i++) {
      if (!'{[('.includes(line.text[i])) {
        continue;
      }

      const match = matchBrackets(state, line.from + i, 1);

      if (match?.matched && match.end && state.doc.lineAt(match.end.from).number > line.number) {
        return { from: match.start.to, to: match.end.from };
      }
    }

    return null;
  }
);

/**
 * Enables folding with the given strategy. The fold gutter is separate, so folding still
 * works (programmatically or from the keyboard) when the gutter is hidden.
 */
export function buildFoldExtension(opts?: FoldOptions): Extension {
  const extensions: Extension[] = [codeFolding({ placeholderText: '↔️' })];
  const strategy = opts?.strategy ?? 'language';

  if (strategy === 'indent') {
    extensions.push(indentFoldService);
  } else if (strategy === 'bracket') {
    extensions.push(bracketFoldService);
  }
  // 'language' relies on the language extension's own fold service
  if (opts?.custom) {
    extensions.push(opts.custom);
  }

  return extensions;
}

/**
 * A copy of `pattern` without the global and sticky flags. With either flag, test() resumes
 * from the previous match's lastIndex, so testing line after line would skip matches.
 */
function statelessPattern(pattern: RegExp): RegExp {
  return new RegExp(pattern.source, pattern.flags.replace(/[gy]/g, ''));
}

/**
 * Declarative fold service: marks lines matching `pattern` as foldable.
 * The fold range covers the indented block below the matching line.
 */
export function foldByLineMatch(pattern: RegExp): Extension {
  const matcher = statelessPattern(pattern);

  return foldService.of((state, lineStart) => {
    const line = state.doc.lineAt(lineStart);

    if (!matcher.test(line.text)) {
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

/** Walks a Key node's ancestors to reconstruct its path from the document root. */
function getKeyPath(keyNode: SyntaxNode, state: EditorState): string {
  const segments: string[] = [];

  for (let cur: SyntaxNode | null = keyNode.parent; cur; cur = cur.parent) {
    if (cur.name === 'Pair') {
      const key = cur.firstChild;

      if (key?.name === 'Key') {
        segments.unshift(state.doc.sliceString(key.from, key.to).trim());
      }
    } else if (cur.name === 'Item') {
      let index = 0;

      for (let sibling = cur.prevSibling; sibling; sibling = sibling.prevSibling) {
        if (sibling.name === 'Item') {
          index++;
        }
      }
      segments.unshift(`[${ index }]`);
    }
  }

  return segments.reduce((path, segment) => segment.startsWith('[') ? `${ path }${ segment }` : path ? `${ path }.${ segment }` : segment, '');
}

/**
 * Declarative fold service: marks the line at the given YAML path as foldable.
 * Use zero-based indexes for list items, for example `spec.containers[0].resources`.
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
      to:   line.to,
      enter(node) {
        if (node.name !== 'Key') {
          return;
        }
        if (state.doc.sliceString(node.from, node.to).trim() !== lastSegment) {
          return;
        }
        if (getKeyPath(node.node, state) === path) {
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
    view.dispatch({ effects: ranges.map((r) => foldEffect.of(r)) });
  }
}

/**
 * Language parsing may stop before the end of a long document. Continue in
 * short tasks before looking for folds, so a parse timeout cannot silently
 * discard a requested fold outside the viewport.
 */
function parseDocument(view: EditorView, onParsed: () => void): void {
  const doc = view.state.doc;
  const wasConnected = view.dom.isConnected;

  function continueParsing(): void {
    if (view.state.doc !== doc || (wasConnected && !view.dom.isConnected)) {
      return;
    }

    if (!view.state.facet(language) || forceParsing(view, doc.length, 100)) {
      onParsed();
    } else {
      setTimeout(continueParsing, 16);
    }
  }

  continueParsing();
}

/**
 * Imperative: folds all lines matching `pattern`. Call in a `ready` handler.
 * Delegates range detection to registered fold services via `foldable()`.
 */
export function foldMatchingLines(view: EditorView, pattern: RegExp): void {
  const matcher = statelessPattern(pattern);

  parseDocument(view, () => {
    const { state } = view;
    const ranges: { from: number; to: number }[] = [];

    for (let i = 1; i <= state.doc.lines; i++) {
      const line = state.doc.line(i);

      if (!matcher.test(line.text)) {
        continue;
      }
      const range = foldable(state, line.from, line.to);

      if (range) {
        ranges.push(range);
      }
    }
    if (ranges.length > 0) {
      view.dispatch({ effects: ranges.map((r) => foldEffect.of(r)) });
    }
  });
}

/**
 * Imperative: folds the line at the given YAML path. List items use zero-based indexes.
 * Call in a `ready` handler.
 */
export function foldYamlPath(view: EditorView, path: string): void {
  const segments = path.split('.');
  const lastSegment = segments[segments.length - 1];

  parseDocument(view, () => {
    const { state } = view;
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
        if (getKeyPath(node.node, state) === path) {
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
  });
}
