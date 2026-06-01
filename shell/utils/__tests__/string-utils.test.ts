import {
  camelToTitle,
  ucFirst,
  lcFirst,
  strPad,
  escapeHtml,
  escapeRegex,
  formatPercent,
  pluralize,
  indent,
  decamelize,
  dasherize,
  asciiLike,
  coerceStringTypeToScalarType,
  matchesSomeRegex,
  ensureRegex,
  nlToBr,
  splitObjectPath,
  joinObjectPath,
  shortenedImage,
  isIpv4,
  sanitizeKey,
  sanitizeValue,
  sanitizeIP,
  xOfy,
  isBase64,
} from '@shell/utils/string';

describe('camelToTitle', () => {
  it.each([
    {
      desc:     'simple camelCase',
      input:    'fooBar',
      expected: 'Foo Bar',
    },
    {
      desc:     'single word',
      input:    'foo',
      expected: 'Foo',
    },
    {
      desc:     'multiple humps',
      input:    'fooBarBaz',
      expected: 'Foo Bar Baz',
    },
    {
      desc:     'empty string',
      input:    '',
      expected: '',
    },
    {
      desc:     'null-ish (falsy) value',
      input:    null as unknown as string,
      expected: '',
    },
  ])('converts $desc', ({ input, expected }) => {
    expect(camelToTitle(input)).toStrictEqual(expected);
  });
});

describe('ucFirst', () => {
  it.each([
    {
      desc:     'lowercase word',
      input:    'hello',
      expected: 'Hello',
    },
    {
      desc:     'already capitalised word',
      input:    'Hello',
      expected: 'Hello',
    },
    {
      desc:     'empty string',
      input:    '',
      expected: '',
    },
    {
      desc:     'falsy value',
      input:    null as unknown as string,
      expected: '',
    },
  ])('capitalises first char for $desc', ({ input, expected }) => {
    expect(ucFirst(input)).toStrictEqual(expected);
  });
});

describe('lcFirst', () => {
  it.each([
    {
      desc:     'uppercase word',
      input:    'Hello',
      expected: 'hello',
    },
    {
      desc:     'already lowercase word',
      input:    'hello',
      expected: 'hello',
    },
    {
      desc:     'empty string',
      input:    '',
      expected: '',
    },
    {
      desc:     'falsy value',
      input:    null as unknown as string,
      expected: '',
    },
  ])('lowercases first char for $desc', ({ input, expected }) => {
    expect(lcFirst(input)).toStrictEqual(expected);
  });
});

describe('strPad', () => {
  it.each([
    {
      desc:     'pads on left by default',
      str:      'hi',
      toLength: 5,
      padChars: ' ',
      right:    false,
      expected: '   hi',
    },
    {
      desc:     'pads on right when flag set',
      str:      'hi',
      toLength: 5,
      padChars: ' ',
      right:    true,
      expected: 'hi   ',
    },
    {
      desc:     'returns string unchanged when already at length',
      str:      'hello',
      toLength: 5,
      padChars: ' ',
      right:    false,
      expected: 'hello',
    },
    {
      desc:     'returns string unchanged when longer than length',
      str:      'toolong',
      toLength: 3,
      padChars: ' ',
      right:    false,
      expected: 'toolong',
    },
    {
      desc:     'uses custom pad characters',
      str:      '7',
      toLength: 4,
      padChars: '0',
      right:    false,
      expected: '0007',
    },
  ])('$desc', ({
    str, toLength, padChars, right, expected,
  }) => {
    expect(strPad(str, toLength, padChars, right)).toStrictEqual(expected);
  });
});

describe('escapeHtml', () => {
  it.each([
    {
      desc:     'ampersand',
      input:    'a & b',
      expected: 'a &amp; b',
    },
    {
      desc:     'less-than',
      input:    '<tag>',
      expected: '&lt;tag&gt;',
    },
    {
      desc:     'double quote',
      input:    '"value"',
      expected: '&quot;value&quot;',
    },
    {
      desc:     'single quote',
      input:    "it's",
      expected: 'it&#39;s',
    },
    {
      desc:     'forward slash is not escaped (not in regex)',
      input:    'a/b',
      expected: 'a/b',
    },
    {
      desc:     'plain string with no special chars',
      input:    'hello world',
      expected: 'hello world',
    },
  ])('escapes $desc', ({ input, expected }) => {
    expect(escapeHtml(input)).toStrictEqual(expected);
  });
});

