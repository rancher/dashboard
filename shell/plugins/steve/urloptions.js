import { isArray } from '@shell/utils/array';

export default function urlOptions(url, opt) {
  opt = opt || {};

  // Filter
  // ToDo: Steve's filter options work differently nowadays (https://github.com/rancher/steve#filter)
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

  // Exclude
  // excludeFields should be an array of strings representing the paths of the fields to exclude
  // only works on Steve but is ignored without error by Norman
  if (opt.excludeFields && opt.excludeFields.length > 0) {
    const excludeParamsString = opt.excludeFields.map((field) => `exclude=${ field }`).join('&');

    url += `${ url.includes('?') ? '&' : '?' }${ excludeParamsString }`;
  }
  // End: Exclude

  // Limit
  const limit = opt.limit;

  if ( limit ) {
    url += `${ url.includes('?') ? '&' : '?' }limit=${ limit }`;
  }
  // End: Limit

  // ToDo: Steve's sort options work differently nowadays (https://github.com/rancher/steve#sort)
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
