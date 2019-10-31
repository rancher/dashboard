export function addParam(url, key, val) {
  let out = url + (url.includes('?') ? '&' : '?');

  // val can be a string or an array of strings
  if ( !Array.isArray(val) ) {
    val = [val];
  }
  out += val.map((v) => {
    if ( v === null ) {
      return `${ encodeURIComponent(key) }`;
    } else {
      return `${ encodeURIComponent(key) }=${ encodeURIComponent(v) }`;
    }
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

// parseUri 1.2.2
// (c) Steven Levithan <stevenlevithan.com>
// https://javascriptsource.com/parseuri/
// MIT License
export function parse(str) {
  const o = parse.options;
  const m = o.parser[o.strictMode ? 'strict' : 'loose'].exec(str);
  const uri = {};
  let i = 14;

  while (i--) {
    uri[o.key[i]] = m[i] || '';
  }

  uri[o.q.name] = {};
  uri[o.key[12]].replace(o.q.parser, ($0, $1, $2) => {
    if ($1) {
      uri[o.q.name][$1] = $2;
    }
  });

  return uri;
}

parse.options = {
  strictMode: false,
  key:        ['source', 'protocol', 'authority', 'userInfo', 'user', 'password', 'host', 'port', 'relative', 'path', 'directory', 'file', 'queryStr', 'anchor'],
  q:          {
    name:   'query',
    parser: /(?:^|&)([^&=]*)=?([^&]*)/g
  },
  parser: {
    strict: /^(?:([^:\/?#]+):)?(?:\/\/((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?))?((((?:[^?#\/]*\/)*)([^?#]*))(?:\?([^#]*))?(?:#(.*))?)/,
    loose:  /^(?:(?![^:@]+:[^:@\/]*@)([^:\/?#.]+):)?(?:\/\/)?((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/
  }
};
