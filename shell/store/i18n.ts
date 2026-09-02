import merge from 'lodash/merge';
import IntlMessageFormat from 'intl-messageformat';
import { ActionContext } from 'vuex';
import { get } from '@shell/utils/object';
import en from '@shell/assets/translations/en-us.yaml';
import { getProduct, getVendor, DOCS_BASE } from '@shell/config/private-label';
import { loadTranslation } from '@shell/utils/dynamic-importer';
import { ExtensionManager } from '@shell/types/extension-manager';
import { VuexStoreGetters } from '@shell/types/store/vuex';

const NONE = 'none';
const DEFAULT_LOCALE = 'en-us';

// Extension type used to register i18n global values, referenced in translation
// strings using [[name]] notation. See `substituteGlobals` below.
export const I18N_GLOBAL_TYPE = 'l10n-global';

// Matches [[name]] where name is any character except ']' and where the opening
// `[[` is NOT preceded by a backslash (which is the escape sequence).
const GLOBAL_PATTERN = /(\\?)\[\[([^\]]+)\]\]/g;

export interface I18nState {
  default: string;
  selected: string | null;
  /**
   * Declared for `toggleNone` to switch back to, but nothing in the codebase
   * assigns it, so `toggleNone` always falls back to `default`.
   */
  previous: string | null;
  available: string[];
  translations: Record<string, any>;
}

type TranslationsModule = Record<string, any> | Promise<Record<string, any>>;
type TranslationsModuleSource = TranslationsModule | (() => TranslationsModule);

export interface I18nGetterRootState {
  $extension?: Pick<ExtensionManager, 'getDynamic'>;
}

interface I18nActionRootState {
  $extension?: ExtensionManager;
}

type I18nContext = ActionContext<I18nState, I18nActionRootState>;

/**
 * Look up an i18n global value registered via
 * `extension.register('l10n-global', name, value)`. Values may be registered as
 * a function, in which case they are invoked to produce the current value.
 */
export function lookupGlobal(name: string, $extension?: Pick<ExtensionManager, 'getDynamic'>): string | undefined {
  const registered = $extension?.getDynamic?.(I18N_GLOBAL_TYPE, name);
  const value = typeof registered === 'function' ? registered() : registered;

  return value !== undefined && value !== null ? String(value) : undefined;
}

/**
 * Replace [[name]] tokens with values registered as i18n globals via
 * `extension.register('l10n-global', name, value)`. If the token is not
 * registered, the name itself is used as the value. Use `\[[` to include a
 * literal `[[` in a translation string.
 */
export function substituteGlobals(msg: string, $extension?: Pick<ExtensionManager, 'getDynamic'>): string {
  if (typeof msg !== 'string' || !msg.includes('[[')) {
    return msg;
  }

  return msg.replace(GLOBAL_PATTERN, (_match: string, escape: string, name: string) => {
    if (escape) {
      // Preserve the literal token, stripping only the escape character
      return `[[${ name }]]`;
    }

    const value = lookupGlobal(name, $extension);

    return value !== undefined ? value : name;
  });
}

// Formatters can't be serialized into state
const intlCache: Record<string, IntlMessageFormat | string> = {};

let lastLoaded: number | undefined = 0;

export const state = function(): I18nState {
  // const translationContext = require.context('@shell/assets/translations', true, /.*/);
  // const available = translationContext.keys().map(path => path.replace(/^.*\/([^\/]+)\.[^.]+$/, '$1'));
  // Using require.context() forces them to all be in the same webpack chunk name... just hardcode the list for now so zh-hans
  // gets generated as it's own chunk instead of being loaded all the time.
  const available = [DEFAULT_LOCALE, 'zh-hans'];

  const out = {
    default:      DEFAULT_LOCALE,
    selected:     null,
    previous:     null,
    available,
    translations: { [DEFAULT_LOCALE]: en },
  };

  return out;
};

/**
 * `selected` is null until `setSelected` runs, and `IntlMessageFormat` only defaults for
 * `undefined`, so a null throws in `Intl.*` on plurals, numbers and dates. Falls back to
 * `state.default` to keep the store's own default authoritative.
 */
function localeToUse(state: I18nState, language?: string): string {
  return language || state.selected || state.default;
}

