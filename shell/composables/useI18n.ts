import { Store } from 'vuex';

import { stringFor } from '@shell/plugins/i18n';

let store: Store<any> | null = null;
/**
 * Allows for consuming i18n strings with the Vue composition API.
 * @param key - The key for the i18n string to translate.
 * @param args - An object or array containing arguments for the translation function.
 * @param raw - A boolean determining if the string returned is a raw representation.
 * @returns A translated string or the raw value if the raw parameter is set to true.
 */
const t = (key: string, args?: unknown, raw?: boolean): string => {
  if (!store) {
    if (!!process.env.dev) {
      // eslint-disable-next-line no-console
      console.warn('useI18n: store not available');
    }

    return key;
  }

  return stringFor(store, key, args as any, raw);
};

export type I18n = { t: typeof t };

export const useI18n = (vuexStore: Store<any>): I18n => {
  store = vuexStore;

  if (!store) {
    throw new Error('usI18n() must be called from setup()');
  }

  return { t };
};