describe('escapeRegex', () => {
  it.each([
    {
      desc:     'dot and star',
      input:    '1.0*',
      expected: '1\\.0\\*',
    },
    {
      desc:     'brackets',
      input:    'a[0]',
      expected: 'a\\[0\\]',
    },
    {
      desc:     'plain string',
      input:    'hello',
      expected: 'hello',
    },
    {
      desc:     'all special characters',
      input:    '.*+?^${}()|[\\]',
      expected: '\\.\\*\\+\\?\\^\\$\\{\\}\\(\\)\\|\\[\\\\\\]',
    },
  ])('escapes $desc', ({ input, expected }) => {
    expect(escapeRegex(input)).toStrictEqual(expected);
  });
});

describe('formatPercent', () => {
  it.each([
    {
      desc:         'value < 1 with default precision',
      value:        0.123,
      maxPrecision: 2,
      expected:     '0.12%',
    },
    {
      desc:         'value between 1 and 10 with default precision',
      value:        5.678,
      maxPrecision: 2,
      expected:     '5.7%',
    },
    {
      desc:         'value >= 10 rounds to integer',
      value:        12.6,
      maxPrecision: 2,
      expected:     '13%',
    },
    {
      desc:         'exactly 1 with precision 1',
      value:        1,
      maxPrecision: 1,
      expected:     '1%',
    },
    {
      desc:         'value < 1 but precision < 2 falls through to round',
      value:        0.5,
      maxPrecision: 0,
      expected:     '1%',
    },
  ])('formats $desc', ({ value, maxPrecision, expected }) => {
    expect(formatPercent(value, maxPrecision)).toStrictEqual(expected);
  });
});

describe('pluralize', () => {
  it.each([
    {
      desc:     'word ending in consonant+y',
      input:    'category',
      expected: 'categories',
    },
    {
      desc:     'word ending in vowel+y stays -ys form',
      input:    'day',
      expected: 'days',
    },
    {
      desc:     'word ending in -ics is unchanged',
      input:    'metrics',
      expected: 'metrics',
    },
    {
      desc:     'word ending in -s gets -es',
      input:    'bus',
      expected: 'buses',
    },
    {
      desc:     'regular word gets -s',
      input:    'cluster',
      expected: 'clusters',
    },
  ])('pluralises $desc', ({ input, expected }) => {
    expect(pluralize(input)).toStrictEqual(expected);
  });
});

describe('indent', () => {
  it('indents a string with default 2 spaces', () => {
    expect(indent('hello\nworld')).toStrictEqual('  hello\n  world');
  });

  it('indents an array of lines', () => {
    expect(indent(['a', 'b'], 4)).toStrictEqual('    a\n    b');
  });

  it('uses a custom token', () => {
    expect(indent('x', 3, '-')).toStrictEqual('---x');
  });

  it('handles null/undefined lines as empty array', () => {
    expect(indent(null as unknown as string)).toStrictEqual('');
  });

  it('indents after a regex match', () => {
    const result = indent('  key: value', 2, ' ', /^(\s+)/);

    expect(result).toStrictEqual('    key: value');
  });
});

describe('decamelize', () => {
  it.each([
    {
      desc:     'camelCase',
      input:    'fooBar',
      expected: 'foo_bar',
    },
    {
      desc:     'multiple humps',
      input:    'fooBarBaz',
      expected: 'foo_bar_baz',
    },
    {
      desc:     'already lowercase',
      input:    'foo',
      expected: 'foo',
    },
  ])('decamelises $desc', ({ input, expected }) => {
    expect(decamelize(input)).toStrictEqual(expected);
  });
});

describe('dasherize', () => {
  it.each([
    {
      desc:     'camelCase word',
      input:    'fooBar',
      expected: 'foo-bar',
    },
    {
      desc:     'underscored word',
      input:    'foo_bar',
      expected: 'foo-bar',
    },
    {
      desc:     'spaced words',
      input:    'foo bar',
      expected: 'foo-bar',
    },
  ])('dasherizes $desc', ({ input, expected }) => {
    expect(dasherize(input)).toStrictEqual(expected);
  });
});

describe('asciiLike', () => {
  it.each([
    {
      desc:     'plain ASCII string',
      input:    'hello world',
      expected: true,
    },
    {
      desc:     'tab character',
      input:    'a\tb',
      expected: true,
    },
    {
      desc:     'newline character',
      input:    'a\nb',
      expected: true,
    },
    {
      desc:     'string with non-ASCII character',
      input:    'héllo',
      expected: false,
    },
    {
      desc:     'empty string (falsy)',
      input:    '',
      expected: true,
    },
  ])('returns $expected for $desc', ({ input, expected }) => {
    expect(asciiLike(input)).toStrictEqual(expected);
  });
});