export const getters = {
  selectedLocaleLabel(state: I18nState) {
    const key = `locale.${ state.selected }`;

    if ( state.selected === NONE ) {
      return `%${ key }%`;
    } else {
      return get(state.translations[state.default], key);
    }
  },

  availableLocales(state: I18nState, getters: VuexStoreGetters) {
    const out: Record<string, string> = {};

    for ( const locale of state.available ) {
      const key = `locale.${ locale }`;

      if ( state.selected === NONE ) {
        out[locale] = `%${ key }%`;
      } else {
        out[locale] = get(state.translations[state.default], key);
      }
    }

    return out;
  },

  hasMultipleLocales(state: I18nState) {
    return state.available.length > 1;
  },

  t: (state: I18nState, _getters?: VuexStoreGetters, rootState?: I18nGetterRootState) => (key: string, args?: Record<string, any>, language?: string) => {
    if (state.selected === NONE && !language) {
      return `%${ key }%`;
    }

    const locale = localeToUse(state, language);
    const cacheKey = `${ locale }/${ key }`;
    let formatter = intlCache[cacheKey];

    if ( !formatter ) {
      let msg = get(state.translations[locale], key);

      if ( !msg ) {
        msg = get(state.translations[state.default], key);
      }

      if ( msg === undefined ) {
        return undefined;
      }

      if ( typeof msg === 'object' ) {
        console.error('Translation for', cacheKey, 'is an object'); // eslint-disable-line no-console

        return undefined;
      }

      // Substitute [[name]] tokens with values registered as i18n globals.
      const hasGlobal = msg.includes('[[');
      const substituted = hasGlobal ? substituteGlobals(msg, rootState?.$extension) : msg;

      if ( substituted?.includes('{')) {
        // `ignoreTag` keeps `<b>`, `<span>`, `<a href="...">` etc in the translations as literal
        // text. The parser shipped with intl-messageformat 7 had no concept of XML/ICU tags, so
        // the catalogs are full of raw HTML that consumers render with `v-html`. Without this the
        // parser either rejects the message (`INVALID_TAG` on attributes, `UNCLOSED_TAG` on `<br>`)
        // or demands a render function per tag name (`MISSING_VALUE`).
        formatter = new IntlMessageFormat(substituted, locale, undefined, { ignoreTag: true });
      } else {
        formatter = substituted;
      }

      intlCache[cacheKey] = formatter;
    }

    if ( typeof formatter === 'string' ) {
      return formatter;
    } else if ( formatter && formatter.format ) {
      // Inject things like appName so they're always available in any translation
      const moreArgs = {
        vendor:   getVendor(),
        appName:  getProduct(),
        docsBase: DOCS_BASE,
        ...args
      };

      return formatter.format(moreArgs);
    } else {
      return '?';
    }
  },

  global: (_state: I18nState, _getters?: VuexStoreGetters, rootState?: I18nGetterRootState) => (name: string) => {
    return lookupGlobal(name, rootState?.$extension);
  },

  exists: (state: I18nState) => (key: string, language?: string) => {
    const locale = localeToUse(state, language);
    const cacheKey = `${ locale }/${ key }`;

    if ( intlCache[cacheKey] ) {
      return true;
    }

    let msg = get(state.translations[state.default], key);

    if ( !msg && locale && locale !== NONE ) {
      msg = get(state.translations[locale], key);
    }

    if ( msg !== undefined ) {
      return true;
    }

    return false;
  },

  current: (state: I18nState) => () => {
    return state.selected;
  },

  default: (state: I18nState) => () => {
    return state.default;
  },

  multiWithFallback: (state: I18nState, getters: VuexStoreGetters) => (items: Record<string, any>[], key = 'key') => {
    return items.map((item) => {
      item[key] = getters.withFallback(item[key], null, item[key]);

      return item;
    });
  },

  withFallback: (state: I18nState, getters: VuexStoreGetters) => (key: string, args?: Record<string, any> | string | null, fallback?: string, fallbackIsKey = false) => {
    // Support withFallback(key,fallback) when no args
    if ( !fallback && typeof args === 'string' ) {
      fallback = args;
      args = {};
    }

    if ( getters.exists(key) ) {
      return getters.t(key, args);
    } else if ( fallbackIsKey ) {
      return getters.t(fallback, args);
    } else {
      return fallback;
    }
  },

};

