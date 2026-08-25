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
  generateRandomAlphaString,
} from '@shell/utils/string';

describe('ucFirst', () => {
  it.each([
    {
      desc:     'capitalizes first letter of lowercase word',
      input:    'hello',
      expected: 'Hello',
    },
    {
      desc:     'leaves already-capitalized word unchanged',
      input:    'Hello',
      expected: 'Hello',
    },
    {
      desc:     'handles empty string',
      input:    '',
      expected: '',
    },
    {
      desc:     'handles null',
      input:    null,
      expected: '',
    },
    {
      desc:     'handles single character',
      input:    'a',
      expected: 'A',
    },
  ])('$desc', ({ input, expected }) => {
    expect(ucFirst(input as string)).toStrictEqual(expected);
  });
});

describe('lcFirst', () => {
  it.each([
    {
      desc:     'lowercases first letter of uppercase word',
      input:    'Hello',
      expected: 'hello',
    },
    {
      desc:     'leaves already-lowercased word unchanged',
      input:    'hello',
      expected: 'hello',
    },
    {
      desc:     'handles empty string',
      input:    '',
      expected: '',
    },
    {
      desc:     'handles null',
      input:    null,
      expected: '',
    },
  ])('$desc', ({ input, expected }) => {
    expect(lcFirst(input as string)).toStrictEqual(expected);
  });
});

describe('camelToTitle', () => {
  it.each([
    {
      desc:     'converts camelCase to title case',
      input:    'camelCase',
      expected: 'Camel Case',
    },
    {
      desc:     'handles single word',
      input:    'hello',
      expected: 'Hello',
    },
    {
      desc:     'handles empty string',
      input:    '',
      expected: '',
    },
    {
      desc:     'handles null',
      input:    null,
      expected: '',
    },
  ])('$desc', ({ input, expected }) => {
    expect(camelToTitle(input as string)).toStrictEqual(expected);
  });
});

describe('strPad', () => {
  it.each([
    {
      desc:     'pads left by default',
      str:      '5',
      toLength: 3,
      padChars: '0',
      right:    false,
      expected: '005',
    },
    {
      desc:     'pads right when right=true',
      str:      '5',
      toLength: 3,
      padChars: '0',
      right:    true,
      expected: '500',
    },
    {
      desc:     'returns string unchanged when already long enough',
      str:      'hello',
      toLength: 3,
      padChars: ' ',
      right:    false,
      expected: 'hello',
    },
    {
      desc:     'pads with space by default',
      str:      '5',
      toLength: 3,
      padChars: ' ',
      right:    false,
      expected: '  5',
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
      desc:     'escapes ampersand',
      input:    'a & b',
      expected: 'a &amp; b',
    },
    {
      desc:     'escapes less-than',
      input:    '<tag>',
      expected: '&lt;tag&gt;',
    },
    {
      desc:     'escapes quotes',
      input:    '"value"',
      expected: '&quot;value&quot;',
    },
    {
      desc:     'escapes single quotes',
      input:    "it's",
      expected: 'it&#39;s',
    },
    {
      desc:     'returns unchanged when no special chars',
      input:    'hello world',
      expected: 'hello world',
    },
  ])('$desc', ({ input, expected }) => {
    expect(escapeHtml(input)).toStrictEqual(expected);
  });
});

describe('escapeRegex', () => {
  it.each([
    {
      desc:     'escapes dots',
      input:    '1.2.3',
      expected: '1\\.2\\.3',
    },
    {
      desc:     'escapes asterisks',
      input:    'a*b',
      expected: 'a\\*b',
    },
    {
      desc:     'escapes square brackets',
      input:    '[test]',
      expected: '\\[test\\]',
    },
    {
      desc:     'leaves plain strings unchanged',
      input:    'hello',
      expected: 'hello',
    },
  ])('$desc', ({ input, expected }) => {
    expect(escapeRegex(input)).toStrictEqual(expected);
  });
});

describe('formatPercent', () => {
  it.each([
    {
      desc:         'formats value < 1 with 2 decimal places',
      value:        0.123,
      maxPrecision: 2,
      expected:     '0.12%',
    },
    {
      desc:         'formats value between 1 and 10 with 1 decimal place',
      value:        5.67,
      maxPrecision: 2,
      expected:     '5.7%',
    },
    {
      desc:         'rounds value >= 10 to integer',
      value:        99.9,
      maxPrecision: 2,
      expected:     '100%',
    },
    {
      desc:         'handles exact 10',
      value:        10,
      maxPrecision: 2,
      expected:     '10%',
    },
  ])('$desc', ({ value, maxPrecision, expected }) => {
    expect(formatPercent(value, maxPrecision)).toStrictEqual(expected);
  });
});

