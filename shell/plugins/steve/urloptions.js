import { isArray } from '@shell/utils/array';

export default function urlOptions(url, opt) {
  opt = opt || {};

  // Filter
  if ( opt.filter ) {
    const keys = Object.keys(opt.filter);

    keys.forEach((key) => {
      let vals = opt.filter[key];

      if ( !isArray(vals) ) {
        vals = [vals];
      }

      vals.forEach((val) => {
        url += `${ (url.includes('?') ? '&' : '?') + encodeURIComponent(key) }=${ encodeURIComponent(val) }`;
      });
    });
  }
  // End: Filter

  // Limit
  const limit = opt.limit;

  if ( limit ) {
    url += `${ url.includes('?') ? '&' : '?' }limit=${ limit }`;
  }
  // End: Limit

  // Sort
  const sortBy = opt.sortBy;

  if ( sortBy ) {
    url += `${ url.includes('?') ? '&' : '?' }sort=${ encodeURIComponent(sortBy) }`;
  }

  const orderBy = opt.sortOrder;

  if ( orderBy ) {
    url += `${ url.includes('?') ? '&' : '?' }order=${ encodeURIComponent(orderBy) }`;
  }
  // End: Sort

  return url;
}