describe('coerceStringTypeToScalarType', () => {
  it.each([
    {
      desc:     'float string',
      val:      '3.14',
      type:     'float',
      expected: 3.14,
    },
    {
      desc:     'non-numeric float string',
      val:      'abc',
      type:     'float',
      expected: null,
    },
    {
      desc:     'int string',
      val:      '42',
      type:     'int',
      expected: 42,
    },
    {
      desc:     'non-numeric int string',
      val:      'abc',
      type:     'int',
      expected: null,
    },
    {
      desc:     'boolean true string',
      val:      'true',
      type:     'boolean',
      expected: true,
    },
    {
      desc:     'boolean false string',
      val:      'false',
      type:     'boolean',
      expected: false,
    },
    {
      desc:     'boolean uppercase TRUE',
      val:      'TRUE',
      type:     'boolean',
      expected: true,
    },
    {
      desc:     'non-boolean string (passthrough)',
      val:      'yes',
      type:     'boolean',
      expected: 'yes',
    },
    {
      desc:     'unknown type passthrough',
      val:      'hello',
      type:     'string',
      expected: 'hello',
    },
  ])('coerces $desc', ({ val, type, expected }) => {
    expect(coerceStringTypeToScalarType(val, type)).toStrictEqual(expected);
  });
});

describe('ensureRegex', () => {
  it('returns a regex unchanged when passed a regex', () => {
    const re = /foo/;

    expect(ensureRegex(re)).toStrictEqual(re);
  });

  it('converts a string to an exact case-insensitive regex by default', () => {
    const result = ensureRegex('foo.bar');

    expect(result).toStrictEqual(/^foo\.bar$/i);
  });

  it('converts a string to a non-exact regex when exact is false', () => {
    const result = ensureRegex('foo', false);

    expect(result).toStrictEqual(/foo/i);
  });
});

describe('matchesSomeRegex', () => {
  it('returns true when one regex matches', () => {
    expect(matchesSomeRegex('hello', ['hello', 'world'])).toStrictEqual(true);
  });

  it('returns false when no regex matches', () => {
    expect(matchesSomeRegex('goodbye', ['hello', 'world'])).toStrictEqual(false);
  });

  it('returns false for an empty regexes list', () => {
    expect(matchesSomeRegex('anything', [])).toStrictEqual(false);
  });

  it('handles falsy string as empty string', () => {
    expect(matchesSomeRegex(null as unknown as string, ['hello'])).toStrictEqual(false);
  });
});

describe('nlToBr', () => {
  it.each([
    {
      desc:     'LF newline',
      input:    'a\nb',
      expected: 'a<br/>\nb',
    },
    {
      desc:     'CR+LF newline',
      input:    'a\r\nb',
      expected: 'a<br/>\nb',
    },
    {
      desc:     'CR newline',
      input:    'a\rb',
      expected: 'a<br/>\nb',
    },
    {
      desc:     'HTML that gets escaped before converting',
      input:    '<b>\ntext',
      expected: '&lt;b&gt;<br/>\ntext',
    },
    {
      desc:     'falsy value',
      input:    null as unknown as string,
      expected: '',
    },
  ])('converts $desc', ({ input, expected }) => {
    expect(nlToBr(input)).toStrictEqual(expected);
  });
});

describe('splitObjectPath', () => {
  it.each([
    {
      desc:     'simple dotted path',
      input:    'a.b.c',
      expected: ['a', 'b', 'c'],
    },
    {
      desc:     'double-quoted segment',
      input:    'a."b.c".d',
      expected: ['a', 'b.c', 'd'],
    },
    {
      desc:     'single-quoted segment',
      input:    "a.'b.c'.d",
      expected: ['a', 'b.c', 'd'],
    },
    {
      desc:     'single element path',
      input:    'foo',
      expected: ['foo'],
    },
  ])('splits $desc', ({ input, expected }) => {
    expect(splitObjectPath(input)).toStrictEqual(expected);
  });
});

describe('joinObjectPath', () => {
  it.each([
    {
      desc:     'simple segments',
      input:    ['a', 'b', 'c'],
      expected: 'a.b.c',
    },
    {
      desc:     'segment containing a dot',
      input:    ['a', 'b.c', 'd'],
      expected: 'a."b.c".d',
    },
    {
      desc:     'single element',
      input:    ['foo'],
      expected: 'foo',
    },
  ])('joins $desc', ({ input, expected }) => {
    expect(joinObjectPath(input)).toStrictEqual(expected);
  });
});

