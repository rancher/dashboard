import type { Extension } from '@codemirror/state';
import type { FoldOptions } from './extensions/fold';

export type RcCodeMirrorLanguage = 'yaml' | 'json';

export type RcCodeMirrorKeymap = 'default' | 'vim' | 'emacs';

export type RcCodeMirrorTheme = 'one-dark' | 'none';

export interface RcCodeMirrorProps {
  modelValue?: string;
  language?: RcCodeMirrorLanguage;
  keymap?: RcCodeMirrorKeymap;
  theme?: RcCodeMirrorTheme;
  readOnly?: boolean;
  lineNumbers?: boolean;
  foldGutter?: boolean;
  lineWrapping?: boolean;
  extensions?: Extension[];
  foldOptions?: FoldOptions;
}
