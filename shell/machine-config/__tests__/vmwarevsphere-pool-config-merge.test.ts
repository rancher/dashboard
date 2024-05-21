import { vspherePoolConfigMerge } from '@shell/machine-config/vmwarevsphere-pool-config-merge';

describe('vspherePoolConfigMerge', () => {
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

  it.each(testCases)('should merge properly', (obj1, obj2, expected) => {
    const result = vspherePoolConfigMerge(obj1, obj2);

    expect(result).toStrictEqual(expected);
  });
});
