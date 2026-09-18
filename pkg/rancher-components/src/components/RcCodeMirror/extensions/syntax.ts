import type { Extension } from '@codemirror/state';
import { yaml } from '@codemirror/lang-yaml';
import { json } from '@codemirror/lang-json';
import type { RcCodeMirrorLanguage } from '../types';

export function getLanguageExtension(lang?: RcCodeMirrorLanguage): Extension {
  if (lang === 'yaml') {
    return yaml();
  }
  if (lang === 'json') {
    return json();
  }

  return [];
}
