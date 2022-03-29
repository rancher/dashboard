import { clone, get, getter, isEmpty } from '@/utils/object';

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
