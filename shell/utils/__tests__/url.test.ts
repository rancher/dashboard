import {
  addParam, addParams, removeParam, parseLinkHeader, isMaybeSecure, portMatch, parse, stringify
} from '@shell/utils/url';

describe('fx: addParam', () => {
  it('should add a query parameter to a URL without existing params', () => {
    expect(addParam('https://example.com/path', 'foo', 'bar')).toStrictEqual('https://example.com/path?foo=bar');
  });

  it('should append a query parameter to a URL with existing params', () => {
    expect(addParam('https://example.com/path?a=1', 'b', '2')).toStrictEqual('https://example.com/path?a=1&b=2');
  });

  it('should encode special characters in key and value', () => {
    expect(addParam('https://example.com', 'my key', 'hello world')).toStrictEqual('https://example.com?my%20key=hello%20world');
  });

  it('should add multiple values from an array', () => {
    expect(addParam('https://example.com', 'tag', ['a', 'b'])).toStrictEqual('https://example.com?tag=a&tag=b');
  });

  it('should add a key-only param when value is null', () => {
    expect(addParam('https://example.com', 'flag', null)).toStrictEqual('https://example.com?flag');
  });

  it('should handle an array with a null value', () => {
    expect(addParam('https://example.com', 'flag', [null])).toStrictEqual('https://example.com?flag');
  });

  it('should add a param with an empty string value', () => {
    expect(addParam('https://example.com', 'key', '')).toStrictEqual('https://example.com?key=');
  });

  it('should add a duplicate key as an additional param', () => {
    expect(addParam('https://example.com?a=1', 'a', '2')).toStrictEqual('https://example.com?a=1&a=2');
  });
});

describe('fx: addParams', () => {
  it('should add multiple parameters to a URL', () => {
    expect(addParams('https://example.com', { a: '1', b: '2' })).toStrictEqual('https://example.com?a=1&b=2');
  });

  it('should return the URL unchanged if params is empty', () => {
    expect(addParams('https://example.com', {})).toStrictEqual('https://example.com');
  });

  it('should return the URL unchanged if params is null', () => {
    expect(addParams('https://example.com', null)).toStrictEqual('https://example.com');
  });

  it('should return the URL unchanged if params is a non-object value', () => {
    expect(addParams('https://example.com', 'not-an-object')).toStrictEqual('https://example.com');
  });
});

describe('fx: removeParam', () => {
  it('should remove a query parameter from a URL', () => {
    expect(removeParam('https://example.com?foo=bar&baz=qux', 'foo')).toStrictEqual('https://example.com/?baz=qux');
  });

  it('should return a normalized URL if the param does not exist', () => {
    expect(removeParam('https://example.com?a=1', 'nonexistent')).toStrictEqual('https://example.com/?a=1');
  });

  it('should remove the only query parameter', () => {
    expect(removeParam('https://example.com?only=param', 'only')).toStrictEqual('https://example.com/');
  });

  it('should normalize a key-only query parameter to key= (parser treats it as empty value)', () => {
    expect(removeParam('https://example.com?flag', 'flag')).toStrictEqual('https://example.com/?flag=');
  });
});

describe('fx: parseLinkHeader', () => {
  it('should parse a single link header entry', () => {
    expect(parseLinkHeader('<https://example.com/page2>; rel="next"')).toStrictEqual({ next: 'https://example.com/page2' });
  });

  it('should parse multiple link header entries', () => {
    const header = '<https://example.com/page2>; rel="next", <https://example.com/page1>; rel="prev"';

    expect(parseLinkHeader(header)).toStrictEqual({
      next: 'https://example.com/page2',
      prev: 'https://example.com/page1',
    });
  });

  it('should return an empty object for an empty string', () => {
    expect(parseLinkHeader('')).toStrictEqual({});
  });

  it('should return an empty object for a malformed header', () => {
    expect(parseLinkHeader('not a valid link header')).toStrictEqual({});
  });

  it('should lowercase the rel value', () => {
    expect(parseLinkHeader('<https://example.com>; rel="Next"')).toStrictEqual({ next: 'https://example.com' });
  });
});

