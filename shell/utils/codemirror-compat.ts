/**
 * Backwards compatibility for code written against the CodeMirror 5 editor the shell used to provide.
 *
 * `CodeMirror` and `YamlEditor` now render CodeMirror 6, whose `onReady` event emits an `EditorView`
 * rather than a CodeMirror 5 instance, and whose `options` are not CodeMirror 5 options. Extensions
 * built against older shells still use both, so the CodeMirror 5 methods they call are added to the
 * `EditorView` and the CodeMirror 5 options they pass are translated to CodeMirror 6 extensions.
 *
 * Everything here is deprecated and prints a warning the first time it is used.
 */
import {
  EditorSelection, EditorState, Prec, countColumn, type Extension
} from '@codemirror/state';
import {
  drawSelection, highlightActiveLine, keymap, type Command, type EditorView, type KeyBinding
} from '@codemirror/view';
import {
  foldAll, foldCode, indentUnit, language, toggleFold, unfoldAll, unfoldCode
} from '@codemirror/language';
import {
  cursorDocEnd, cursorDocStart, indentLess, indentMore, indentSelection, insertNewlineAndIndent, redo, selectAll, toggleComment, undo
} from '@codemirror/commands';
import { autocompletion, completeAnyWord, startCompletion } from '@codemirror/autocomplete';
import { findNext, findPrevious, openSearchPanel } from '@codemirror/search';
import { foldAllComments, foldMatchingLines, foldYamlPath } from '@components/RcCodeMirror';

/**
 * Options of the shell's `CodeMirror` component that are implemented with CodeMirror 6
 */
export const CODEMIRROR_OPTIONS = ['mode', 'readOnly', 'lint', 'lineNumbers', 'foldGutter', 'lineWrapping', 'screenReaderLabel'];

const DOCS = 'See https://codemirror.net/docs/migration/';

const warned = new Set<string>();

function warnDeprecated(api: string, message: string): void {
  if (warned.has(api)) {
    return;
  }

  warned.add(api);
  console.warn(`[CodeMirror] ${ api } is from CodeMirror 5 and is deprecated. ${ message } ${ DOCS }`); // eslint-disable-line no-console
}

/**
 * Deprecation warnings are only printed once per page load, this prints them again
 */
export function resetDeprecationWarnings(): void {
  warned.clear();
}

interface CodeMirror5Mode {
  name: string;
  /**
   * Fold helper used by `foldAll`, only `yamlcomments` changes what is folded
   */
  fold?: string;
}

interface CodeMirror5Position {
  line: number;
  ch: number;
}

const modes = new WeakMap<EditorView, CodeMirror5Mode>();

function getMode(view: EditorView): CodeMirror5Mode {
  let mode = modes.get(view);

  if (!mode) {
    mode = { name: view.state.facet(language)?.name || 'null' };
    modes.set(view, mode);
  }

  return mode;
}

/**
 * Inserts spaces up to the next tab stop, like CodeMirror 5's `insertSoftTab`
 */
const insertSoftTab: Command = (view) => {
  const { state } = view;

  view.dispatch(state.update(state.changeByRange((range) => {
    const line = state.doc.lineAt(range.from);
    const column = countColumn(line.text.slice(0, range.from - line.from), state.tabSize);
    const spaces = ' '.repeat(state.tabSize - (column % state.tabSize));

    return {
      changes: {
        from: range.from, to: range.to, insert: spaces
      },
      range: EditorSelection.cursor(range.from + spaces.length)
    };
  }), { scrollIntoView: true, userEvent: 'input' }));

  return true;
};

const COMMANDS: Record<string, Command> = {
  foldAll: (view) => {
    if (getMode(view).fold === 'yamlcomments') {
      foldAllComments(view);

      return true;
    }

    return foldAll(view);
  },
  unfoldAll,
  fold:             foldCode,
  unfold:           unfoldCode,
  toggleFold,
  insertSoftTab,
  indentMore,
  indentLess,
  indentAuto:       indentSelection,
  newlineAndIndent: insertNewlineAndIndent,
  undo,
  redo,
  selectAll,
  goDocStart:       cursorDocStart,
  goDocEnd:         cursorDocEnd,
  toggleComment,
  autocomplete:     startCompletion,
  find:             openSearchPanel,
  findNext,
  findPrev:         findPrevious,
};

function runCommand(view: EditorView, name: string): boolean {
  const command = COMMANDS[name];

  if (!command) {
    warnDeprecated(`The \`${ name }\` command`, 'It is not supported and does nothing.');

    return false;
  }

  return command(view);
}

function toPosition(view: EditorView, offset: number): CodeMirror5Position {
  const line = view.state.doc.lineAt(offset);

  return { line: line.number - 1, ch: offset - line.from };
}

