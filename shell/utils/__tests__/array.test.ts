import {
  addObject, addObjects, clear, filterBy, findBy, getUniqueLabelKeys, insertAt, isArray, joinStringList, removeAt, removeObject, removeObjects, replaceWith, sameContents, uniq
} from '@shell/utils/array';

interface Obj {
  key?: string;
  booleanKey?: boolean;
  baz?: string;
  cat?: string;
}

describe('fx: addObject', () => {
  it('should add items', () => {
    const obj1 = { key: 'value' };
    const myArray: Obj[] = [];

    addObject(myArray, obj1);

    expect(myArray).toStrictEqual([obj1]);
  });

  it('should add another item to an initial array', () => {
    const obj1 = { key: 'value' };
    const obj2 = { key: 'another value', booleanKey: false };
    const myArray: Obj[] = [obj1];

    addObject(myArray, obj2);

    expect(myArray).toStrictEqual([obj1, obj2]);
  });

  it('should add more items without duplicate them', () => {
    const obj1 = { key: 'value' };
    const obj2 = { key: 'second value', booleanKey: false };
    const myArray: Obj[] = [obj1];

    addObject(myArray, obj2);

    expect(myArray).toStrictEqual([obj1, obj2]);
  });
});

describe('fx: addObjects', () => {
  it('should accept empty arrays and do nothing', () => {
    const myArray: Obj[] = [];

    addObjects(myArray, []);

    expect(myArray).toStrictEqual([]);
  });

  it('should add more items to an initial array', () => {
    const obj1 = { key: 'value' };
    const obj2 = { key: 'baz', booleanKey: false };
    const obj3 = { key: 'bat', baz: 'bat' };
    const myArray: Obj[] = [obj1];

    addObjects(myArray, [obj2, obj3]);

    expect(myArray).toStrictEqual([obj1, obj2, obj3]);
  });

  it('should add new items and avoiding duplicates', () => {
    const obj1 = { key: 'value' };
    const obj2 = { key: 'baz', booleanKey: false };
    const obj3 = { key: 'bat', baz: 'bat' };
    const obj4 = { key: 'qux', booleanKey: true };
    const myArray: Obj[] = [obj1, obj2, obj3];

    addObjects(myArray, [obj1, obj4]);

    expect(myArray).toStrictEqual([obj1, obj2, obj3, obj4]);
  });

  it('should add new item once, if entered multiple times', () => {
    const obj1 = { key: 'value' };
    const obj2 = { key: 'baz', booleanKey: false };
    const obj3 = { key: 'bat', baz: 'bat' };
    const obj4 = { key: 'qux', booleanKey: true };
    const obj5 = { cat: 'hat' };
    const myArray: Obj[] = [obj1, obj2, obj3, obj4];

    addObjects(myArray, [obj5, obj5, obj5, obj5]);

    expect(myArray).toStrictEqual([obj1, obj2, obj3, obj4, obj5]);
  });
});

describe('fx: removeObject', () => {
  it('should remove an existing item', () => {
    const obj1 = { key: 'value' };
    const obj2 = { key: 'baz', booleanKey: false };
    const obj3 = { key: 'bat', baz: 'bat' };
    const myArray: Obj[] = [obj1, obj2, obj3];

    removeObject(myArray, obj2);

    expect(myArray).toStrictEqual([obj1, obj3]);
  });

  it('should not remove unmatched items', () => {
    const obj1 = { key: 'value' };
    const obj3 = { key: 'bat', baz: 'bat' };
    const obj4 = { key: 'qux', booleanKey: true };
    const myArray: Obj[] = [obj1, obj3];

    removeObject(myArray, obj4);

    expect(myArray).toStrictEqual([obj1, obj3]);
  });

  it('should return an empty array if no item', () => {
    const obj1 = { key: 'value' };
    const obj3 = { key: 'bat', baz: 'bat' };
    const myArray: Obj[] = [obj1, obj3];

    removeObject(myArray, obj1);
    removeObject(myArray, obj3);

    expect(myArray).toStrictEqual([]);
  });
});

