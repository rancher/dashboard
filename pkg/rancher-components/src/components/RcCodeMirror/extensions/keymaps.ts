import { Prec, type Extension } from '@codemirror/state';
import { keymap } from '@codemirror/view';
import {
  defaultKeymap,
  historyKeymap
} from '@codemirror/commands';
import { foldKeymap } from '@codemirror/language';
import { searchKeymap } from '@codemirror/search';
import { emacs } from '../../../../vendor/codemirror-emacs';
import { vim } from '@replit/codemirror-vim';
import type { RcCodeMirrorKeymap } from '../types';

// The fold gutter markers are not focusable, so folds need key bindings to be reachable from the keyboard
export function getKeymapExtension(mode?: RcCodeMirrorKeymap): Extension {
  if (mode === 'vim') {
    return [vim(), keymap.of(foldKeymap)];
  }

  if (mode === 'emacs') {
    // Emacs handles overlapping keys (such as Ctrl-A) before the standard fallback keymap.
    return [Prec.highest(emacs()), keymap.of([...defaultKeymap, ...historyKeymap, ...searchKeymap, ...foldKeymap])];
  }

  return keymap.of([...defaultKeymap, ...historyKeymap, ...searchKeymap, ...foldKeymap]);
}
