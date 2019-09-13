import { normalizeType } from '@/plugins/norman/normalize';

const cache = {};

export function lookup(type) {
  type = normalizeType(type).replace(/\//g, '');

  let impl = cache[type];

  if ( impl ) {
    return impl.default;
  } else if ( typeof impl !== 'undefined' ) {
    return null;
  }

  try {
    impl = require(`@/models/${ type }`);
    cache[type] = impl;

    return impl.default;
  } catch (e) {
  }

  cache[type] = null;

  return null;
}
