import { countColumn, EditorSelection, Prec, type Extension } from '@codemirror/state';
import { keymap, type EditorView, type KeyBinding } from '@codemirror/view';
import {
  defaultKeymap,
  deleteCharBackward,
  historyKeymap,
  indentLess,
  indentMore,
  insertNewlineAndIndent,
  redo
} from '@codemirror/commands';
import { foldKeymap, getIndentUnit, indentString } from '@codemirror/language';
import { closeBracketsKeymap } from '@codemirror/autocomplete';
import { openSearchPanel, search, searchKeymap } from '@codemirror/search';
import { emacs } from '../vendor/codemirror-emacs';
import { getCM, Vim, vim } from '@replit/codemirror-vim';
import type { RcCodeMirrorKeymap, RcCodeMirrorVariant } from '../types';

// CodeMirror 5 redid with both Shift-Mod-Z and Mod-Y on every platform. historyKeymap binds only Ctrl-Y on
// Windows and only Cmd-Shift-Z on macOS.
const redoKeymap: KeyBinding[] = [
  {
    key: 'Mod-Shift-z', run: redo, preventDefault: true
  },
  {
    mac: 'Mod-y', run: redo, preventDefault: true
  }
];

// Tab fills from the cursor to the next indent stop with the document's indent unit (spaces unless configured
// otherwise), as CodeMirror 5 and Vim's expandtab do. Indenting the whole line from mid-line could move a YAML key
// under a different parent, and a tab character is not valid YAML indentation. A selection is indented instead.
function insertIndentUnit(view: EditorView): boolean {
  const { state } = view;

  if (state.readOnly) {
    return false;
  }
  if (state.selection.ranges.some((range) => !range.empty)) {
    return indentMore(view);
  }

  const unit = getIndentUnit(state);

  view.dispatch(state.update(state.changeByRange((range) => {
    const line = state.doc.lineAt(range.head);
    const column = countColumn(line.text.slice(0, range.head - line.from), state.tabSize);
    const insert = indentString(state, unit - (column % unit));

    return {
      changes: { from: range.head, insert },
      range:   EditorSelection.cursor(range.head + insert.length)
    };
  }), { scrollIntoView: true, userEvent: 'input' }));

  return true;
}

// The CodeMirror 5 Dashboard editor did not move lines with Alt-Up or Alt-Down.
const dashboardDefaultKeymap = defaultKeymap.filter(({ key }) => key !== 'Alt-ArrowUp' && key !== 'Alt-ArrowDown');
const emacsFallbackKeymap = dashboardDefaultKeymap.filter(({ key }) => key !== 'Mod-/');

// CodeMirror only renders the lines in view, so the browser's own find cannot reach the rest of a long document.
// Mod-F opens CodeMirror's search panel instead, with F3 and Mod-G for the next and previous match and Escape to
// close it. The rest of searchKeymap (select all matches, go to line, select next occurrence) is left out, as the
// CodeMirror 5 editor had none of them.
const FIND_KEYS = ['Mod-f', 'F3', 'Mod-g', 'Escape'];
const findKeymap = searchKeymap.filter(({ key }) => key && FIND_KEYS.includes(key));

// Pages such as Edit YAML stick their own footer to the bottom of the scroll area, where it would cover a bottom
// panel. The top of the editor is clear, and the panel sticks there while the page scrolls.
const findPanel = search({ top: true });

// The fold gutter markers are not focusable, so folds need key bindings to be reachable from the keyboard
export function getKeymapExtension(mode?: RcCodeMirrorKeymap, variant?: RcCodeMirrorVariant): Extension {
  const tabIndent = variant !== 'input';
  // The single line input variant leaves Mod-F to the browser
  const find = variant !== 'input';

  if (mode === 'vim') {
    return [
      Prec.highest(keymap.of([
        // CM5 Vim did not bind Ctrl-/. Consume it so the browser cannot act on it either.
        { key: 'Ctrl-/', run: () => true },
        ...(tabIndent ? [{
          key: 'Tab',
          run: (view) => {
            // A read-only document has nothing to indent, so Tab and Shift-Tab move focus as in the other keymaps
            if (view.state.readOnly) {
              return false;
            }

            const cm = getCM(view);

            if (cm?.state.vim?.insertMode) {
              return insertIndentUnit(view);
            }

            if (cm) {
              Vim.handleKey(cm, '<C-i>', 'user');
            }

            return true;
          }
        } satisfies KeyBinding, {
          // Keep Shift-Tab in the editor too, so Escape then Tab is the one way out as in the other keymaps
          key: 'Shift-Tab',
          run: (view) => !view.state.readOnly && (getCM(view)?.state.vim?.insertMode ? indentLess(view) : true)
        } satisfies KeyBinding] : [])
      ])),
      vim(),
      keymap.of([
        // Vim leaves Insert mode Enter to the browser, which adds a bare line break. Indent the new line as
        // the default keymap does, which also puts the cursor on its own indented line between brackets.
        { key: 'Enter', run: (view) => !!getCM(view)?.state.vim?.insertMode && insertNewlineAndIndent(view) },
        ...closeBracketsKeymap,
        ...foldKeymap
      ])
    ];
  }

  if (mode === 'emacs') {
    // Emacs handles overlapping keys (such as Ctrl-A) before the standard fallback keymap.
    // The Emacs keymap leaves Ctrl-H unbound and the standard keymap only binds it on macOS, so elsewhere the
    // browser would open its history instead of deleting backward as CodeMirror 5 did.
    // Outside macOS Ctrl-F is forward-char, so Ctrl-S, Emacs' search key, also opens the search panel.
    return [
      Prec.highest(emacs({ tabIndent })),
      keymap.of([
        { key: 'Ctrl-h', run: deleteCharBackward },
        ...(find ? [{
          key: 'Ctrl-s', run: openSearchPanel, scope: 'editor search-panel'
        }, ...findKeymap] : []),
        ...emacsFallbackKeymap,
        ...historyKeymap,
        ...redoKeymap,
        ...foldKeymap
      ]),
      ...(find ? [findPanel] : [])
    ];
  }

  // Backspace deletes both brackets of an empty pair. It must precede the standard Backspace binding.
  return [
    keymap.of([
      ...(tabIndent ? [{
        key: 'Tab', run: insertIndentUnit, shift: indentLess
      }] : []),
      ...(find ? findKeymap : []),
      ...closeBracketsKeymap,
      ...dashboardDefaultKeymap,
      ...historyKeymap,
      ...redoKeymap,
      ...foldKeymap
    ]),
    ...(find ? [findPanel] : [])
  ];
}
