import type { Extension } from '@codemirror/state';
import type { FoldOptions } from './extensions/fold';

export type RcCodeMirrorLanguage = 'yaml' | 'json';

export type RcCodeMirrorKeymap = 'default' | 'vim' | 'emacs';

export type RcCodeMirrorTheme = 'one-dark' | 'none';

/**
 * - `editor`: a code editor, with line numbers and a fold gutter
 * - `input`: a multi-line form input that preserves whitespace, without gutters, always wrapping
 *   and styled like the other form inputs. Line breaks are marked, so values with them are distinguishable
 */
export type RcCodeMirrorVariant = 'editor' | 'input';

export interface RcCodeMirrorProps {
  modelValue?: string;
  language?: RcCodeMirrorLanguage;
  keymap?: RcCodeMirrorKeymap;
  theme?: RcCodeMirrorTheme;
  variant?: RcCodeMirrorVariant;
  readOnly?: boolean;
  lineNumbers?: boolean;
  foldGutter?: boolean;
  lineWrapping?: boolean;
  extensions?: Extension[];
  foldOptions?: FoldOptions;
}