describe('pluralize', () => {
  it.each([
    {
      desc:     'adds -ies for consonant-y endings',
      input:    'category',
      expected: 'categories',
    },
    {
      desc:     'returns unchanged for -ics endings',
      input:    'metrics',
      expected: 'metrics',
    },
    {
      desc:     'adds -es for words ending in s',
      input:    'status',
      expected: 'statuses',
    },
    {
      desc:     'adds -s for regular words',
      input:    'cluster',
      expected: 'clusters',
    },
    {
      desc:     'does not remove y when preceded by vowel',
      input:    'key',
      expected: 'keys',
    },
  ])('$desc', ({ input, expected }) => {
    expect(pluralize(input)).toStrictEqual(expected);
  });
});

describe('indent', () => {
  it('indents a string with default settings', () => {
    expect(indent('hello')).toStrictEqual('  hello');
  });

  it('indents multiple lines in an array', () => {
    expect(indent(['line1', 'line2'])).toStrictEqual('  line1\n  line2');
  });

  it('indents a multiline string', () => {
    expect(indent('line1\nline2')).toStrictEqual('  line1\n  line2');
  });

  it('handles null/undefined input as empty', () => {
    expect(indent(null as unknown as string)).toStrictEqual('');
  });

  it('indents after a regex match', () => {
    expect(indent(['  - item'], 2, ' ', /^(\s*-\s*)/)).toStrictEqual('  -   item');
  });

  it('uses custom count and token', () => {
    expect(indent('x', 4, '-')).toStrictEqual('----x');
  });
});

describe('decamelize', () => {
  it.each([
    {
      desc:     'converts camelCase to snake_case',
      input:    'camelCase',
      expected: 'camel_case',
    },
    {
      desc:     'leaves lowercase unchanged',
      input:    'hello',
      expected: 'hello',
    },
    {
      desc:     'handles consecutive capitals',
      input:    'camelCaseWord',
      expected: 'camel_case_word',
    },
  ])('$desc', ({ input, expected }) => {
    expect(decamelize(input)).toStrictEqual(expected);
  });
});

describe('dasherize', () => {
  it.each([
    {
      desc:     'converts camelCase to kebab-case',
      input:    'camelCase',
      expected: 'camel-case',
    },
    {
      desc:     'replaces underscores with dashes',
      input:    'hello_world',
      expected: 'hello-world',
    },
    {
      desc:     'replaces spaces with dashes',
      input:    'hello world',
      expected: 'hello-world',
    },
  ])('$desc', ({ input, expected }) => {
    expect(dasherize(input)).toStrictEqual(expected);
  });
});

describe('asciiLike', () => {
  it.each([
    {
      desc:     'returns true for plain ASCII string',
      input:    'Hello World!',
      expected: true,
    },
    {
      desc:     'returns true for empty string',
      input:    '',
      expected: true,
    },
    {
      desc:     'returns false for string with non-ASCII characters',
      input:    'café',
      expected: false,
    },
    {
      desc:     'handles null as empty string',
      input:    null,
      expected: true,
    },
  ])('$desc', ({ input, expected }) => {
    expect(asciiLike(input as string)).toStrictEqual(expected);
  });
});

describe('coerceStringTypeToScalarType', () => {
  it.each([
    {
      desc:     'coerces string to float',
      val:      '3.14',
      type:     'float',
      expected: 3.14,
    },
    {
      desc:     'returns null for invalid float',
      val:      'abc',
      type:     'float',
      expected: null,
    },
    {
      desc:     'coerces string to int',
      val:      '42',
      type:     'int',
      expected: 42,
    },
    {
      desc:     'returns null for invalid int',
      val:      'abc',
      type:     'int',
      expected: null,
    },
    {
      desc:     'coerces "true" to boolean true',
      val:      'true',
      type:     'boolean',
      expected: true,
    },
    {
      desc:     'coerces "false" to boolean false',
      val:      'false',
      type:     'boolean',
      expected: false,
    },
    {
      desc:     'coerces "TRUE" (case-insensitive) to boolean true',
      val:      'TRUE',
      type:     'boolean',
      expected: true,
    },
    {
      desc:     'returns original string for unknown type',
      val:      'hello',
      type:     'string',
      expected: 'hello',
    },
  ])('$desc', ({ val, type, expected }) => {
    expect(coerceStringTypeToScalarType(val, type)).toStrictEqual(expected);
  });
});

