import merge from 'lodash/merge';
import IntlMessageFormat from 'intl-messageformat';
import { get } from '@shell/utils/object';
import en from '@shell/assets/translations/en-us.yaml';
import { getProduct, getVendor, DOCS_BASE } from '@shell/config/private-label';
import { loadTranslation } from '@shell/utils/dynamic-importer';

const NONE = 'none';
const DEFAULT_LOCALE = 'en-us';

// Extension type used to register i18n global values, referenced in translation
// strings using [[name]] notation. See `substituteGlobals` below.
export const I18N_GLOBAL_TYPE = 'l10n-global';

// Matches [[name]] where name is any character except ']' and where the opening
// `[[` is NOT preceded by a backslash (which is the escape sequence).
const GLOBAL_PATTERN = /(\\?)\[\[([^\]]+)\]\]/g;

/**
 * Look up an i18n global value registered via
 * `extension.register('l10n-global', name, value)`. Values may be registered as
 * a function, in which case they are invoked to produce the current value.
 *
 * @param {string} name
 * @param {any} $extension
 * @returns {string | undefined}
 */
export function lookupGlobal(name, $extension) {
  const registered = $extension?.getDynamic?.(I18N_GLOBAL_TYPE, name);
  const value = typeof registered === 'function' ? registered() : registered;

  return value !== undefined && value !== null ? String(value) : undefined;
}

/**
 * Replace [[name]] tokens with values registered as i18n globals via
 * `extension.register('l10n-global', name, value)`. If the token is not
 * registered, the name itself is used as the value. Use `\[[` to include a
 * literal `[[` in a translation string.
 *
 * @param {string} msg
 * @param {any} $extension
 * @returns {string}
 */
export function substituteGlobals(msg, $extension) {
  if (typeof msg !== 'string' || !msg.includes('[[')) {
    return msg;
  }

  return msg.replace(GLOBAL_PATTERN, (_match, escape, name) => {
    if (escape) {
      // Preserve the literal token, stripping only the escape character
      return `[[${ name }]]`;
    }

    const value = lookupGlobal(name, $extension);

    return value !== undefined ? value : name;
  });
}

// Formatters can't be serialized into state
const intlCache = {};

let lastLoaded = 0;

/**
 * @typedef {object} I18nState
 * @property {string} default - Locale to fall back to when nothing else applies.
 * @property {string | null} selected - Locale in use, filled in by the `setSelected` mutation.
 * @property {string | null} previous - Declared for `toggleNone` to switch back to, but nothing in the codebase assigns it, so `toggleNone` always falls back to `default`.
 * @property {string[]} available - Locales that can be loaded.
 * @property {Record<string, any>} translations - Loaded translations, keyed by locale.
 */

/**
 * @returns {I18nState}
 */
export const state = function() {
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
 * The locale a lookup should resolve against: an explicit override first, then the
 * selected locale, then the store's own default.
 *
 * `selected` is null until the `setSelected` mutation runs, and `IntlMessageFormat`
 * only substitutes its default for `undefined`, never for null. A null therefore
 * reaches `Intl.*` and any message with an ICU argument that needs locale data
 * (`{n, plural}`, `{n, number}`, a date or time) throws. Falling back to
 * `state.default` keeps the store's own notion of a default authoritative instead of
 * deferring to `IntlMessageFormat.defaultLocale`.
 *
 * @param {I18nState} state
 * @param {string} [language] - Explicit locale override passed to the getter.
 * @returns {string}
 */
function localeToUse(state, language) {
  return language || state.selected || state.default;
}

export const getters = {
  selectedLocaleLabel(state) {
    const key = `locale.${ state.selected }`;

    if ( state.selected === NONE ) {
      return `%${ key }%`;
    } else {
      return get(state.translations[state.default], key);
    }
  },

  availableLocales(state, getters) {
    const out = {};

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

  hasMultipleLocales(state) {
    return state.available.length > 1;
  },

  t: (state, _getters, rootState) => (key, args, language) => {
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
        formatter = new IntlMessageFormat(substituted, locale);
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

  global: (_state, _getters, rootState) => (name) => {
    return lookupGlobal(name, rootState?.$extension);
  },

  exists: (state) => (key, language) => {
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

  current: (state) => () => {
    return state.selected;
  },

  default: (state) => () => {
    return state.default;
  },

  multiWithFallback: (state, getters) => (items, key = 'key') => {
    return items.map((item) => {
      item[key] = getters.withFallback(item[key], null, item[key]);

      return item;
    });
  },

  withFallback: (state, getters) => (key, args, fallback, fallbackIsKey = false) => {
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
  loadTranslations(state, { locale, translations }) {
    state.translations[locale] = translations;
  },

  mergeLoadTranslations(state, { locale, translations }) {
    if (!state.translations[locale]) {
      state.translations[locale] = translations;
    } else {
      merge(state.translations[locale], translations);
    }
  },

  setSelected(state, locale) {
    // this will set the lang param on HTML (best place to add this action since all locale changes go through this mutation)
    if (locale === NONE) {
      document.querySelector('html').removeAttribute('lang');
    } else {
      document.querySelector('html').setAttribute('lang', locale);
    }

    state.selected = locale;
  },

  // Add a locale to the list of available locales
  addLocale(state, { locale, label }) {
    const hasLocale = state.available.find((l) => l === locale);

    if (!hasLocale) {
      state.available.push(locale);
      if (!state.translations[state.default]?.locale?.[locale]) {
        state.translations[state.default].locale[locale] = label;
      }
    }
  },

  // Remove locale
  removeLocale(state, locale) {
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
  }) {
    let selected = rootGetters['prefs/get']('locale');

    // We might be using a locale that is loaded by a plugin that is no longer loaded
    const exists = !!state.available.find((loc) => loc === selected);

    if ( !selected || !exists) {
      selected = state.default;
    }

    return dispatch('switchTo', selected);
  },

  async load({ commit }, locale) {
    const translationsModule = await loadTranslation(locale);
    const translations = translationsModule.default || translationsModule;

    commit('loadTranslations', { locale, translations });

    return true;
  },

  async mergeLoad({ commit }, { locale, module }) {
    const promise = typeof (module) === 'function' ? module() : Promise.resolve(module);
    const translationsModule = await promise;
    const translations = translationsModule.default || translationsModule;

    return commit('mergeLoadTranslations', { locale, translations });
  },

  // Add a locale to the list of available locales
  addLocale({ commit }, { locale, label }) {
    commit('addLocale', { locale, label });
  },

  // Remove a locale from the list of available locales
  removeLocale({ commit, getters, dispatch }, { locale }) {
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
  }, locale) {
    const currentLocale = getters['current']();

    if ( locale === NONE ) {
      commit('setSelected', locale);

      // Don't remember into cookie
      return;
    }

    const lastLoad = rootState.$extension?.lastLoad;
    const i18nExt = rootState.$extension?.getDynamic('l10n', locale);
    const reload = lastLoaded < lastLoad;

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
        const p = [];

        i18nExt.forEach((fn) => {
          p.push(dispatch('mergeLoad', { locale, module: fn }));
        });

        // load all of the default locales from the plugins for fallback
        if (locale !== DEFAULT_LOCALE) {
          const defaultI18nExt = rootState.$extension?.getDynamic('l10n', DEFAULT_LOCALE);

          if (defaultI18nExt && defaultI18nExt.length) {
            defaultI18nExt.forEach((fn) => {
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

  toggleNone({ state, dispatch }) {
    if ( state.selected === NONE ) {
      return dispatch('switchTo', state.previous || state.default);
    } else {
      return dispatch('switchTo', NONE);
    }
  }
};
