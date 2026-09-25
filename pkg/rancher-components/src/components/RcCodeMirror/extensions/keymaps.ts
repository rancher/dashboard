import type { Extension } from '@codemirror/state';
import { keymap } from '@codemirror/view';
import {
  defaultKeymap,
  historyKeymap,
  emacsStyleKeymap
} from '@codemirror/commands';
import { foldKeymap } from '@codemirror/language';
import { searchKeymap } from '@codemirror/search';
import { vim } from '@replit/codemirror-vim';
import type { RcCodeMirrorKeymap } from '../types';

// The fold gutter markers are not focusable, so folds need key bindings to be reachable from the keyboard
export function getKeymapExtension(mode?: RcCodeMirrorKeymap): Extension {
  if (mode === 'vim') {
    return [vim(), keymap.of(foldKeymap)];
  }

  if (mode === 'emacs') {
    return keymap.of([...emacsStyleKeymap, ...foldKeymap]);
  }

  return keymap.of([...defaultKeymap, ...historyKeymap, ...searchKeymap, ...foldKeymap]);
}
