import { reactive, isReactive } from 'vue';
import {
  clone, get, getter, isEmpty, toDictionary, remove, diff, definedKeys, deepToRaw, mergeWithReplace
} from '@shell/utils/object';

describe('fx: get', () => {
  describe('should return value of an object', () => {
    it('given a path', () => {
      const obj = { key1: 'value', key2: { bat: 42, 'with.dots': 43 } };

      const result = get(obj, 'key1');

      expect(result).toStrictEqual(obj.key1);
    });

    it('given a nested path', () => {
      const obj = { key1: 'value', key2: { bat: 42, 'with.dots': 43 } };

      const result = get(obj, 'key2.bat');

      expect(result).toStrictEqual(obj.key2.bat);
    });

    it('given a complex path', () => {
      const obj = { key1: 'value', key2: { bat: 42, 'with.dots': 43 } };

      const result = get(obj, "key2.'with.dots'");

      expect(result).toStrictEqual(obj.key2['with.dots']);
    });
  });

  it.each([
    'key2.nonsense',
    'non.sense',
  ])('should catch error and return undefined', (path) => {
    const obj = { key1: 'value', key2: { bat: 42, 'with.dots': 43 } };

    const result = get(obj, path);

    expect(result).toBeUndefined();
    expect(() => result).not.toThrow();
  });
});

describe('fx: getter', () => {
  it('should return a function', () => {
    const callBack = getter('key1');

    expect(typeof callBack).toBe('function');
  });

  describe('should return value of an object', () => {
    it('given a path', () => {
      const obj = { key1: 'value', key2: { bat: 42, 'with.dots': 43 } };

      const result = getter('key1')(obj);

      expect(result).toStrictEqual(obj.key1);
    });

    it('given a nested path', () => {
      const obj = { key1: 'value', key2: { bat: 42, 'with.dots': 43 } };

      const result = getter('key2.bat')(obj);

      expect(result).toStrictEqual(obj.key2.bat);
    });

    it('given a complex path', () => {
      const obj = { key1: 'value', key2: { bat: 42, 'with.dots': 43 } };

      const result = getter("key2.'with.dots'")(obj);

      expect(result).toStrictEqual(obj.key2['with.dots']);
    });

    it.each([
      'key2.nonsense',
      'non.sense',
    ])('should catch error and return undefined', (path) => {
      const obj = { key1: 'value', key2: { bat: 42, 'with.dots': 43 } };

      const result = getter(path)(obj);

      expect(result).toBeUndefined();
      expect(() => result).not.toThrow();
    });
  });
});

describe('fx: clone', () => {
  it('should return a shallow copy of the object', () => {
    const obj = { key1: 'value', key2: { bat: 42, 'with.dots': 43 } };

    const result = clone(obj);

    expect(result).not.toBe(obj);
    expect(result).toStrictEqual(obj);
  });
});

describe('fx: isEmpty', () => {
  it.each([
    [{}, true],
    [{ key1: 'value' }, false],
    [[], true],
    [['key1'], false],
    ['', true],
    // ['key1', true],
    [0, true],
    [42, true],
    [null, true],
    [undefined, true],
  ])('should evaluate %p as %p', (value, expected) => {
    const result = isEmpty(value);

    expect(result).toStrictEqual(expected);
  });

  it.each([
    [{ value: 'value' }, true],
    [{ enumerable: true }, false],
  ])('should verify if %s is enumerable (%o)', (value, expected) => {
    const enumerable = Object.defineProperty({}, 'key1', value);

    const result = isEmpty(enumerable);

    expect(result).toBe(expected);
  });
});

describe('fx: toDictionary', () => {
  it('should return a dictionary from an array', () => {
    const array = ['a', 'b', 'c'];
    const asd = (value: string) => value.toUpperCase();
    const expectation = {
      a: 'A', b: 'B', c: 'C'
    };

    const result = toDictionary(array, asd);

    expect(result).toStrictEqual(expectation);
  });
});

