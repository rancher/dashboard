import { Prec, type Extension } from '@codemirror/state';
import { keymap, type KeyBinding } from '@codemirror/view';
import {
  defaultKeymap,
  deleteCharBackward,
  historyKeymap,
  indentWithTab,
  insertTab,
  redo
} from '@codemirror/commands';
import { foldKeymap } from '@codemirror/language';
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

// The CodeMirror 5 Dashboard editor did not move lines with Alt-Up or Alt-Down.
const dashboardDefaultKeymap = defaultKeymap.filter(({ key }) => key !== 'Alt-ArrowUp' && key !== 'Alt-ArrowDown');
const emacsFallbackKeymap = dashboardDefaultKeymap.filter(({ key }) => key !== 'Mod-/');

// The fold gutter markers are not focusable, so folds need key bindings to be reachable from the keyboard
export function getKeymapExtension(mode?: RcCodeMirrorKeymap, variant?: RcCodeMirrorVariant): Extension {
  const tabIndent = variant !== 'input';

  if (mode === 'vim') {
    return [
      Prec.highest(keymap.of([
        // CM5 Vim did not bind Ctrl-/. Consume it so the browser cannot act on it either.
        { key: 'Ctrl-/', run: () => true },
        ...(tabIndent ? [{
          key: 'Tab',
          run: (view) => {
            const cm = getCM(view);

            if (cm?.state.vim?.insertMode) {
              return insertTab(view);
            }

            if (cm) {
              Vim.handleKey(cm, '<C-i>', 'user');
            }

            return true;
          }
        } satisfies KeyBinding] : [])
      ])),
      vim(),
      keymap.of(foldKeymap)
    ];
  }

  if (mode === 'emacs') {
    // Emacs handles overlapping keys (such as Ctrl-A) before the standard fallback keymap.
    // The Emacs keymap leaves Ctrl-H unbound and the standard keymap only binds it on macOS, so elsewhere the
    // browser would open its history instead of deleting backward as CodeMirror 5 did.
    return [
      Prec.highest(emacs({ tabIndent })),
      keymap.of([{ key: 'Ctrl-h', run: deleteCharBackward }, ...emacsFallbackKeymap, ...historyKeymap, ...redoKeymap, ...foldKeymap])
    ];
  }

  return keymap.of([
    ...(tabIndent ? [indentWithTab] : []),
    ...dashboardDefaultKeymap,
    ...historyKeymap,
    ...redoKeymap,
    ...foldKeymap
  ]);
}
