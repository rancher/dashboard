import {
  typeOf,
  spaceship,
  compare,
  parseField,
  sortableNumericSuffix,
  isNumeric,
} from '@shell/utils/sort';

describe('sort utils', () => {
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
        desc:     'boolean true',
        input:    true,
        expected: 'boolean',
      },
      {
        desc:     'boolean false',
        input:    false,
        expected: 'boolean',
      },
      {
        desc:     'number 0',
        input:    0,
        expected: 'number',
      },
      {
        desc:     'number 42',
        input:    42,
        expected: 'number',
      },
      {
        desc:     'string',
        input:    'hello',
        expected: 'string',
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
        desc:     'function',
        input:    () => {},
        expected: 'function',
      },
      {
        desc:     'regexp',
        input:    /abc/,
        expected: 'regexp',
      },
      {
        desc:     'error instance',
        input:    new Error('test'),
        expected: 'error',
      },
      {
        desc:     'date instance',
        input:    new Date('2024-01-01'),
        expected: 'date',
      },
    ])('returns "$expected" for $desc', ({ input, expected }) => {
      expect(typeOf(input)).toStrictEqual(expected);
    });
  });

  describe('spaceship', () => {
    it.each([
      {
        desc:     'a greater than b',
        a:        5,
        b:        3,
        expected: 1,
      },
      {
        desc:     'a less than b',
        a:        2,
        b:        7,
        expected: -1,
      },
      {
        desc:     'a equals b',
        a:        4,
        b:        4,
        expected: 0,
      },
    ])('returns $expected when $desc', ({ a, b, expected }) => {
      expect(spaceship(a, b)).toStrictEqual(expected);
    });
  });

  describe('compare', () => {
    describe('same-type comparisons', () => {
      it.each([
        {
          desc:     'numbers ascending',
          a:        1,
          b:        2,
          expected: -1,
        },
        {
          desc:     'numbers descending',
          a:        9,
          b:        3,
          expected: 1,
        },
        {
          desc:     'numbers equal',
          a:        5,
          b:        5,
          expected: 0,
        },
        {
          desc:     'booleans false before true',
          a:        false,
          b:        true,
          expected: -1,
        },
        {
          desc:     'booleans equal',
          a:        true,
          b:        true,
          expected: 0,
        },
        {
          desc:     'strings alphabetical',
          a:        'apple',
          b:        'banana',
          expected: -1,
        },
        {
          desc:     'strings equal',
          a:        'foo',
          b:        'foo',
          expected: 0,
        },
      ])('$desc', ({ a, b, expected }) => {
        expect(compare(a, b)).toStrictEqual(expected);
      });
    });

    describe('cross-type ordering', () => {
      it('sorts null before boolean', () => {
        expect(compare(null, true)).toStrictEqual(-1);
      });

      it('sorts undefined before null', () => {
        expect(compare(undefined, null)).toStrictEqual(-1);
      });

      it('sorts number before string', () => {
        expect(compare(1, 'a')).toStrictEqual(-1);
      });

      it('sorts string before array', () => {
        expect(compare('z', [1])).toStrictEqual(-1);
      });
    });

    describe('array comparison', () => {
      it('compares arrays element by element', () => {
        expect(compare([1, 2], [1, 3])).toStrictEqual(-1);
      });

      it('returns 0 for equal arrays', () => {
        expect(compare([1, 2], [1, 2])).toStrictEqual(0);
      });

      it('shorter array sorts before longer equal-prefix array', () => {
        expect(compare([1], [1, 2])).toStrictEqual(-1);
      });

      it('longer array sorts after shorter equal-prefix array', () => {
        expect(compare([1, 2], [1])).toStrictEqual(1);
      });
    });

    describe('date comparison', () => {
      it('earlier date sorts before later date', () => {
        const earlier = new Date('2020-01-01');
        const later = new Date('2023-01-01');

        expect(compare(earlier, later)).toStrictEqual(-1);
      });

      it('same dates compare as equal', () => {
        const d1 = new Date('2022-06-15');
        const d2 = new Date('2022-06-15');

        expect(compare(d1, d2)).toStrictEqual(0);
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
        desc:     'field with desc suffix',
        input:    'name:desc',
        expected: { field: 'name', reverse: true },
      },
      {
        desc:     'nested field path',
        input:    'metadata.name',
        expected: { field: 'metadata.name', reverse: false },
      },
      {
        desc:     'nested field with desc suffix',
        input:    'metadata.name:desc',
        expected: { field: 'metadata.name', reverse: true },
      },
    ])('$desc', ({ input, expected }) => {
      expect(parseField(input)).toStrictEqual(expected);
    });
  });

  describe('sortableNumericSuffix', () => {
    it.each([
      {
        desc:     'string with numeric suffix',
        input:    'foo1',
        expected: 'foo0000000001',
      },
      {
        desc:     'string with multi-digit numeric part',
        input:    'pod42',
        expected: 'pod0000000042',
      },
      {
        desc:     'string with mixed numbers',
        input:    'foo1-bar2',
        expected: 'foo0000000001-bar0000000002',
      },
      {
        desc:     'string with no numbers',
        input:    'foobar',
        expected: 'foobar',
      },
      {
        desc:     'non-string passthrough (number)',
        input:    42 as any,
        expected: 42,
      },
    ])('$desc', ({ input, expected }) => {
      expect(sortableNumericSuffix(input)).toStrictEqual(expected);
    });
  });

  describe('isNumeric', () => {
    it.each([
      {
        desc:     'numeric string',
        input:    '123',
        expected: true,
      },
      {
        desc:     'zero string',
        input:    '0',
        expected: true,
      },
      {
        desc:     'non-numeric string',
        input:    'abc',
        expected: false,
      },
      {
        desc:     'mixed alphanumeric string',
        input:    'foo1',
        expected: false,
      },
      {
        desc:     'numeric number',
        input:    42,
        expected: true,
      },
    ])('$desc', ({ input, expected }) => {
      expect(isNumeric(input)).toStrictEqual(expected);
    });
  });
});
