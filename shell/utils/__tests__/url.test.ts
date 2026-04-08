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
    expect(addParam('https://example.com', 'flag', null as any)).toStrictEqual('https://example.com?flag');
  });

  it('should handle an array with a null value', () => {
    expect(addParam('https://example.com', 'flag', [null as any])).toStrictEqual('https://example.com?flag');
  });
});

describe('fx: addParams', () => {
  it('should add multiple parameters to a URL', () => {
    const result = addParams('https://example.com', { a: '1', b: '2' });

    expect(result).toContain('a=1');
    expect(result).toContain('b=2');
  });

  it('should return the URL unchanged if params is empty', () => {
    expect(addParams('https://example.com', {})).toStrictEqual('https://example.com');
  });

  it('should return the URL unchanged if params is null', () => {
    expect(addParams('https://example.com', null as any)).toStrictEqual('https://example.com');
  });

  it('should return the URL unchanged if params is a non-object value', () => {
    expect(addParams('https://example.com', 'not-an-object' as any)).toStrictEqual('https://example.com');
  });
});

describe('fx: removeParam', () => {
  it('should remove a query parameter from a URL', () => {
    const result = removeParam('https://example.com?foo=bar&baz=qux', 'foo');

    expect(result).not.toContain('foo=bar');
    expect(result).toContain('baz=qux');
  });

  it('should return the URL unchanged if the param does not exist', () => {
    const result = removeParam('https://example.com?a=1', 'nonexistent');

    expect(result).toContain('a=1');
  });
});

describe('fx: parseLinkHeader', () => {
  it('should parse a single link header entry', () => {
    const header = '<https://example.com/page2>; rel="next"';
    const result = parseLinkHeader(header);

    expect(result).toStrictEqual({ next: 'https://example.com/page2' });
  });

  it('should parse multiple link header entries', () => {
    const header = '<https://example.com/page2>; rel="next", <https://example.com/page1>; rel="prev"';
    const result = parseLinkHeader(header);

    expect(result).toStrictEqual({
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
    const header = '<https://example.com>; rel="Next"';
    const result = parseLinkHeader(header);

    expect(result).toStrictEqual({ next: 'https://example.com' });
  });
});

describe('fx: portMatch', () => {
  it('should return true when port is in the equals list', () => {
    expect(portMatch([443], [443, 8443], [])).toBe(true);
  });

  it('should return false when port is not in equals or endsWith lists', () => {
    expect(portMatch([8080], [443, 8443], ['443'])).toBe(false);
  });

  it('should return true when port string ends with the given suffix', () => {
    expect(portMatch([8443], [], ['443'])).toBe(true);
  });

  it('should not match when port equals the suffix exactly (must be a suffix, not equal)', () => {
    expect(portMatch([443], [], ['443'])).toBe(false);
  });

  it('should return false for an empty ports array', () => {
    expect(portMatch([], [443], ['443'])).toBe(false);
  });

  it('should return true if any port in the array matches', () => {
    expect(portMatch([80, 443], [443], [])).toBe(true);
  });
});

describe('fx: isMaybeSecure', () => {
  it('should return true for https protocol', () => {
    expect(isMaybeSecure(80, 'https')).toBe(true);
  });

  it('should return true for HTTPS protocol (case-insensitive)', () => {
    expect(isMaybeSecure(80, 'HTTPS')).toBe(true);
  });

  it('should return true for port 443', () => {
    expect(isMaybeSecure(443, 'http')).toBe(true);
  });

  it('should return true for port 8443', () => {
    expect(isMaybeSecure(8443, 'http')).toBe(true);
  });

  it('should return false for http on non-secure port', () => {
    expect(isMaybeSecure(80, 'http')).toBe(false);
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
    const result = parse('https://example.com?a=1&b=2');

    expect(result.query).toStrictEqual({ a: '1', b: '2' });
  });
});

describe('fx: stringify', () => {
  it('should reconstruct a simple URL', () => {
    const parsed = parse('https://example.com/path');
    const result = stringify(parsed);

    expect(result).toContain('https://');
    expect(result).toContain('example.com');
    expect(result).toContain('/path');
  });

  it('should include user and password when both present', () => {
    const parsed = parse('https://user:pass@example.com/');
    const result = stringify(parsed);

    expect(result).toContain('user:pass@');
  });

  it('should include port when present', () => {
    const parsed = parse('https://example.com:9090/');
    const result = stringify(parsed);

    expect(result).toContain(':9090');
  });

  it('should include anchor when present', () => {
    const parsed = parse('https://example.com/page#section');
    const result = stringify(parsed);

    expect(result).toContain('#section');
  });

  it('should default path to / when path is empty', () => {
    const parsed = parse('https://example.com');

    parsed.path = '';
    const result = stringify(parsed);

    expect(result).toContain('example.com/');
  });
});
