import merge from 'lodash/merge';
import IntlMessageFormat from 'intl-messageformat';
import { LOCALE } from '@shell/config/cookies';
import { get } from '@shell/utils/object';
import en from '@shell/assets/translations/en-us.yaml';
import { getProduct, getVendor, DOCS_BASE } from '@shell/config/private-label';
import { loadTranslation } from '@shell/utils/dynamic-importer';

const NONE = 'none';
const DEFAULT_LOCALE = 'en-us';

// Formatters can't be serialized into state
const intlCache = {};

let lastLoaded = 0;

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

  t: state => (key, args) => {
    if (state.selected === NONE ) {
      return `%${ key }%`;
    }

    const cacheKey = `${ state.selected }/${ key }`;
    let formatter = intlCache[cacheKey];

    if ( !formatter ) {
      let msg = get(state.translations[state.selected], key);

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

      if ( msg?.includes('{')) {
        formatter = new IntlMessageFormat(msg, state.selected);
      } else {
        formatter = msg;
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

  exists: state => (key) => {
    const cacheKey = `${ state.selected }/${ key }`;

    if ( intlCache[cacheKey] ) {
      return true;
    }

    let msg = get(state.translations[state.default], key);

    if ( !msg && state.selected && state.selected !== NONE ) {
      msg = get(state.translations[state.selected], key);
    }

    if ( msg !== undefined ) {
      return true;
    }

    return false;
  },

  current: state => () => {
    return state.selected;
  },

  default: state => () => {
    return state.default;
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
  }
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
    state.selected = locale;
  },

  // Add a locale to the list of available locales
  addLocale(state, { locale, label }) {
    const hasLocale = state.available.find(l => l === locale);

    if (!hasLocale) {
      state.available.push(locale);
      if (!state.translations[state.default]?.locale?.[locale]) {
        state.translations[state.default].locale[locale] = label;
      }
    }
  },

  // Remove locale
  removeLocale(state, locale) {
    const index = state.available.findIndex(l => l === locale);

    if (index !== -1) {
      state.available.splice(index, 1);

      if (state.translations[locale]) {
        delete state.translations[locale];
      }
    }
  }
};

export const actions = {
  init({ state, commit, dispatch }) {
    let selected = this.$cookies.get(LOCALE, { parseJSON: false });

    // We might be using a locale that is loaded by a plugin that is no longer loaded
    const exists = !!state.available.find(loc => loc === selected);

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
    const translationsModule = await module();
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
    dispatch
  }, locale) {
    if ( locale === NONE ) {
      commit('setSelected', locale);

      // Don't remember into cookie
      return;
    }

    const lastLoad = rootState.$plugin?.lastLoad;
    const i18nExt = rootState.$plugin?.getDynamic('i18n', locale);
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
    this.$cookies.set(LOCALE, locale, {
      encode:   x => x,
      maxAge:   86400 * 365,
      path:     '/',
      sameSite: true,
      secure:   true,
    });
  },

  toggleNone({ state, dispatch }) {
    if ( state.selected === NONE ) {
      return dispatch('switchTo', state.previous || state.default);
    } else {
      return dispatch('switchTo', NONE);
    }
  }
};