describe('fx: removeObjects', () => {
  it('should remove items', () => {
    const obj1 = { key: 'value' };
    const obj2 = { key: 'baz', booleanKey: false };
    const obj3 = { key: 'bat', baz: 'bat' };
    const myArray: Obj[] = [obj1, obj2, obj3];

    removeObjects(myArray, [obj1]);

    expect(myArray).toStrictEqual([obj2, obj3]);
  });

  it('should not remove unmatched items', () => {
    const obj1 = { key: 'value' };
    const obj3 = { key: 'bat', baz: 'bat' };
    const obj4 = { key: 'qux', booleanKey: true };
    const myArray: Obj[] = [obj1, obj3];

    removeObjects(myArray, [obj4]);

    expect(myArray).toStrictEqual([obj1, obj3]);
  });

  it('should return an empty array if no item', () => {
    const obj1 = { key: 'value' };
    const obj3 = { key: 'bat', baz: 'bat' };
    const myArray: Obj[] = [obj1, obj3];

    removeObjects(myArray, [obj1, obj3]);

    expect(myArray).toStrictEqual([]);
  });

  it('should remove multiple items', () => {
    const obj1 = { key: 'value' };
    const obj3 = { key: 'bat', baz: 'bat' };
    const myArray: Obj[] = [obj1, obj3];

    removeObjects(myArray, [obj1, obj3]);

    expect(myArray).toStrictEqual([]);
  });

  it('should remove items, including duplications', () => {
    const myArray = [1, 1, 2, 3, 4, 5, 9, 888, 777, 6, 6, 6, 777];

    removeObjects(myArray, [1, 2, 3, 4, 5, 9, 6]);

    expect(myArray).toStrictEqual([888, 777, 777]);
  });
});

describe('fx: removeAt', () => {
  it('should remove item at given index', () => {
    const obj1 = { key: 'value' };
    const obj2 = { key: 'baz', booleanKey: false };
    const obj3 = { key: 'bat', baz: 'bat' };
    const obj4 = { key: 'qux', booleanKey: true };
    const myArray = [obj1, obj2, obj3, obj4];

    removeAt(myArray, 1);

    expect(myArray).toStrictEqual([obj1, obj3, obj4]);
  });

  it('should remove at multiple items at given indexes', () => {
    const obj1 = { key: 'value' };
    const obj3 = { key: 'bat', baz: 'bat' };
    const obj4 = { key: 'qux', booleanKey: true };
    const myArray = [obj1, obj3, obj4];

    removeAt(myArray, 1, 2);

    expect(myArray).toStrictEqual([obj1]);
  });

  it('should remove the last item', () => {
    const obj1 = { key: 'value' };
    const myArray = [obj1];

    removeAt(myArray, 0);

    expect(myArray).toStrictEqual([]);
  });

  describe('should return error:', () => {
    it('given a too high index', () => {
      const obj1 = { key: 'value' };
      const myArray: Obj[] = [obj1];

      expect(() => removeAt(myArray, 42)).toThrow('Index + length too high');
    });

    it('given a too low index', () => {
      const obj1 = { key: 'value' };
      const myArray: Obj[] = [obj1];

      expect(() => removeAt(myArray, -1)).toThrow('Index too low');
    });

    it('given an empty case', () => {
      const myArray: Obj[] = [];

      expect(() => removeAt(myArray, 0)).toThrow('Index + length too high');
    });
  });
});

describe('fx: isArray', () => {
  it.each([
    { value: [], expected: true },
    { value: true, expected: false },
    { value: 42, expected: false },
    { value: {}, expected: false },
    { value: { length: 42 }, expected: false },
  ])('should parse $val as $expect', ({ value, expected }) => {
    expect(isArray(value)).toBe(expected);
  });
});

