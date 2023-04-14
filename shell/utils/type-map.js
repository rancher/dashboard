import { pluralize } from '@shell/utils/string';
import { get } from '@shell/utils/object';

// Regexes can't be represented in state because they don't serialize to JSON..
const regexCache = {};

export function stringToRegex(str) {
  let out = regexCache[str];

  if ( !out ) {
    out = new RegExp(str);
    regexCache[str] = out;
  }

  return out;
}

export function applyMapping(objOrValue, mappings, keyField, cache, defaultFn) {
  let key = objOrValue;
  let found = false;

  // this whole block just gets the key from the object
  if ( keyField ) {
    if ( typeof objOrValue !== 'object' ) {
      return objOrValue;
    }

    key = get(objOrValue, keyField);

    if ( typeof key !== 'string' ) {
      return null;
    }
  }

  // maybe take a shortcut if we can
  if ( key && cache && cache[key] ) {
    return cache[key];
  }

  let out = `${ key }`;

  // mappings
  for ( const rule of mappings ) {
    const replacementRegex = stringToRegex(rule.match);
    const captured = out.match(replacementRegex);

    if ( captured && rule.replace ) {
      out = out.replace(replacementRegex, rule.replace);

      found = true;
      if ( !rule.continueOnMatch ) {
        break;
      }
    }
  }

  if ( !found && defaultFn ) {
    out = defaultFn(out, objOrValue);
  }

  if ( cache ) {
    cache[key] = out;
  }

  return out;
}

export function labelForDefaultFn(schema, count = 1, language = null, { translate, exists }) {
  return () => {
    const key = `typeLabel."${ schema.id.toLowerCase() }"`;

    if ( exists(key, language) ) {
      return translate(key, { count }, language).trim();
    }

    const out = schema?.attributes?.kind || schema.id || '?';

    // Add spaces, but breaks typing names into jump menu naturally
    // out = ucFirst(out.replace(/([a-z])([A-Z])/g,'$1 $2'));

    if ( count === 1 ) {
      return out;
    }

    // This works for most things... if you don't like it, put in a typeLabel translation for above.
    return pluralize(out);
  };
}
