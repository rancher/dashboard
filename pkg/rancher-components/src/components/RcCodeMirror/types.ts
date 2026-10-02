import type { Extension } from '@codemirror/state';
import type { LintSource } from '@codemirror/lint';
import type { FoldOptions } from './extensions/fold';

export type RcCodeMirrorLanguage = 'yaml' | 'json' | 'javascript';

export type RcCodeMirrorKeymap = 'default' | 'vim' | 'emacs';

export type RcCodeMirrorTheme = 'rancher' | 'none';

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
  /**
   * Checks the document and returns its problems, which are underlined in the text. In the editor
   * variant a gutter between the line numbers and the fold gutter also marks the lines with problems.
   */
  linter?: LintSource;
  /**
   * Show an indicator in the top-right corner when the Vim or Emacs keymap is active. Selecting it
   * hides it until the editor is remounted.
   */
  keymapIndicator?: boolean;
}