function toOffset(view: EditorView, { line, ch }: CodeMirror5Position): number {
  const { doc } = view.state;
  const docLine = doc.line(Math.min(Math.max(line + 1, 1), doc.lines));

  return docLine.from + Math.min(Math.max(ch, 0), docLine.length);
}

interface CodeMirror5Method {
  replacement: string;
  run: (view: EditorView, ...args: any[]) => unknown;
}

const METHODS: Record<string, CodeMirror5Method> = {
  getValue: {
    replacement: 'Use `view.state.doc.toString()`.',
    run:         (view) => view.state.doc.toString(),
  },
  setValue: {
    replacement: 'Use `view.dispatch({ changes })`.',
    run:         (view, value: string) => view.dispatch({
      changes: {
        from: 0, to: view.state.doc.length, insert: value ?? ''
      }
    }),
  },
  refresh: {
    replacement: 'CodeMirror 6 measures itself, use `view.requestMeasure()` if needed.',
    run:         (view) => view.requestMeasure(),
  },
  getWrapperElement: {
    replacement: 'Use `view.dom`.',
    run:         (view) => view.dom,
  },
  getMode: {
    replacement: 'Configure languages and folding with extensions.',
    run:         (view) => getMode(view),
  },
  execCommand: {
    replacement: 'Call the CodeMirror 6 command, e.g. `foldAll(view)` from @codemirror/language.',
    run:         (view, name: string) => {
      runCommand(view, name);
    },
  },
  somethingSelected: {
    replacement: 'Use `view.state.selection.ranges.some((r) => !r.empty)`.',
    run:         (view) => view.state.selection.ranges.some((range) => !range.empty),
  },
  getSelection: {
    replacement: 'Use `view.state.sliceDoc(from, to)` with the selection ranges.',
    run:         (view, separator = '\n') => view.state.selection.ranges
      .map((range) => view.state.sliceDoc(range.from, range.to))
      .join(separator),
  },
  replaceSelection: {
    replacement: 'Use `view.dispatch(view.state.replaceSelection(text))`.',
    run:         (view, text: string) => view.dispatch(view.state.replaceSelection(text)),
  },
  indentSelection: {
    replacement: 'Use `indentMore`, `indentLess` or `indentSelection` from @codemirror/commands.',
    run:         (view, how?: string) => {
      if (how === 'add') {
        indentMore(view);
      } else if (how === 'subtract') {
        indentLess(view);
      } else {
        indentSelection(view);
      }
    },
  },
  getCursor: {
    replacement: 'Use `view.state.selection.main.head`.',
    run:         (view) => toPosition(view, view.state.selection.main.head),
  },
  setCursor: {
    replacement: 'Use `view.dispatch({ selection })`.',
    run:         (view, line: number | CodeMirror5Position, ch?: number) => {
      const position = typeof line === 'number' ? { line, ch: ch ?? 0 } : line;

      view.dispatch({ selection: { anchor: toOffset(view, position) }, scrollIntoView: true });
    },
  },
  lineCount: {
    replacement: 'Use `view.state.doc.lines`.',
    run:         (view) => view.state.doc.lines,
  },
  getLine: {
    replacement: 'Use `view.state.doc.line(number).text`, whose line numbers start at 1.',
    run:         (view, line: number) => (line >= 0 && line < view.state.doc.lines ? view.state.doc.line(line + 1).text : undefined),
  },
  foldLinesMatching: {
    replacement: 'Use `foldMatchingLines(view, regex)` from @components/RcCodeMirror.',
    run:         (view, regex: RegExp) => foldMatchingLines(view, regex),
  },
  foldYaml: {
    replacement: 'Use `foldYamlPath(view, path)` from @components/RcCodeMirror.',
    run:         (view, path: string) => foldYamlPath(view, path),
  },
};

const HAS_CODEMIRROR5_API = Symbol('codemirror5');

/**
 * Adds the CodeMirror 5 methods that the shell's editor used to provide to a CodeMirror 6 view.
 * The view is otherwise unchanged, so it can still be passed to CodeMirror 6 functions.
 */
export function withCodeMirror5Api(view: EditorView): EditorView {
  if ((view as any)[HAS_CODEMIRROR5_API]) {
    return view;
  }

  Object.entries(METHODS).forEach(([name, { replacement, run }]) => {
    // Never hide the CodeMirror 6 API
    if (name in view) {
      return;
    }

    Object.defineProperty(view, name, {
      configurable: true,
      value:        (...args: unknown[]) => {
        warnDeprecated(`\`${ name }()\``, replacement);

        return run(view, ...args);
      }
    });
  });

  Object.defineProperty(view, HAS_CODEMIRROR5_API, { value: true });

  return view;
}