describe('fx: clear', () => {
  it('should remove all the items', () => {
    const obj1 = { key: 'value' };
    const obj2 = { key: 'baz', booleanKey: false };
    const obj3 = { key: 'bat', baz: 'bat' };
    const obj4 = { key: 'qux', booleanKey: true };
    const myArray: Obj[] = [obj1, obj2, obj3, obj4];

    clear(myArray);

    expect(myArray).toHaveLength(0);
  });

  it('should not affect shallow copies', () => {
    const obj1 = { key: 'value' };
    const obj2 = { key: 'baz', booleanKey: false };
    const obj3 = { key: 'bat', baz: 'bat' };
    const obj4 = { key: 'qux', booleanKey: true };
    const myArray: Obj[] = [obj1, obj2, obj3, obj4];
    const myCopy = myArray;

    clear(myArray);

    expect(myCopy).toStrictEqual(myCopy);
  });
});

describe('fx: filterBy', () => {
  it('should return empty array if no list of items is provided', () => {
    const result = filterBy(null, { key: 'value' });

    expect(result).toStrictEqual([]);
  });

  it('should return empty array if nothing matches all the statements', () => {
    const obj1 = { key: 'value' };
    const obj2 = { key: 'baz', booleanKey: false };
    const obj3 = { key: 'bat', baz: 'bat' };
    const obj4 = { key: 'qux', booleanKey: true };
    const myArray: Obj[] = [obj1, obj2, obj3, obj4];

    const result = filterBy(myArray, { key: 'qux', booleanKey: false });

    expect(result).toStrictEqual([]);
  });

  describe('should return objects', () => {
    const obj1 = { key: 'value' };
    const obj2 = { key: 'baz', booleanKey: false };
    const obj3 = { key: 'bat', baz: 'bat' };
    const obj4 = { key: 'qux', booleanKey: true };
    const myArray: Obj[] = [obj1, obj2, obj3, obj4];

    it.each([
      {
        case:     'including a matching key with truthy value (boolean)',
        keyOrObj: 'booleanKey',
        expected: { key: 'qux', booleanKey: true }
      },
      {
        case:     'including a matching key with truthy value (string)',
        keyOrObj: 'baz',
        expected: { key: 'bat', baz: 'bat' }
      },
      {
        case:     'including a matching key with the same value (boolean)',
        keyOrObj: 'booleanKey',
        value:    false,
        expected: { key: 'baz', booleanKey: false }
      },
      {
        case:     'including a matching key with the same value (string)',
        keyOrObj: 'key',
        value:    'value',
        expected: { key: 'value' }
      },
      {
        case:     'including all the declared keys and values',
        keyOrObj: { key: 'qux', booleanKey: true },
        expected: { key: 'qux', booleanKey: true }
      },
      {
        case:     'including a matching key',
        keyOrObj: { booleanKey: undefined },
        expected: { key: 'qux', booleanKey: true }
      },
    ])('$case', ({ keyOrObj, value, expected }) => {
      const result = filterBy(myArray, keyOrObj, value);

      expect(result).toStrictEqual([expected]);
    });
  });
});

describe('fx: findBy', () => {
  it('should return undefined if no list of items is provided', () => {
    const result = findBy(null, { key: 'value' });

    expect(result).toBeUndefined();
  });

  it('should return undefined if nothing matches all the statements', () => {
    const obj1 = { key: 'value' };
    const obj2 = { key: 'baz', booleanKey: false };
    const obj3 = { key: 'bat', baz: 'bat' };
    const obj4 = { key: 'qux', booleanKey: true };
    const myArray: Obj[] = [obj1, obj2, obj3, obj4];

    const result = findBy(myArray, { key: 'qux', booleanKey: false });

    expect(result).toBeUndefined();
  });

  describe('should return object including', () => {
    const obj1 = { key: 'value' };
    const obj2 = { key: 'baz', booleanKey: false };
    const obj3 = { key: 'bat', baz: 'bat' };
    const obj4 = { key: 'qux', booleanKey: true };
    const myArray: Obj[] = [obj1, obj2, obj3, obj4];

    it.each([
      {
        case:     'a matching key with truthy value (boolean)',
        keyOrObj: 'booleanKey',
        expected: { key: 'qux', booleanKey: true }
      },
      {
        case:     'a matching key with truthy value (string)',
        keyOrObj: 'baz',
        expected: { key: 'bat', baz: 'bat' }
      },
      {
        case:     'a matching key with the same value (boolean)',
        keyOrObj: 'booleanKey',
        value:    false,
        expected: { key: 'baz', booleanKey: false }
      },
      {
        case:     'a matching key with the same value (string)',
        keyOrObj: 'key',
        value:    'value',
        expected: { key: 'value' }
      },
      {
        case:     'all the declared keys and values',
        keyOrObj: { key: 'qux', booleanKey: true },
        expected: { key: 'qux', booleanKey: true }
      },
      {
        case:     'a matching key',
        keyOrObj: { booleanKey: undefined },
        expected: { key: 'qux', booleanKey: true }
      },
    ])('$case', ({ keyOrObj, value, expected }) => {
      const result = findBy(myArray, keyOrObj, value);

      expect(result).toStrictEqual(expected);
    });
  });
});

