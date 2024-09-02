import { sortBy } from '@shell/utils/sort';

describe('fx: sort', () => {
  describe('sortBy', () => {
    const testSortBy = <T = object[]>(ary: T[], key: string[], expected: T[], desc?: boolean) => {
      const result = sortBy(ary, key, desc);

      expect(result).toStrictEqual(expected);
    };

    it.each([
      [[{ a: 1 }, { a: 9 }], ['a'], [{ a: 1 }, { a: 9 }]],
      [[{ a: 2 }, { a: 1 }], ['a'], [{ a: 1 }, { a: 2 }]],
    ])('should sort by single property', (ary, key, expected) => {
      testSortBy(ary, key, expected);
    });

    it.each([
      [[{ a: 1, b: 1 }, { a: 9, b: 9 }], ['a', 'b'], [{ a: 1, b: 1 }, { a: 9, b: 9 }]],
      [[{ a: 2, b: 2 }, { a: 1, b: 1 }], ['a', 'b'], [{ a: 1, b: 1 }, { a: 2, b: 2 }]],
      [[{ a: 2, b: 1 }, { a: 1, b: 9 }], ['a', 'b'], [{ a: 1, b: 9 }, { a: 2, b: 1 }]],
      [[{ a: 1, b: 2 }, { a: 9, b: 1 }], ['a', 'b'], [{ a: 1, b: 2 }, { a: 9, b: 1 }]],
      [[{ a: 1, b: 1 }, { a: 9, b: 9 }], ['a', 'b'], [{ a: 1, b: 1 }, { a: 9, b: 9 }]],
    ])('should sort by two properties (primary property always first)', (ary, key, expected) => {
      testSortBy(ary, key, expected);
    });

    it.each([
      [[{ a: 1, b: 1 }, { a: 1, b: 9 }], ['a', 'b'], [{ a: 1, b: 1 }, { a: 1, b: 9 }]],
      [[{ a: 1, b: 2 }, { a: 1, b: 1 }], ['a', 'b'], [{ a: 1, b: 1 }, { a: 1, b: 2 }]],
    ])('should sort by two properties (primary property the same)', (ary, key, expected) => {
      testSortBy(ary, key, expected);
    });

    describe('descending', () => {
      it.each([
        [[{ a: 1 }, { a: 9 }], ['a'], [{ a: 9 }, { a: 1 }]],
        [[{ a: 2 }, { a: 1 }], ['a'], [{ a: 2 }, { a: 1 }]],
      ])('should sort by single property', (ary, key, expected) => {
        testSortBy(ary, key, expected, true);
      });

      it.each([
        [[{ a: 1, b: 1 }, { a: 9, b: 9 }], ['a', 'b'], [{ a: 9, b: 9 }, { a: 1, b: 1 }]],
        [[{ a: 2, b: 2 }, { a: 1, b: 1 }], ['a', 'b'], [{ a: 2, b: 2 }, { a: 1, b: 1 }]],
        [[{ a: 2, b: 1 }, { a: 1, b: 9 }], ['a', 'b'], [{ a: 2, b: 1 }, { a: 1, b: 9 }]],
        [[{ a: 1, b: 2 }, { a: 9, b: 1 }], ['a', 'b'], [{ a: 9, b: 1 }, { a: 1, b: 2 }]],
        [[{ a: 1, b: 1 }, { a: 9, b: 9 }], ['a', 'b'], [{ a: 9, b: 9 }, { a: 1, b: 1 }]],
      ])('should sort by two properties', (ary, key, expected) => {
        testSortBy(ary, key, expected, true);
      });

      it.each([
        [[{ a: 1, b: 1 }, { a: 1, b: 9 }], ['a', 'b'], [{ a: 1, b: 9 }, { a: 1, b: 1 }]],
        [[{ a: 1, b: 2 }, { a: 1, b: 1 }], ['a', 'b'], [{ a: 1, b: 2 }, { a: 1, b: 1 }]],
      ])('should sort by two properties (primary property the same)', (ary, key, expected) => {
        testSortBy(ary, key, expected, true);
      });
    });
  });
});
