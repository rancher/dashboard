import type { Extension } from '@codemirror/state'
import { yaml } from '@codemirror/lang-yaml'
import { json } from '@codemirror/lang-json'

export function getLanguageExtension(lang?: 'yaml' | 'json'): Extension {
  if (lang === 'yaml') return yaml()
  if (lang === 'json') return json()
  return []
}
