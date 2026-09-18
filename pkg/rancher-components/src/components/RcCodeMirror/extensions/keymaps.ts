import type { Extension } from '@codemirror/state';
import { keymap } from '@codemirror/view';
import {
  defaultKeymap,
  historyKeymap,
  emacsStyleKeymap
} from '@codemirror/commands';
import { searchKeymap } from '@codemirror/search';
import { vim } from '@replit/codemirror-vim';
import type { RcCodeMirrorKeymap } from '../types';

export function getKeymapExtension(mode?: RcCodeMirrorKeymap): Extension {
  if (mode === 'vim') {
    return vim();
  }

  if (mode === 'emacs') {
    return keymap.of(emacsStyleKeymap);
  }

  return keymap.of([...defaultKeymap, ...historyKeymap, ...searchKeymap]);
}
