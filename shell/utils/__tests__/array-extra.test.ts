import {
  concatStrings,
  findStringIndex,
  hasDuplicatedStrings,
  sameArrayObjects,
} from '@shell/utils/array';

describe('findStringIndex', () => {
  it.each([
    {
      desc:     'returns index of exact match',
      items:    ['foo', 'bar', 'baz'],
      item:     'bar',
      expected: 1,
    },
    {
      desc:     'returns -1 when item not found',
      items:    ['foo', 'bar'],
      item:     'qux',
      expected: -1,
    },
    {
      desc:     'trims whitespace from item by default',
      items:    ['foo', 'bar', 'baz'],
      item:     '  bar  ',
      expected: 1,
    },
    {
      desc:     'returns index of first match when duplicates exist',
      items:    ['foo', 'bar', 'bar'],
      item:     'bar',
      expected: 1,
    },
    {
      desc:     'returns -1 for empty array',
      items:    [] as string[],
      item:     'foo',
      expected: -1,
    },
  ])('$desc', ({ items, item, expected }) => {
    expect(findStringIndex(items, item)).toStrictEqual(expected);
  });

  it('does not trim when trim=false', () => {
    expect(findStringIndex(['foo', '  bar  '], '  bar  ', false)).toStrictEqual(1);
  });

  it('returns -1 when trim=false and item has extra spaces not in list', () => {
    expect(findStringIndex(['foo', 'bar'], '  bar  ', false)).toStrictEqual(-1);
  });
});

describe('hasDuplicatedStrings', () => {
  it.each([
    {
      desc:     'returns false for unique strings',
      items:    ['foo', 'bar', 'baz'],
      expected: false,
    },
    {
      desc:     'returns true for duplicate strings',
      items:    ['foo', 'bar', 'foo'],
      expected: true,
    },
    {
      desc:     'returns false for empty array',
      items:    [] as string[],
      expected: false,
    },
    {
      desc:     'returns false for single item',
      items:    ['foo'],
      expected: false,
    },
    {
      desc:     'returns true for two identical items',
      items:    ['foo', 'foo'],
      expected: true,
    },
  ])('$desc', ({ items, expected }) => {
    expect(hasDuplicatedStrings(items)).toStrictEqual(expected);
  });

  it('is case-sensitive by default (returns false for same string different case)', () => {
    expect(hasDuplicatedStrings(['Foo', 'foo'])).toStrictEqual(false);
  });

  it('returns true for case-insensitive duplicates when caseSensitive=false', () => {
    expect(hasDuplicatedStrings(['Foo', 'foo'], false)).toStrictEqual(true);
  });

  it('trims whitespace when comparing items', () => {
    // 'foo' and ' foo' — after trim both become 'foo', so duplicate detected
    expect(hasDuplicatedStrings(['foo', ' foo'])).toStrictEqual(true);
  });
});

describe('sameArrayObjects', () => {
  describe('returns false', () => {
    it.each([
      {
        desc: 'when both arrays are null/undefined',
        aryA: null as unknown as object[],
        aryB: null as unknown as object[],
      },
      {
        desc: 'when one array is null and other has items',
        aryA: null as unknown as object[],
        aryB: [{ a: 1 }],
      },
      {
        desc: 'when arrays have different lengths',
        aryA: [{ a: 1 }, { b: 2 }],
        aryB: [{ a: 1 }],
      },
      {
        desc: 'when objects differ in order-sensitive mode',
        aryA: [{ a: 1 }, { b: 2 }],
        aryB: [{ b: 2 }, { a: 1 }],
      },
      {
        desc: 'when items are not equal',
        aryA: [{ a: 1 }],
        aryB: [{ a: 2 }],
      },
    ])('$desc', ({ aryA, aryB }) => {
      expect(sameArrayObjects(aryA, aryB)).toStrictEqual(false);
    });
  });

  describe('returns true', () => {
    it('when both arrays are empty', () => {
      expect(sameArrayObjects([], [])).toStrictEqual(true);
    });

    it('when arrays have same objects in same order', () => {
      expect(sameArrayObjects([{ a: 1 }, { b: 2 }], [{ a: 1 }, { b: 2 }])).toStrictEqual(true);
    });

    it('when arrays have same objects in different order with positionAgnostic=true', () => {
      expect(sameArrayObjects([{ a: 1 }, { b: 2 }], [{ b: 2 }, { a: 1 }], true)).toStrictEqual(true);
    });

    it('when single-item arrays contain equal objects', () => {
      expect(sameArrayObjects([{ x: 42 }], [{ x: 42 }])).toStrictEqual(true);
    });
  });

  describe('positionAgnostic mode', () => {
    it('handles duplicate objects correctly, matching each exactly once', () => {
      const a = [{ v: 1 }, { v: 1 }, { v: 2 }];
      const b = [{ v: 2 }, { v: 1 }, { v: 1 }];

      expect(sameArrayObjects(a, b, true)).toStrictEqual(true);
    });

    it('returns false when arrays differ despite same length with positionAgnostic=true', () => {
      expect(sameArrayObjects([{ a: 1 }, { b: 2 }], [{ a: 1 }, { b: 3 }], true)).toStrictEqual(false);
    });
  });
});

describe('concatStrings', () => {
  it.each([
    {
      desc:     'concatenates all combinations of a and b (last a first in result)',
      a:        ['x', 'y'],
      b:        ['1', '2'],
      expected: ['y1', 'y2', 'x1', 'x2'],
    },
    {
      desc:     'returns empty array when a is empty',
      a:        [] as string[],
      b:        ['1', '2'],
      expected: [] as string[],
    },
    {
      desc:     'returns empty array when b is empty',
      a:        ['x', 'y'],
      b:        [] as string[],
      expected: [] as string[],
    },
    {
      desc:     'works with single-element arrays',
      a:        ['hello'],
      b:        [' world'],
      expected: ['hello world'],
    },
  ])('$desc', ({ a, b, expected }) => {
    expect(concatStrings(a, b)).toStrictEqual(expected);
  });
});
