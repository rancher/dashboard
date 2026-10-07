import type { Extension } from '@codemirror/state';
import { LanguageSupport } from '@codemirror/language';
import { yaml } from '@codemirror/lang-yaml';
import { json } from '@codemirror/lang-json';
import { javascriptLanguage } from '@codemirror/lang-javascript';
import type { RcCodeMirrorLanguage } from '../types';

export function getLanguageExtension(lang?: RcCodeMirrorLanguage): Extension {
  if (lang === 'yaml') {
    return yaml();
  }
  if (lang === 'json') {
    return json();
  }
  if (lang === 'javascript') {
    // Without javascript()'s completions, which would open while typing, as with the other languages
    return new LanguageSupport(javascriptLanguage);
  }

  return [];
}
