import { integerString, keyValueStrings } from '@shell/utils/computed';

describe('integerString', () => {
  describe('get', () => {
    it.each([
      {
        desc:     'integer string',
        initial:  '42',
        expected: 42,
      },
      {
        desc:     'float string',
        initial:  '3.14',
        expected: 3.14,
      },
      {
        desc:     'zero string',
        initial:  '0',
        expected: 0,
      },
      {
        desc:     'negative integer string',
        initial:  '-7',
        expected: -7,
      },
      {
        desc:     'undefined value',
        initial:  undefined as unknown as string,
        expected: NaN,
      },
    ])('returns a number for $desc', ({ initial, expected }) => {
      const computed = integerString('value');
      const ctx = { value: initial };

      expect(computed.get.call(ctx)).toStrictEqual(expected);
    });

    it('reads from a nested dot-notation path', () => {
      const computed = integerString('a.b');
      const ctx = { a: { b: '99' } };

      expect(computed.get.call(ctx)).toStrictEqual(99);
    });
  });

  describe('set', () => {
    it.each([
      {
        desc:     'positive integer',
        input:    42,
        expected: '42',
      },
      {
        desc:     'float',
        input:    3.14,
        expected: '3.14',
      },
      {
        desc:     'zero',
        input:    0,
        expected: '0',
      },
      {
        desc:     'negative integer',
        input:    -7,
        expected: '-7',
      },
    ])('stores a string representation for $desc', ({ input, expected }) => {
      const computed = integerString('value');
      const ctx = { value: '' };

      computed.set.call(ctx, input);

      expect(ctx.value).toStrictEqual(expected);
    });

    it('writes to a nested dot-notation path', () => {
      const computed = integerString('a.b');
      const ctx = { a: { b: '' } };

      computed.set.call(ctx, 5);

      expect((ctx.a as { b: string }).b).toStrictEqual('5');
    });
  });
});

describe('keyValueStrings', () => {
  describe('get', () => {
    it('returns an empty object for an empty array', () => {
      const computed = keyValueStrings('items');
      const ctx = { items: [] as string[] };

      expect(computed.get.call(ctx)).toStrictEqual({});
    });

    it('returns an empty object when path value is undefined', () => {
      const computed = keyValueStrings('items');
      const ctx = { items: undefined as unknown as string[] };

      expect(computed.get.call(ctx)).toStrictEqual({});
    });

    it.each([
      {
        desc:      'single entry with default delimiter',
        entries:   ['key=value'],
        delimiter: '=',
        expected:  { key: 'value' },
      },
      {
        desc:      'multiple entries with default delimiter',
        entries:   ['foo=bar', 'baz=qux'],
        delimiter: '=',
        expected:  {
          foo: 'bar',
          baz: 'qux',
        },
      },
      {
        desc:      'single entry with custom colon delimiter',
        entries:   ['key:value'],
        delimiter: ':',
        expected:  { key: 'value' },
      },
      {
        desc:      'multiple entries with custom colon delimiter',
        entries:   ['a:1', 'b:2'],
        delimiter: ':',
        expected:  {
          a: '1',
          b: '2',
        },
      },
    ])('returns an object for $desc', ({ entries, delimiter, expected }) => {
      const computed = keyValueStrings('items', delimiter);
      const ctx = { items: entries };

      expect(computed.get.call(ctx)).toStrictEqual(expected);
    });
  });

  describe('set', () => {
    it('stores an empty array for an empty object', () => {
      const computed = keyValueStrings('items');
      const ctx = { items: ['existing=val'] };

      computed.set.call(ctx, {});

      expect(ctx.items).toStrictEqual([]);
    });

    it.each([
      {
        desc:      'single key-value pair with default delimiter',
        input:     { key: 'value' },
        delimiter: '=',
        expected:  ['key=value'],
      },
      {
        desc:  'multiple key-value pairs with default delimiter',
        input: {
          foo: 'bar',
          baz: 'qux',
        },
        delimiter: '=',
        expected:  ['foo=bar', 'baz=qux'],
      },
      {
        desc:      'single pair with custom colon delimiter',
        input:     { key: 'value' },
        delimiter: ':',
        expected:  ['key:value'],
      },
      {
        desc:  'multiple pairs with custom colon delimiter',
        input: {
          a: '1',
          b: '2',
        },
        delimiter: ':',
        expected:  ['a:1', 'b:2'],
      },
    ])('stores delimited strings for $desc', ({ input, delimiter, expected }) => {
      const computed = keyValueStrings('items', delimiter);
      const ctx = { items: [] as string[] };

      computed.set.call(ctx, input);

      expect(ctx.items).toStrictEqual(expected);
    });
  });
});
