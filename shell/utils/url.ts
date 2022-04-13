type UriField = 'source' | 'protocol' | 'authority' | 'userInfo' | 'user' | 'password' | 'host' | 'port' | 'relative' | 'path' | 'directory' | 'file' | 'queryStr' | 'anchor'
type UriFields = {
  [key in UriField]: string; // eslint-disable-line no-unused-vars
}
type QueryParams = {
  [key: string]: string
}

interface ParsedUri extends UriFields {
  query: QueryParams;
}

export function addParam(url: string, key: string, val: string | string[]): string {
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

export function addParams(url: string, params: QueryParams): string {
  if ( params && typeof params === 'object' ) {
    Object.keys(params).forEach((key) => {
      url = addParam(url, key, params[key]);
    });
  }

  return url;
}

export function removeParam(url: string, key: string): string {
  const parsed = parse(url);

  if ( parsed.query?.[key] ) {
    delete parsed.query[key];
  }

  return stringify(parsed);
}

export function parseLinkHeader(str: string) {
  const out: { [key: string]: string} = { };
  const lines = (str || '').split(',');

  for ( const line of lines ) {
    const match = line.match(/^\s*<([^>]+)>\s*;\s*rel\s*="(.*)"/);

    if ( match ) {
      out[match[2].toLowerCase()] = match[1];
    }
  }

  return out;
}

export function isMaybeSecure(port: number, proto: string): boolean {
  const protocol = proto.toLowerCase();

  return portMatch([port], [443, 8443], ['443']) || protocol === 'https';
}

export function portMatch(ports: number[], equals: number[], endsWith: string[]): boolean {
  for (let i = 0; i < ports.length; i++) {
    const port = ports[i];

    if (equals.includes(port)) {
      return true;
    }

    for (let j = 0; j < endsWith.length; j++) {
      const suffix = `${ endsWith[j] }`;
      const portStr = `${ port }`;

      if (portStr !== suffix && portStr.endsWith(suffix)) {
        return true;
      }
    }
  }

  return false;
}

// parseUri 1.2.2
// (c) Steven Levithan <stevenlevithan.com>
// https://javascriptsource.com/parseuri/
// MIT License
export function parse(str: string): ParsedUri {
  const o = parse.options;
  const m = o.parser[o.strictMode ? 'strict' : 'loose'].exec(str);

  if (!m) {
    throw new Error(`Cannot parse as uri: ${ str }`);
  }
  const uri = {} as ParsedUri;
  let i = 14;

  while (i--) {
    uri[o.key[i]] = m[i] || '';
  }

  uri.query = {};
  uri.queryStr.replace(o.q.parser, (_, $1: string, $2: string): string => {
    if ($1) {
      uri[o.q.name][$1] = $2;
    }

    return '';
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
} as {
  strictMode: boolean,
  key: UriField[],
  q: {
    name: 'query',
    parser: RegExp
  },
  parser: {
    strict: RegExp,
    loose: RegExp
  }
};

export function stringify(uri: ParsedUri): string {
  let out = `${ uri.protocol }://`;

  if ( uri.user && uri.password ) {
    out += `${ uri.user }:${ uri.password }@`;
  } else if ( uri.user ) {
    out += `${ uri.user }@`;
  }

  out += uri.host;

  if ( uri.port ) {
    out += `:${ uri.port }`;
  }

  out += uri.path || '/';

  out = addParams(out, uri.query || {});

  if ( uri.anchor ) {
    out += `#${ uri.anchor }`;
  }

  return out;
}
