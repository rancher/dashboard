import type { Extension } from '@codemirror/state'
import type { EditorState } from '@codemirror/state'
import { foldGutter as cmFoldGutter, foldService } from '@codemirror/language'

/** The raw callback signature accepted by foldService.of() */
export type FoldServiceFn = (
  state: EditorState,
  lineStart: number,
  lineEnd: number
) => { from: number; to: number } | null

export interface FoldOptions {
  strategy?: 'indent' | 'bracket' | 'language'
  /** A custom foldService Extension (e.g. foldService.of(...)) or any extra fold Extension */
  custom?: Extension
}

/**
 * Folds by indentation level — useful for YAML and whitespace-sensitive languages.
 */
export const indentFoldService: Extension = foldService.of(
  (state: EditorState, lineStart: number): { from: number; to: number } | null => {
    const line = state.doc.lineAt(lineStart)
    const lineText = line.text
    const indent = lineText.match(/^(\s*)/)?.[1].length ?? 0

    if (lineText.trim() === '') return null

    let foldTo = line.to

    for (let i = line.number + 1; i <= state.doc.lines; i++) {
      const nextLine = state.doc.line(i)
      const nextText = nextLine.text
      if (nextText.trim() === '') {
        foldTo = nextLine.to
        continue
      }
      const nextIndent = nextText.match(/^(\s*)/)?.[1].length ?? 0
      if (nextIndent <= indent) break
      foldTo = nextLine.to
    }

    if (foldTo === line.to) return null
    return { from: line.to, to: foldTo }
  }
)

/**
 * Folds matching bracket pairs: {}, [], ()
 */
export const bracketFoldService: Extension = foldService.of(
  (state: EditorState, lineStart: number): { from: number; to: number } | null => {
    const line = state.doc.lineAt(lineStart)
    const text = line.text

    const openBrackets: Record<string, string> = { '{': '}', '[': ']', '(': ')' }
    let openChar: string | null = null
    let openPos = -1

    for (let i = 0; i < text.length; i++) {
      if (text[i] in openBrackets) {
        openChar = text[i]
        openPos = line.from + i
        break
      }
    }

    if (!openChar || openPos === -1) return null

    const closeChar = openBrackets[openChar]
    let depth = 0

    for (let pos = openPos; pos < state.doc.length; pos++) {
      const ch = state.doc.sliceString(pos, pos + 1)
      if (ch === openChar) depth++
      else if (ch === closeChar) {
        depth--
        if (depth === 0) {
          const closeLine = state.doc.lineAt(pos)
          if (closeLine.number > line.number) {
            return { from: line.to, to: closeLine.from - 1 }
          }
          break
        }
      }
    }

    return null
  }
)

export function buildFoldExtension(opts?: FoldOptions): Extension {
  const extensions: Extension[] = [cmFoldGutter()]

  if (opts?.custom) {
    extensions.push(opts.custom)
    return extensions
  }

  const strategy = opts?.strategy ?? 'language'

  if (strategy === 'indent') {
    extensions.push(indentFoldService)
  } else if (strategy === 'bracket') {
    extensions.push(bracketFoldService)
  }
  // 'language' relies on the language extension's own fold service

  return extensions
}