describe('fx: portMatch', () => {
  it.each([
    {
      ports: [443], equals: [443, 8443], endsWith: [], expected: true, desc: 'port is in the equals list'
    },
    {
      ports: [8080], equals: [443, 8443], endsWith: ['443'], expected: false, desc: 'port is not in equals or endsWith lists'
    },
    {
      ports: [8443], equals: [], endsWith: ['443'], expected: true, desc: 'port string ends with the given suffix'
    },
    {
      ports: [443], equals: [], endsWith: ['443'], expected: false, desc: 'port equals the suffix exactly (endsWith excludes exact match)'
    },
    {
      ports: [], equals: [443], endsWith: ['443'], expected: false, desc: 'ports array is empty'
    },
    {
      ports: [80, 443], equals: [443], endsWith: [], expected: true, desc: 'any port in the array matches equals'
    },
    {
      ports: [18443], equals: [], endsWith: ['443'], expected: true, desc: 'multi-digit port ending with suffix'
    },
  ])('should return $expected when $desc', ({
    ports, equals, endsWith, expected
  }) => {
    expect(portMatch(ports, equals, endsWith)).toBe(expected);
  });
});

describe('fx: isMaybeSecure', () => {
  it.each([
    {
      port: 80, proto: 'https', expected: true, desc: 'https protocol'
    },
    {
      port: 80, proto: 'HTTPS', expected: true, desc: 'HTTPS protocol (case-insensitive)'
    },
    {
      port: 443, proto: 'http', expected: true, desc: 'port 443'
    },
    {
      port: 8443, proto: 'http', expected: true, desc: 'port 8443'
    },
    {
      port: 18443, proto: 'http', expected: true, desc: 'port 18443 (endsWith 443)'
    },
    {
      port: 80, proto: 'http', expected: false, desc: 'http on non-secure port'
    },
  ])('should return $expected for $desc', ({ port, proto, expected }) => {
    expect(isMaybeSecure(port, proto)).toBe(expected);
  });
});

describe('fx: parse', () => {
  it('should parse a simple URL', () => {
    const result = parse('https://example.com/path?foo=bar');

    expect(result.protocol).toStrictEqual('https');
    expect(result.host).toStrictEqual('example.com');
    expect(result.path).toStrictEqual('/path');
    expect(result.query).toStrictEqual({ foo: 'bar' });
  });

  it('should parse a URL with port', () => {
    const result = parse('https://example.com:8080/');

    expect(result.host).toStrictEqual('example.com');
    expect(result.port).toStrictEqual('8080');
  });

  it('should parse a URL with user credentials', () => {
    const result = parse('https://user:pass@example.com/');

    expect(result.user).toStrictEqual('user');
    expect(result.password).toStrictEqual('pass');
  });

  it('should parse a URL with anchor', () => {
    const result = parse('https://example.com/page#section1');

    expect(result.anchor).toStrictEqual('section1');
  });

  it('should parse a URL with multiple query params', () => {
    expect(parse('https://example.com?a=1&b=2').query).toStrictEqual({ a: '1', b: '2' });
  });

  it('should parse a URL with user only (no password)', () => {
    const result = parse('https://admin@example.com/');

    expect(result.user).toStrictEqual('admin');
    expect(result.password).toStrictEqual('');
  });

  it('should set empty strings for missing optional fields', () => {
    const result = parse('https://example.com/path');

    expect(result.port).toStrictEqual('');
    expect(result.anchor).toStrictEqual('');
    expect(result.user).toStrictEqual('');
    expect(result.password).toStrictEqual('');
  });
});

describe('fx: stringify', () => {
  it('should reconstruct a simple URL', () => {
    expect(stringify(parse('https://example.com/path'))).toStrictEqual('https://example.com/path');
  });

  it('should include user and password when both present', () => {
    expect(stringify(parse('https://user:pass@example.com/'))).toStrictEqual('https://user:pass@example.com/');
  });

  it('should include user only when password is absent', () => {
    expect(stringify(parse('https://admin@example.com/'))).toStrictEqual('https://admin@example.com/');
  });

  it('should include port when present', () => {
    expect(stringify(parse('https://example.com:9090/'))).toStrictEqual('https://example.com:9090/');
  });

  it('should include anchor when present', () => {
    expect(stringify(parse('https://example.com/page#section'))).toStrictEqual('https://example.com/page#section');
  });

  it('should default path to / when path is empty', () => {
    const parsed = parse('https://example.com');

    parsed.path = '';

    expect(stringify(parsed)).toStrictEqual('https://example.com/');
  });

  it('should include query parameters', () => {
    expect(stringify(parse('https://example.com/path?a=1&b=2'))).toStrictEqual('https://example.com/path?a=1&b=2');
  });

  it('should round-trip a complex URL', () => {
    const url = 'https://user:pass@example.com:8080/some/path?key=value&other=test#anchor';

    expect(stringify(parse(url))).toStrictEqual(url);
  });
});
