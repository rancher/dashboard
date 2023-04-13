import { get } from '@shell/utils/object';
import IntlMessageFormat from 'intl-messageformat';
import { getProduct, getVendor, DOCS_BASE } from '@shell/config/private-label';
const NONE = 'none';

const intlCache = {};

const getTranslate = ({ selected, translations, default: defaultLocale } = {}) => (key, args, language) => {
  if (selected === NONE && !language) {
    return `%${ key }%`;
  }

  const locale = language || selected;
  const cacheKey = `${ locale }/${ key }`;
  let formatter = intlCache[cacheKey];

  if ( !formatter ) {
    let msg = get(translations[locale], key);

    if ( !msg ) {
      msg = get(translations[defaultLocale], key);
    }

    if ( msg === undefined ) {
      return undefined;
    }

    if ( typeof msg === 'object' ) {
      console.error('Translation for', cacheKey, 'is an object'); // eslint-disable-line no-console

      return undefined;
    }

    if ( msg?.includes('{')) {
      formatter = new IntlMessageFormat(msg, locale);
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
};

const getExists = ({ selected, default: defaultLocale, translations }) => (key, language) => {
  const locale = language || selected;
  const cacheKey = `${ locale }/${ key }`;

  if ( intlCache[cacheKey] ) {
    return true;
  }

  let msg = get(translations[defaultLocale], key);

  if ( !msg && locale && locale !== NONE ) {
    msg = get(translations[locale], key);
  }

  if ( msg !== undefined ) {
    return true;
  }

  return false;
};

export const i18n = (config) => {
  return {
    translateWithFallback: (key, args, fallback, fallbackIsKey = false) => {
      const translate = getTranslate(config);
      const exists = getExists(config);

      // Support withFallback(key,fallback) when no args
      if ( !fallback && typeof args === 'string' ) {
        fallback = args;
        args = {};
      }

      if ( exists(key) ) {
        return translate(key, args);
      } else if ( fallbackIsKey ) {
        return translate(fallback, args);
      } else {
        return fallback;
      }
    },
    translate: getTranslate(config), // TODO: RC test - different i18n features
    exists:    getExists(config)
  };
};