describe('fx: remove', () => {
  it.each([
    [{}, '', {}],
    [{}, 'not_there', {}],
    [{}, 'not.there.again', {}],
    [{ level1: true }, 'level1', {}],
    [{ level1: true }, 'not_there', { level1: true }],
    [{ level1: { level2: true } }, 'level1.level2', { level1: { } }],
    [{ level1: { level2: true, other: true } }, 'level1.level2', { level1: { other: true } }],
    [{ level1: { level2: true }, other: true }, 'level1.level2', { level1: { }, other: true }],
    [{ level1: { level2: true }, other: true }, 'not_there.level1.level2', { level1: { level2: true }, other: true }],
    [{ level1: { level2: true }, other: true }, 'level1', { other: true }],
  ])('should evaluate %p as %p', (obj, path, expected) => {
    const result = remove(obj, path);

    expect(result).toStrictEqual(expected);
  });
});

describe('fx: diff', () => {
  it('should return an object including only the differences between two objects', () => {
    const from = {
      foo: 'bar',
      baz: 'bang',
    };
    const to = {
      foo:  'bar',
      bang: 'baz'
    };

    const result = diff(from, to);
    const expected = {
      baz:  null,
      bang: 'baz'
    };

    expect(result).toStrictEqual(expected);
  });
  it('should return an object and dot characters in object should still be respected', () => {
    const from = {};
    const to = { foo: { 'bar.baz': 'bang' } };

    const result = diff(from, to);
    const expected = { foo: { 'bar.baz': 'bang' } };

    expect(result).toStrictEqual(expected);
  });
});

describe('fx: definedKeys', () => {
  it('should return an array of keys within an array', () => {
    const obj = {
      foo: 'bar',
      baz: 'bang',
    };

    const result = definedKeys(obj);
    const expected = ['"foo"', '"baz"'];

    expect(result).toStrictEqual(expected);
  });
  it('should return an array of keys with primitive values and their full nested path', () => {
    const obj = {
      foo: 'bar',
      baz: { bang: 'bop' },
    };

    const result = definedKeys(obj);
    const expected = ['"foo"', '"baz"."bang"'];

    expect(result).toStrictEqual(expected);
  });
  it('should return an array of keys with primitive values and their full nested path with quotation marks to escape keys with dots in them', () => {
    const obj = {
      foo: 'bar',
      baz: { 'bang.bop': 'beep' },
    };

    const result = definedKeys(obj);
    const expected = ['"foo"', '"baz"."bang.bop"'];

    expect(result).toStrictEqual(expected);
  });
});

describe('fx: deepToRaw', () => {
  it('should return primitives as is', () => {
    expect(deepToRaw(null)).toBeNull();
    expect(deepToRaw(undefined)).toBeUndefined();
    expect(deepToRaw(42)).toBe(42);
    expect(deepToRaw('test')).toBe('test');
    expect(deepToRaw(true)).toBe(true);

    const sym = Symbol('symbol');

    expect(deepToRaw(sym)).toBe(sym);
  });

  it('should handle simple objects', () => {
    const obj = { a: 1, b: 2 };
    const result = deepToRaw(obj);

    expect(result).toStrictEqual({ a: 1, b: 2 });
    expect(result).not.toBe(obj); // Should not be the same reference
  });

  it('should handle arrays', () => {
    const arr = [1, 2, 3];
    const result = deepToRaw(arr);

    expect(result).toStrictEqual([1, 2, 3]);
    expect(result).not.toBe(arr); // Should not be the same reference
  });

  it('should handle nested objects', () => {
    const obj = { a: { b: { c: 3 } } };
    const result = deepToRaw(obj);

    expect(result).toStrictEqual({ a: { b: { c: 3 } } });
    expect(result).not.toBe(obj);
    expect(result.a).not.toBe(obj.a);
    expect(result.a.b).not.toBe(obj.a.b);
  });

  it('should handle nested arrays', () => {
    const arr = [1, [2, [3]]];
    const result = deepToRaw(arr);

    expect(result).toStrictEqual([1, [2, [3]]]);
    expect(result).not.toBe(arr);
    expect(result[1]).not.toBe(arr[1]);
  });

  it('should handle reactive proxies (reactive object)', () => {
    const reactiveObj = reactive({ a: 1, b: { c: 2 } });
    const result = deepToRaw(reactiveObj);

    expect(result).toStrictEqual({ a: 1, b: { c: 2 } });
    expect(result).not.toBe(reactiveObj);
    expect(isReactive(result)).toBe(false);
  });

  it('should handle nested reactive properties', () => {
    const data = reactive({
      num:   1,
      str:   'test',
      bool:  true,
      nil:   null,
      undef: undefined,
      arr:   [1, 2, { a: 3 }],
      obj:   { nested: reactive({ a: 1 }) },
      func:  null,
      sym:   null,
    });

    const result = deepToRaw(data);

    expect(result).toStrictEqual({
      num:   1,
      str:   'test',
      bool:  true,
      nil:   null,
      undef: undefined,
      arr:   [1, 2, { a: 3 }],
      obj:   { nested: { a: 1 } },
      func:  null,
      sym:   null,
    });

    expect(isReactive(result)).toBe(false);
    expect(isReactive(result.obj)).toBe(false);
    expect(isReactive(result.obj.nested)).toBe(false);
  });

  it('should handle circular references', () => {
    const obj: { name: string; [key: string]: any } = { name: 'Alice' };

    obj.self = obj; // Circular reference

    const result = deepToRaw(obj);

    expect(result).toStrictEqual({ name: 'Alice', self: result });
  });

  it('should handle objects with functions and symbols', () => {
    const symbolKey = Symbol('key');
    const obj = {
      a:           1,
      b() {},
      [symbolKey]: 'symbolValue',
    };

    const result = deepToRaw(obj);

    expect(result).toStrictEqual({ a: 1, b: null });
    expect(result[symbolKey]).toBeUndefined(); // Symbols are skipped
  });

  it('should not mutate the original data', () => {
    const obj = { a: { b: 2 } };
    const original = JSON.stringify(obj);

    deepToRaw(obj);
    expect(JSON.stringify(obj)).toBe(original);
  });

  it('should handle complex data structures', () => {
    const data = reactive({
      num:   1,
      str:   'test',
      bool:  true,
      nil:   null,
      undef: undefined,
      arr:   [1, 2, { a: 3 }],
      obj:   { nested: { a: 1 } },
      func:  () => {},
      sym:   Symbol('sym'),
    });

    const result = deepToRaw(data);

    expect(result).toStrictEqual({
      num:   1,
      str:   'test',
      bool:  true,
      nil:   null,
      undef: undefined,
      arr:   [1, 2, { a: 3 }],
      obj:   { nested: { a: 1 } },
      func:  null,
      sym:   null,
    });
  });
});