describe('matchesSomeRegex', () => {
  it('returns true when string matches one of the regexes', () => {
    expect(matchesSomeRegex('hello', [/world/, /hello/])).toBe(true);
  });

  it('returns false when string matches none of the regexes', () => {
    expect(matchesSomeRegex('hello', [/world/, /foo/])).toBe(false);
  });

  it('returns false for empty regex array', () => {
    expect(matchesSomeRegex('hello', [])).toBe(false);
  });

  it('handles null string as empty string', () => {
    expect(matchesSomeRegex(null as unknown as string, [/^$/])).toBe(true);
  });

  it('accepts string patterns in the regex array', () => {
    expect(matchesSomeRegex('hello', ['hello' as unknown as RegExp])).toBe(true);
  });
});

describe('ensureRegex', () => {
  it('returns regex as-is when already a RegExp', () => {
    const re = /test/;

    expect(ensureRegex(re)).toStrictEqual(re);
  });

  it('wraps string in anchored case-insensitive regex by default', () => {
    const re = ensureRegex('hello');

    expect(re.test('hello')).toBe(true);
    expect(re.test('HELLO')).toBe(true);
    expect(re.test('hello world')).toBe(false);
  });

  it('wraps string in non-anchored regex when exact=false', () => {
    const re = ensureRegex('hello', false);

    expect(re.test('hello world')).toBe(true);
  });
});

describe('nlToBr', () => {
  it('converts newlines to <br/> tags', () => {
    expect(nlToBr('a\nb')).toStrictEqual('a<br/>\nb');
  });

  it('converts CRLF to <br/> tags', () => {
    expect(nlToBr('a\r\nb')).toStrictEqual('a<br/>\nb');
  });

  it('escapes HTML before conversion', () => {
    expect(nlToBr('<b>\na')).toStrictEqual('&lt;b&gt;<br/>\na');
  });

  it('handles null as empty string', () => {
    expect(nlToBr(null as unknown as string)).toStrictEqual('');
  });
});

describe('splitObjectPath', () => {
  it.each([
    {
      desc:     'splits simple dot-notation path',
      input:    'a.b.c',
      expected: ['a', 'b', 'c'],
    },
    {
      desc:     'splits quoted path segments',
      input:    '"a.b".c',
      expected: ['a.b', 'c'],
    },
    {
      desc:     'splits single-quoted path segments',
      input:    "'a.b'.c",
      expected: ['a.b', 'c'],
    },
    {
      desc:     'splits simple single segment',
      input:    'a',
      expected: ['a'],
    },
  ])('$desc', ({ input, expected }) => {
    expect(splitObjectPath(input)).toStrictEqual(expected);
  });
});

describe('joinObjectPath', () => {
  it.each([
    {
      desc:     'joins simple path segments',
      input:    ['a', 'b', 'c'],
      expected: 'a.b.c',
    },
    {
      desc:     'quotes segments containing dots',
      input:    ['a.b', 'c'],
      expected: '"a.b".c',
    },
    {
      desc:     'handles single segment',
      input:    ['a'],
      expected: 'a',
    },
  ])('$desc', ({ input, expected }) => {
    expect(joinObjectPath(input)).toStrictEqual(expected);
  });
});

describe('shortenedImage', () => {
  it.each([
    {
      desc:     'removes docker.io/library/ prefix',
      input:    'docker.io/library/nginx:latest',
      expected: 'nginx',
    },
    {
      desc:     'removes index.docker.io/ prefix',
      input:    'index.docker.io/library/nginx:1.0',
      expected: 'nginx:1.0',
    },
    {
      desc:     'truncates sha256 digest',
      input:    'myimage@sha256:abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
      expected: 'myimage@sha256:abcdef12…',
    },
    {
      desc:     'removes :latest suffix',
      input:    'myregistry.io/myimage:latest',
      expected: 'myregistry.io/myimage',
    },
    {
      desc:     'handles empty string',
      input:    '',
      expected: '',
    },
    {
      desc:     'handles null',
      input:    null,
      expected: '',
    },
  ])('$desc', ({ input, expected }) => {
    expect(shortenedImage(input as string)).toStrictEqual(expected);
  });
});

