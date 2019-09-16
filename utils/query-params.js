// SortableTable
export const SEARCH_QUERY = 'q';
export const SORT_BY = 'sort';
export const DESCENDING = 'desc';
export const PAGE = 'page';

// ResourceYaml
export const MODE = 'mode';
export const _CREATE = 'create';
export const _VIEW = 'view';
export const _EDIT = 'edit';
export const _PREVIEW = 'preview';

export const DIFF = 'diff';
export const _UNIFIED = 'unified';
export const _SPLIT = 'split';

export function addParam(url, key, val) {
  let out = url + (url.indexOf('?') >= 0 ? '&' : '?');

  // val can be a string or an array of strings
  if ( !Array.isArray(val) ) {
    val = [val];
  }
  out += val.map((v) => {
    return `${ encodeURIComponent(key) }=${ encodeURIComponent(v) }`;
  }).join('&');

  return out;
}

export function addParams(url, params) {
  if ( params && typeof params === 'object' ) {
    Object.keys(params).forEach((key) => {
      url = addParam(url, key, params[key]);
    });
  }

  return url;
}