// CodeMirror 5 key names that differ in CodeMirror 6
const KEY_NAMES: Record<string, string> = {
  Esc:   'Escape',
  Up:    'ArrowUp',
  Down:  'ArrowDown',
  Left:  'ArrowLeft',
  Right: 'ArrowRight',
  Del:   'Delete',
  Ins:   'Insert',
};

/**
 * Converts a CodeMirror 5 key name, e.g. `Shift-Esc` or `Ctrl-K Ctrl-C`, to CodeMirror 6
 */
export function toKeyName(name: string): string {
  return name.split(' ').map((stroke) => {
    const [, modifiers, key] = stroke.match(/^((?:(?:Shift|Ctrl|Alt|Cmd|Meta|Mod)-)*)(.+)$/) || ['', '', stroke];

    // CodeMirror 5 names letter keys in upper case, CodeMirror 6 would take that as the shifted key
    return `${ modifiers }${ KEY_NAMES[key] || (/^[A-Z]$/.test(key) ? key.toLowerCase() : key) }`;
  }).join(' ');
}

// CodeMirror 5 only completed on request, from the words in the document
const anyWordCompletion: Extension = [
  EditorState.languageData.of(() => [{ autocomplete: completeAnyWord }]),
  autocompletion({ activateOnTyping: false }),
];

function extraKeysExtension(extraKeys: Record<string, unknown>): Extension {
  let completes = false;
  const bindings: KeyBinding[] = [];

  Object.entries(extraKeys || {}).forEach(([name, handler]) => {
    const key = toKeyName(name);

    if (typeof handler === 'function') {
      // Handlers return CodeMirror.Pass to let the key through
      bindings.push({ key, run: (view) => String(handler(withCodeMirror5Api(view))) !== 'CodeMirror.Pass' });
    } else if (typeof handler === 'string') {
      completes = completes || handler === 'autocomplete';
      bindings.push({ key, run: (view) => runCommand(view, handler) });
    }
    // `false` lets the browser handle the key, which needs no binding
  });

  return [Prec.high(keymap.of(bindings)), completes ? anyWordCompletion : []];
}

function indentExtension(options: Record<string, unknown>): Extension {
  if (options.indentWithTabs) {
    return indentUnit.of('\t');
  }

  return typeof options.indentUnit === 'number' ? indentUnit.of(' '.repeat(options.indentUnit)) : [];
}

interface CodeMirror5Option {
  replacement: string;
  extension: (value: any, options: Record<string, unknown>) => Extension;
}

const OPTIONS: Record<string, CodeMirror5Option> = {
  extraKeys: {
    replacement: 'Pass a keymap with the `extensions` prop, e.g. `Prec.high(keymap.of(bindings))`.',
    extension:   (extraKeys) => extraKeysExtension(extraKeys),
  },
  tabSize: {
    replacement: 'Pass `EditorState.tabSize.of(size)` with the `extensions` prop.',
    extension:   (size) => (typeof size === 'number' && size > 0 ? EditorState.tabSize.of(size) : []),
  },
  indentUnit: {
    replacement: 'Pass `indentUnit.of(unit)` from @codemirror/language with the `extensions` prop.',
    extension:   (_, options) => (options.indentWithTabs ? [] : indentExtension(options)),
  },
  indentWithTabs: {
    replacement: 'Pass `indentUnit.of(\'\\t\')` from @codemirror/language with the `extensions` prop.',
    extension:   (_, options) => indentExtension(options),
  },
  styleActiveLine: {
    replacement: 'Pass `highlightActiveLine()` from @codemirror/view with the `extensions` prop.',
    extension:   (style) => (style ? highlightActiveLine() : []),
  },
  cursorBlinkRate: {
    replacement: 'Pass `drawSelection({ cursorBlinkRate })` from @codemirror/view with the `extensions` prop.',
    extension:   (rate) => (typeof rate === 'number' ? drawSelection({ cursorBlinkRate: Math.max(rate, 0) }) : []),
  },
};

/**
 * CodeMirror 6 extensions for the CodeMirror 5 options that the shell's `CodeMirror` component doesn't
 * implement itself. Options without a CodeMirror 6 equivalent, such as `gutters` or `theme`, are ignored.
 */
export function codeMirror5OptionExtensions(options: Record<string, unknown> = {}): Extension[] {
  return Object.entries(options || {}).reduce((extensions, [name, value]) => {
    if (CODEMIRROR_OPTIONS.includes(name) || value === undefined) {
      return extensions;
    }

    const option = OPTIONS[name];

    if (!option) {
      warnDeprecated(`The \`${ name }\` option`, 'It has no effect.');

      return extensions;
    }

    warnDeprecated(`The \`${ name }\` option`, option.replacement);
    extensions.push(option.extension(value, options));

    return extensions;
  }, [] as Extension[]);
}
