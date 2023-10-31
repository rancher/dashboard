import {
  clone, get, getter, isEmpty, toDictionary, remove, diff, definedKeys
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