describe('fx: insertAt', () => {
  it('should insert an item at the specified index', () => {
    const obj1 = { key: 'value' };
    const obj2 = { key: 'baz', booleanKey: false };
    const obj3 = { key: 'bat', baz: 'bat' };
    const myArray: Obj[] = [obj1, obj2];

    insertAt(myArray, 1, obj3);

    expect(myArray).toStrictEqual([obj1, obj3, obj2]);
  });
});

describe('fx: sameContents', () => {
  it('should return true if the two lists', () => {
    const obj1 = { key: 'value' };
    const obj2 = { key: 'baz', booleanKey: false };
    const a = [obj1, obj2];
    const b = [obj2, obj1];

    expect(sameContents(a, b)).toBe(true);
  });

  it('should return false if the two lists are not the same', () => {
    const obj1 = { key: 'value' };
    const obj2 = { key: 'baz', booleanKey: false };
    const obj3 = { key: 'bat', baz: 'bat' };
    const a = [obj1, obj2];
    const b = [obj1, obj3];

    expect(sameContents(a, b)).toBe(false);
  });

  it('should return false if the two lists have different length', () => {
    const obj1 = { key: 'value' };
    const obj2 = { key: 'baz', booleanKey: false };
    const obj3 = { key: 'bat', baz: 'bat' };
    const a = [obj1, obj2];
    const b = [obj1, obj2, obj3];

    expect(sameContents(a, b)).toBe(false);
  });
});

describe('fx: uniq', () => {
  it('should return a new array with unique items', () => {
    const obj1 = { key: 'value' };
    const obj2 = { key: 'baz', booleanKey: false };
    const obj3 = { key: 'bat', baz: 'bat' };
    const myArray: Obj[] = [obj1, obj2, obj3, obj1, obj2];

    const result = uniq(myArray);

    expect(result).toStrictEqual([obj1, obj2, obj3]);
    expect(result).not.toBe(myArray);
  });
});

describe('fx: replaceWith', () => {
  it('should replace values of the array and keep the inheritance', () => {
    const a = [1, 2, 3];
    const b = a;
    const c = [4, 5, 6];

    replaceWith(a, ...c);

    expect(a).toStrictEqual(c);
    expect(a).toBe(b);
  });
});

describe('fx: getUniqueLabelKeys', () => {
  it('should get list of unique resource labels', () => {
    const resources = [
      {
        metadata: {
          labels: {
            keyOne: 'value',
            keyTwo: 'value',
          }
        }
      },
      {
        metadata: {
          labels: {
            keyOne:   'value',
            keyThree: 'value',
          }
        }
      },
    ] as unknown as { metadata: { labels: { [name: string]: string} } }[] ;

    const expected = ['keyOne', 'keyThree', 'keyTwo'];
    const result = getUniqueLabelKeys(resources);

    expect(result).toStrictEqual(expected);
  });
});

describe('fx: joinStringList', () => {
  it('should join two lists of strings', () => {
    const a = 'a b c';
    const b = 'b c d';
    const separator = ' ';

    const result = joinStringList(a, b, separator);

    expect(result).toBe('a b c d');
  });
});