export const mutations = {
  loadTranslations(state: I18nState, { locale, translations }: { locale: string, translations: Record<string, any> }) {
    state.translations[locale] = translations;
  },

  mergeLoadTranslations(state: I18nState, { locale, translations }: { locale: string, translations: Record<string, any> }) {
    if (!state.translations[locale]) {
      state.translations[locale] = translations;
    } else {
      merge(state.translations[locale], translations);
    }
  },

  setSelected(state: I18nState, locale: string) {
    // this will set the lang param on HTML (best place to add this action since all locale changes go through this mutation)
    if (locale === NONE) {
      document.documentElement.removeAttribute('lang');
    } else {
      document.documentElement.setAttribute('lang', locale);
    }

    state.selected = locale;
  },

  // Add a locale to the list of available locales
  addLocale(state: I18nState, { locale, label }: { locale: string, label: string }) {
    const hasLocale = state.available.find((l) => l === locale);

    if (!hasLocale) {
      state.available.push(locale);
      if (!state.translations[state.default]?.locale?.[locale]) {
        state.translations[state.default].locale[locale] = label;
      }
    }
  },

  // Remove locale
  removeLocale(state: I18nState, locale: string) {
    const index = state.available.findIndex((l) => l === locale);

    if (index !== -1) {
      state.available.splice(index, 1);

      if (state.translations[locale]) {
        delete state.translations[locale];
      }
    }
  }
};

export const actions = {
  init({
    state, commit, dispatch, rootGetters
  }: I18nContext) {
    let selected = rootGetters['prefs/get']('locale');

    // We might be using a locale that is loaded by a plugin that is no longer loaded
    const exists = !!state.available.find((loc) => loc === selected);

    if ( !selected || !exists) {
      selected = state.default;
    }

    return dispatch('switchTo', selected);
  },

  async load({ commit }: I18nContext, locale: string) {
    const translationsModule = await loadTranslation(locale);
    const translations = translationsModule.default || translationsModule;

    commit('loadTranslations', { locale, translations });

    return true;
  },

  async mergeLoad({ commit }: I18nContext, { locale, module }: { locale: string, module: TranslationsModuleSource }) {
    const promise = typeof (module) === 'function' ? module() : Promise.resolve(module);
    const translationsModule = await promise;
    const translations = translationsModule.default || translationsModule;

    return commit('mergeLoadTranslations', { locale, translations });
  },

  // Add a locale to the list of available locales
  addLocale({ commit }: I18nContext, { locale, label }: { locale: string, label: string }) {
    commit('addLocale', { locale, label });
  },

  // Remove a locale from the list of available locales
  removeLocale({ commit, getters, dispatch }: I18nContext, { locale }: { locale: string }) {
    const current = getters['current']();

    // If we are removing the current locale, switch back to the default locale
    if (current === locale) {
      dispatch('switchTo', DEFAULT_LOCALE);
    }

    commit('removeLocale', locale );
  },

  async switchTo({
    state,
    rootState,
    commit,
    dispatch,
    getters
  }: I18nContext, locale: string) {
    const currentLocale = getters['current']();

    if ( locale === NONE ) {
      commit('setSelected', locale);

      // Don't remember into cookie
      return;
    }

    const lastLoad = rootState.$extension?.lastLoad;
    const i18nExt = rootState.$extension?.getDynamic('l10n', locale);
    const reload = lastLoaded !== undefined && lastLoad !== undefined && lastLoaded < lastLoad;

    lastLoaded = lastLoad;

    if ( !state.translations[locale] || reload) {
      try {
        await dispatch('load', locale);
      } catch (e) {
        if (!i18nExt && locale !== DEFAULT_LOCALE) {
          // Try to show something... we could not load the locale from the built-in translations
          // and there are no plugins providing translations
          commit('setSelected', DEFAULT_LOCALE);

          return;
        }
      }

      // Load all of the locales from the plugins
      if (i18nExt && i18nExt.length) {
        const p: Promise<any>[] = [];

        i18nExt.forEach((fn: TranslationsModuleSource) => {
          p.push(dispatch('mergeLoad', { locale, module: fn }));
        });

        // load all of the default locales from the plugins for fallback
        if (locale !== DEFAULT_LOCALE) {
          const defaultI18nExt = rootState.$extension?.getDynamic('l10n', DEFAULT_LOCALE);

          if (defaultI18nExt && defaultI18nExt.length) {
            defaultI18nExt.forEach((fn: TranslationsModuleSource) => {
              p.push(dispatch('mergeLoad', { locale: DEFAULT_LOCALE, module: fn }));
            });
          }
        }

        try {
          await Promise.all(p);
        } catch (e) {
          if (locale !== DEFAULT_LOCALE) {
            commit('setSelected', DEFAULT_LOCALE);

            return;
          }
        }
      }
    }

    commit('setSelected', locale);

    // Only update the preference if the locale changed
    if (currentLocale !== locale) {
      dispatch('prefs/set', {
        key:   'locale',
        value: state.selected
      }, { root: true });
    }
  },

  toggleNone({ state, dispatch }: I18nContext) {
    if ( state.selected === NONE ) {
      return dispatch('switchTo', state.previous || state.default);
    } else {
      return dispatch('switchTo', NONE);
    }
  }
};
