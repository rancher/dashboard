import { Prec, type Extension } from '@codemirror/state';
import { keymap, type KeyBinding } from '@codemirror/view';
import {
  defaultKeymap,
  deleteCharBackward,
  historyKeymap,
  redo
} from '@codemirror/commands';
import { foldKeymap } from '@codemirror/language';
import { searchKeymap } from '@codemirror/search';
import { emacs } from '../vendor/codemirror-emacs';
import { vim } from '@replit/codemirror-vim';
import type { RcCodeMirrorKeymap } from '../types';

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

// The fold gutter markers are not focusable, so folds need key bindings to be reachable from the keyboard
export function getKeymapExtension(mode?: RcCodeMirrorKeymap): Extension {
  if (mode === 'vim') {
    return [vim(), keymap.of(foldKeymap)];
  }

  if (mode === 'emacs') {
    // Emacs handles overlapping keys (such as Ctrl-A) before the standard fallback keymap.
    // The Emacs keymap leaves Ctrl-H unbound and the standard keymap only binds it on macOS, so elsewhere the
    // browser would open its history instead of deleting backward as CodeMirror 5 did.
    return [
      Prec.highest(emacs()),
      keymap.of([{ key: 'Ctrl-h', run: deleteCharBackward }, ...defaultKeymap, ...historyKeymap, ...redoKeymap, ...searchKeymap, ...foldKeymap])
    ];
  }

  return keymap.of([...defaultKeymap, ...historyKeymap, ...redoKeymap, ...searchKeymap, ...foldKeymap]);
}
