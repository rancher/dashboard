import { useStore } from 'vuex';

export type Translate = (key: string, args?: Record<string, unknown>) => string;

/**
 * Shell's global `t` escapes HTML entities, which is right for the `v-t` directive but wrong in a
 * mustache - an apostrophe renders as `&#39;`. This shadows it with the non-escaping store getter.
 */
export function useTranslation(): Translate {
  const store = useStore();

  return (key, args) => store.getters['i18n/t'](key, args);
}
