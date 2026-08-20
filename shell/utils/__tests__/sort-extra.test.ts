import {
  typeOf,
  spaceship,
  compare,
  parseField,
  sortBy,
  sortableNumericSuffix,
  isNumeric,
} from '@shell/utils/sort';

describe('typeOf', () => {
  it.each([
    {
      desc:     'null',
      input:    null,
      expected: 'null',
    },
    {
      desc:     'undefined',
      input:    undefined,
      expected: 'undefined',
    },
    {
      desc:     'string primitive',
      input:    'hello',
      expected: 'string',
    },
    {
      desc:     'number primitive',
      input:    42,
      expected: 'number',
    },
    {
      desc:     'boolean primitive',
      input:    true,
      expected: 'boolean',
    },
    {
      desc:     'array',
      input:    [1, 2, 3],
      expected: 'array',
    },
    {
      desc:     'plain object',
      input:    { a: 1 },
      expected: 'object',
    },
    {
      desc:     'regexp',
      input:    /abc/,
      expected: 'regexp',
    },
    {
      desc:     'function',
      input:    () => {},
      expected: 'function',
    },
    {
      desc:     'Date instance',
      input:    new Date(),
      expected: 'date',
    },
    {
      desc:     'Error instance',
      input:    new Error('oops'),
      expected: 'error',
    },
  ])('returns "$expected" for $desc', ({ input, expected }) => {
    expect(typeOf(input)).toStrictEqual(expected);
  });
});

describe('spaceship', () => {
  it.each([
    {
      desc:     'a less than b',
      a:        1,
      b:        2,
      expected: -1,
    },
    {
      desc:     'a greater than b',
      a:        5,
      b:        3,
      expected: 1,
    },
    {
      desc:     'a equal to b',
      a:        4,
      b:        4,
      expected: 0,
    },
  ])('returns $expected when $desc', ({ a, b, expected }) => {
    expect(spaceship(a, b)).toStrictEqual(expected);
  });
});

describe('compare', () => {
  it.each([
    {
      desc:     'two equal numbers',
      a:        5,
      b:        5,
      expected: 0,
    },
    {
      desc:     'number a less than b',
      a:        1,
      b:        2,
      expected: -1,
    },
    {
      desc:     'number a greater than b',
      a:        3,
      b:        2,
      expected: 1,
    },
    {
      desc:     'two equal booleans',
      a:        true,
      b:        true,
      expected: 0,
    },
    {
      desc:     'boolean false less than true',
      a:        false,
      b:        true,
      expected: -1,
    },
    {
      desc:     'equal strings',
      a:        'abc',
      b:        'abc',
      expected: 0,
    },
    {
      desc:     'string a before b alphabetically',
      a:        'apple',
      b:        'banana',
      expected: -1,
    },
    {
      desc:     'string a after b alphabetically',
      a:        'zebra',
      b:        'apple',
      expected: 1,
    },
    {
      desc:     'null vs null',
      a:        null,
      b:        null,
      expected: 0,
    },
    {
      desc:     'undefined vs undefined',
      a:        undefined,
      b:        undefined,
      expected: 0,
    },
    {
      desc:     'null (type order 1) before number (type order 3)',
      a:        null,
      b:        1,
      expected: -1,
    },
    {
      desc:     'number (type order 3) after null (type order 1)',
      a:        1,
      b:        null,
      expected: 1,
    },
    {
      desc:     'two equal dates',
      a:        new Date('2024-01-01'),
      b:        new Date('2024-01-01'),
      expected: 0,
    },
    {
      desc:     'earlier date before later date',
      a:        new Date('2024-01-01'),
      b:        new Date('2025-01-01'),
      expected: -1,
    },
    {
      desc:     'later date after earlier date',
      a:        new Date('2025-01-01'),
      b:        new Date('2024-01-01'),
      expected: 1,
    },
  ])('compares $desc → $expected', ({ a, b, expected }) => {
    expect(compare(a, b)).toStrictEqual(expected);
  });

  describe('array comparison', () => {
    it('returns 0 for two equal arrays', () => {
      expect(compare([1, 2], [1, 2])).toStrictEqual(0);
    });

    it('returns -1 when first differing element is smaller', () => {
      expect(compare([1, 2], [1, 3])).toStrictEqual(-1);
    });

    it('returns 1 when first differing element is larger', () => {
      expect(compare([2, 1], [1, 9])).toStrictEqual(1);
    });

    it('returns -1 for shorter array when all shared elements are equal', () => {
      expect(compare([1], [1, 2])).toStrictEqual(-1);
    });

    it('returns 1 for longer array when all shared elements are equal', () => {
      expect(compare([1, 2], [1])).toStrictEqual(1);
    });
  });

  describe('object and function types', () => {
    it('returns 0 for two plain objects (no type order difference)', () => {
      expect(compare({ a: 1 }, { b: 2 })).toStrictEqual(0);
    });
  });
});

