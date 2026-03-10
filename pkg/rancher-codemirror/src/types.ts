import type { Extension } from '@codemirror/state'
import type { FoldOptions } from './extensions/fold'

export interface CodeMirrorProps {
  modelValue?: string
  language?: 'yaml' | 'json'
  keymap?: 'default' | 'vim' | 'emacs'
  theme?: 'one-dark' | 'none'
  readOnly?: boolean
  lineNumbers?: boolean
  foldGutter?: boolean
  lineWrapping?: boolean
  extensions?: Extension[]
  foldOptions?: FoldOptions
}
