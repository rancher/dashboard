import { Store } from 'vuex';

import { stringFor } from '@shell/plugins/i18n';

let store: Store<any> | null = null;

export const useI18n = (vuexStore: Store<any>): { t: typeof t } => {
  store = vuexStore;

  if (!store) {
    throw new Error('usI18n() must be called from setup()');
  }

  return { t };
};

/**
 * Allows for consuming i18n strings with the Vue composition API.
 * @param key - The key for the i18n string to translate.
 * @param args - An object or array containing arguments for the translation function.
 * @param raw - A boolean determining if the string returned is a raw representation.
 * @returns A translated string or the raw value if the raw parameter is set to true.
 */
const t = (key: string, args?: unknown, raw?: boolean): string => {
  return stringFor(store, key, args, raw);
};