describe('shortenedImage', () => {
  it.each([
    {
      desc:     'docker.io/library prefix',
      input:    'docker.io/library/nginx:latest',
      expected: 'nginx',
    },
    {
      desc:     'index.docker.io prefix',
      input:    'index.docker.io/library/ubuntu:latest',
      expected: 'ubuntu',
    },
    {
      desc:     ':latest suffix removal',
      input:    'myrepo/myimage:latest',
      expected: 'myrepo/myimage',
    },
    {
      desc:     'sha256 digest abbreviated',
      input:    'myrepo/myimage@sha256:abcdef1234567890abcd',
      expected: 'myrepo/myimage@sha256:abcdef12…',
    },
    {
      desc:     'image with specific tag kept intact',
      input:    'myrepo/myimage:v1.2.3',
      expected: 'myrepo/myimage:v1.2.3',
    },
    {
      desc:     'falsy value',
      input:    null as unknown as string,
      expected: '',
    },
  ])('shortens $desc', ({ input, expected }) => {
    expect(shortenedImage(input)).toStrictEqual(expected);
  });
});

describe('isIpv4', () => {
  it.each([
    {
      desc:     'valid IP',
      input:    '192.168.1.1',
      expected: true,
    },
    {
      desc:     'boundary IP 0.0.0.0',
      input:    '0.0.0.0',
      expected: true,
    },
    {
      desc:     'boundary IP 255.255.255.255',
      input:    '255.255.255.255',
      expected: true,
    },
    {
      desc:     'octet out of range',
      input:    '256.0.0.1',
      expected: false,
    },
    {
      desc:     'too few octets',
      input:    '192.168.1',
      expected: false,
    },
    {
      desc:     'empty string',
      input:    '',
      expected: false,
    },
    {
      desc:     'hostname string',
      input:    'localhost',
      expected: false,
    },
  ])('returns $expected for $desc', ({ input, expected }) => {
    expect(isIpv4(input)).toStrictEqual(expected);
  });
});

describe('sanitizeKey', () => {
  it.each([
    {
      desc:     'allowed characters unchanged',
      input:    'abc-def_0.9/z',
      expected: 'abc-def_0.9/z',
    },
    {
      desc:     'strips spaces',
      input:    'hello world',
      expected: 'helloworld',
    },
    {
      desc:     'strips special chars',
      input:    'key@#!',
      expected: 'key',
    },
    {
      desc:     'falsy value',
      input:    null as unknown as string,
      expected: '',
    },
  ])('sanitizes $desc', ({ input, expected }) => {
    expect(sanitizeKey(input)).toStrictEqual(expected);
  });
});

describe('sanitizeValue', () => {
  it.each([
    {
      desc:     'allowed characters unchanged',
      input:    'abc-def_0.9z',
      expected: 'abc-def_0.9z',
    },
    {
      desc:     'strips slashes',
      input:    'val/ue',
      expected: 'value',
    },
    {
      desc:     'strips spaces',
      input:    'hello world',
      expected: 'helloworld',
    },
    {
      desc:     'falsy value',
      input:    null as unknown as string,
      expected: '',
    },
  ])('sanitizes $desc', ({ input, expected }) => {
    expect(sanitizeValue(input)).toStrictEqual(expected);
  });
});

describe('sanitizeIP', () => {
  it.each([
    {
      desc:     'IPv4 address unchanged',
      input:    '192.168.1.1',
      expected: '192.168.1.1',
    },
    {
      desc:     'IPv6 address unchanged',
      input:    '::1',
      expected: '::1',
    },
    {
      desc:     'strips spaces',
      input:    '192.168 .1.1',
      expected: '192.168.1.1',
    },
    {
      desc:     'falsy value',
      input:    null as unknown as string,
      expected: '',
    },
  ])('sanitizes $desc', ({ input, expected }) => {
    expect(sanitizeIP(input)).toStrictEqual(expected);
  });
});

describe('xOfy', () => {
  it.each([
    {
      desc:     'two numbers',
      x:        3,
      y:        10,
      expected: '3/10',
    },
    {
      desc:     'x is not a number',
      x:        'unknown' as unknown as number,
      y:        10,
      expected: '?/10',
    },
    {
      desc:     'y is not a number',
      x:        3,
      y:        null as unknown as number,
      expected: '3/?',
    },
    {
      desc:     'both non-numbers',
      x:        undefined as unknown as number,
      y:        undefined as unknown as number,
      expected: '?/?',
    },
  ])('formats $desc', ({ x, y, expected }) => {
    expect(xOfy(x, y)).toStrictEqual(expected);
  });
});

describe('isBase64', () => {
  it.each([
    {
      desc:     'valid base64 string',
      input:    'aGVsbG8=',
      expected: true,
    },
    {
      desc:     'valid base64 without padding',
      input:    'aGVsbG8',
      expected: false,
    },
    {
      desc:     'empty string',
      input:    '',
      expected: true,
    },
    {
      desc:     'non-base64 characters',
      input:    'hello world!',
      expected: false,
    },
    {
      desc:     'valid base64 with double padding',
      input:    'YQ==',
      expected: true,
    },
  ])('returns $expected for $desc', ({ input, expected }) => {
    expect(isBase64(input)).toStrictEqual(expected);
  });
});