describe('isIpv4', () => {
  it.each([
    {
      desc:     'valid IP address',
      input:    '192.168.1.1',
      expected: true,
    },
    {
      desc:     'valid IP 0.0.0.0',
      input:    '0.0.0.0',
      expected: true,
    },
    {
      desc:     'valid IP 255.255.255.255',
      input:    '255.255.255.255',
      expected: true,
    },
    {
      desc:     'invalid IP with out-of-range octet',
      input:    '256.0.0.0',
      expected: false,
    },
    {
      desc:     'invalid IP with letters',
      input:    'not-an-ip',
      expected: false,
    },
    {
      desc:     'invalid IP with only 3 octets',
      input:    '192.168.1',
      expected: false,
    },
  ])('$desc', ({ input, expected }) => {
    expect(isIpv4(input)).toStrictEqual(expected);
  });
});

describe('sanitizeKey', () => {
  it.each([
    {
      desc:     'allows alphanumeric characters',
      input:    'key123',
      expected: 'key123',
    },
    {
      desc:     'allows dots, slashes, underscores, dashes',
      input:    'a.b/c_d-e',
      expected: 'a.b/c_d-e',
    },
    {
      desc:     'removes disallowed characters',
      input:    'key@#!',
      expected: 'key',
    },
    {
      desc:     'handles null as empty string',
      input:    null,
      expected: '',
    },
  ])('$desc', ({ input, expected }) => {
    expect(sanitizeKey(input as string)).toStrictEqual(expected);
  });
});

describe('sanitizeValue', () => {
  it.each([
    {
      desc:     'allows alphanumeric characters',
      input:    'val123',
      expected: 'val123',
    },
    {
      desc:     'allows dots, underscores, dashes',
      input:    'a.b_c-d',
      expected: 'a.b_c-d',
    },
    {
      desc:     'removes slashes and other disallowed characters',
      input:    'val/test@!',
      expected: 'valtest',
    },
    {
      desc:     'handles null as empty string',
      input:    null,
      expected: '',
    },
  ])('$desc', ({ input, expected }) => {
    expect(sanitizeValue(input as string)).toStrictEqual(expected);
  });
});

describe('sanitizeIP', () => {
  it.each([
    {
      desc:     'allows valid IPv4 characters',
      input:    '192.168.1.1',
      expected: '192.168.1.1',
    },
    {
      desc:     'allows valid IPv6 characters',
      input:    '::1',
      expected: '::1',
    },
    {
      desc:     'removes disallowed characters',
      input:    '192.168@1!1',
      expected: '192.16811',
    },
    {
      desc:     'handles null as empty string',
      input:    null,
      expected: '',
    },
  ])('$desc', ({ input, expected }) => {
    expect(sanitizeIP(input as string)).toStrictEqual(expected);
  });
});

describe('xOfy', () => {
  it.each([
    {
      desc:     'returns x/y for two numbers',
      x:        3,
      y:        10,
      expected: '3/10',
    },
    {
      desc:     'returns ?/y when x is not a number',
      x:        'a',
      y:        10,
      expected: '?/10',
    },
    {
      desc:     'returns x/? when y is not a number',
      x:        3,
      y:        null,
      expected: '3/?',
    },
    {
      desc:     'returns ?/? when both are not numbers',
      x:        undefined,
      y:        undefined,
      expected: '?/?',
    },
  ])('$desc', ({ x, y, expected }) => {
    expect(xOfy(x as number, y as number)).toStrictEqual(expected);
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
      desc:     'invalid characters',
      input:    'hello!',
      expected: false,
    },
  ])('$desc', ({ input, expected }) => {
    expect(isBase64(input)).toStrictEqual(expected);
  });
});

describe('generateRandomAlphaString', () => {
  it('generates a string of the specified length', () => {
    expect(generateRandomAlphaString(10)).toHaveLength(10);
  });

  it('generates only lowercase alpha characters', () => {
    const result = generateRandomAlphaString(100);

    expect(result).toMatch(/^[a-z]+$/);
  });

  it('generates different strings on successive calls', () => {
    const a = generateRandomAlphaString(20);
    const b = generateRandomAlphaString(20);

    // Extremely unlikely to collide in 20-char alpha space
    expect(a).not.toStrictEqual(b);
  });
});