describe('parseField', () => {
  it.each([
    {
      desc:     'plain field name',
      input:    'name',
      expected: { field: 'name', reverse: false },
    },
    {
      desc:     'field with :desc suffix',
      input:    'name:desc',
      expected: { field: 'name', reverse: true },
    },
    {
      desc:     'field with :asc suffix (not :desc, treated as plain)',
      input:    'name:asc',
      expected: { field: 'name:asc', reverse: false },
    },
    {
      desc:     'nested path field',
      input:    'metadata.name',
      expected: { field: 'metadata.name', reverse: false },
    },
    {
      desc:     'nested path with :desc suffix',
      input:    'metadata.name:desc',
      expected: { field: 'metadata.name', reverse: true },
    },
  ])('parses $desc', ({ input, expected }) => {
    expect(parseField(input)).toStrictEqual(expected);
  });
});

describe('sortBy with :desc field modifier', () => {
  it('reverses sort order for field with :desc suffix', () => {
    const ary = [{ name: 'apple' }, { name: 'cherry' }, { name: 'banana' }];
    const result = sortBy(ary, ['name:desc']);

    expect(result).toStrictEqual([
      { name: 'cherry' },
      { name: 'banana' },
      { name: 'apple' },
    ]);
  });

  it('handles mixed :desc and normal fields', () => {
    const ary = [
      { a: 1, b: 2 },
      { a: 1, b: 1 },
      { a: 2, b: 3 },
    ];
    const result = sortBy(ary, ['a', 'b:desc']);

    expect(result).toStrictEqual([
      { a: 1, b: 2 },
      { a: 1, b: 1 },
      { a: 2, b: 3 },
    ]);
  });

  it('handles null/undefined array', () => {
    expect(sortBy(null, ['name'])).toStrictEqual([]);
    expect(sortBy(undefined, ['name'])).toStrictEqual([]);
  });

  it('accepts a single key string (not array)', () => {
    const ary = [{ n: 3 }, { n: 1 }, { n: 2 }];

    expect(sortBy(ary, 'n')).toStrictEqual([{ n: 1 }, { n: 2 }, { n: 3 }]);
  });
});

describe('sortableNumericSuffix', () => {
  it.each([
    {
      desc:     'string with trailing number',
      input:    'foo1',
      expected: 'foo0000000001',
    },
    {
      desc:     'string with multiple numeric segments',
      input:    'foo1-bar2',
      expected: 'foo0000000001-bar0000000002',
    },
    {
      desc:     'string with no numbers',
      input:    'abc',
      expected: 'abc',
    },
    {
      desc:     'string starting with number',
      input:    '1foo',
      expected: '0000000001foo',
    },
    {
      desc:     'leading/trailing whitespace is trimmed',
      input:    '  abc  ',
      expected: 'abc',
    },
  ])('transforms $desc', ({ input, expected }) => {
    expect(sortableNumericSuffix(input)).toStrictEqual(expected);
  });

  it('returns non-string input as-is', () => {
    expect(sortableNumericSuffix(42)).toStrictEqual(42);
    expect(sortableNumericSuffix(null)).toStrictEqual(null);
  });
});

describe('isNumeric', () => {
  it.each([
    {
      desc:     'integer string',
      input:    '123',
      expected: true,
    },
    {
      desc:     'integer number',
      input:    42,
      expected: true,
    },
    {
      desc:     'string with letters',
      input:    'abc',
      expected: false,
    },
    {
      desc:     'alphanumeric string',
      input:    '123abc',
      expected: false,
    },
    {
      desc:     'empty string',
      input:    '',
      expected: false,
    },
    {
      desc:     'decimal number string',
      input:    '1.5',
      expected: false,
    },
  ])('returns $expected for $desc', ({ input, expected }) => {
    expect(isNumeric(input)).toStrictEqual(expected);
  });
});
