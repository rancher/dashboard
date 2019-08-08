import { isArray } from '@/utils/array';

export default function urlOptions(url, opt) {
  opt = opt || {};

  // Filter
  // @TODO friendly support for modifiers
  if ( opt.filter ) {
    const keys = Object.keys(opt.filter);

    keys.forEach((key) => {
      let vals = opt.filter[key];

      if ( !isArray(vals) ) {
        vals = [vals];
      }

      vals.forEach((val) => {
        url += `${ (url.indexOf('?') >= 0 ? '&' : '?') + encodeURIComponent(key) }=${ encodeURIComponent(val) }`;
      });
    });
  }
  // End: Filter

  // Limit
  const limit = opt.limit;

  if ( limit ) {
    url += `${ url.indexOf('?') >= 0 ? '&' : '?' }limit=${ limit }`;
  }
  // End: Limit

  // Sort
  const sortBy = opt.sortBy;

  if ( sortBy ) {
    url += `${ url.indexOf('?') >= 0 ? '&' : '?' }sort=${ encodeURIComponent(sortBy) }`;
  }

  const orderBy = opt.sortOrder;

  if ( orderBy ) {
    url += `${ url.indexOf('?') >= 0 ? '&' : '?' }order=${ encodeURIComponent(orderBy) }`;
  }
  // End: Sort

  return url;
}