describe('fx: mergeWithReplace', () => {
  const testCases: Array<[object?, object?, object?]> = [
    // Some array test cases, an array from the first object should be replaced with the array from the second object
    [{ a: ['one'] }, { a: [] }, { a: [] }],
    [{ a: ['one', 'two'] }, { a: ['one', 'two', 'three'] }, { a: ['one', 'two', 'three'] }],
    [{ a: ['one', 'two'], b: ['three', 'four'] }, { a: ['one'], b: [] }, { a: ['one'], b: [] }],
    [{
      a: ['one', 'two'], b: ['three', 'four'], c: 'five'
    }, { a: ['one'], b: [] }, {
      a: ['one'], b: [], c: 'five'
    }],
    // Some other test cases
    [{ a: 'one' }, { b: 'two' }, { a: 'one', b: 'two' }],
    [{ a: 'one' }, { a: '', b: 'two' }, { a: '', b: 'two' }],
    [{ a: 'one', b: 'two' }, { a: 1, c: { d: null } }, {
      a: 1, b: 'two', c: { d: null }
    }],
    [undefined, undefined, {}],
    [{}, undefined, {}],
    [undefined, {}, {}],
  ];

  it.each(testCases)('should merge arrays properly', (obj1, obj2, expected) => {
    const result = mergeWithReplace(obj1, obj2);

    expect(result).toStrictEqual(expected);
  });

  it.each([
    [
      { a: { b: false, c: false } }, { a: { b: true, c: null } }, { a: { b: true, c: null } }
    ],
    [
      {
        a: [{
          b: 'test', c: 'test', value: true
        }]
      }, {
        a: [{
          b: 'test', c: 'test', operator: 'exists'
        }]
      }, {
        a: [{
          b: 'test', c: 'test', operator: 'exists'
        }]
      }
    ],
    [
      {
        a: { enabled: false }, b: { enabled: false }, c: { enabled: false }
      },
      { c: { enabled: true, stripUnderscores: true } },
      {
        a: { enabled: false }, b: { enabled: false }, c: { enabled: true, stripUnderscores: true }
      }
    ]
  ])('should overwrite duplicate object properties when merging objects', (left, right, expected) => {
    const result = mergeWithReplace(left, right, { replaceObjectProps: true });

    expect(result).toStrictEqual(expected);
  });
});
