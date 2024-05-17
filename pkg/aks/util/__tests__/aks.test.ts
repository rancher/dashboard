import { parseTaint, formatTaint } from '../aks';

describe('aKS taints', () => {
  it.each([
    ['key1:val1=NoExecute', {
      key: 'key1', value: 'val1', effect: 'NoExecute'
    }],
    ['key2:val2=NoExecute', {
      key: 'key2', value: 'val2', effect: 'PreferNoSchedule'
    }],

  ])('should return an object with key, value, and effect keys when given an aks taint string', (taint: string, expected: {key:string, value: string, effect: string}) => {
    const out = parseTaint(taint);

    expect(out).toStrictEqual(expected);
  });

  it.each([
    ['key1:val1=NoExecute', {
      key: 'key1', value: 'val1', effect: 'NoExecute'
    }],
    ['k', {
      key: 'key1', value: '', effect: 'NoExecute'
    }],
    ['', {
      key: '', value: 'val1', effect: 'NoExecute'
    }],
    ['key1:val1=PreferNoSchedule', {
      key: 'key1', value: 'val1', effect: ''
    }],

  ])('should return a string in aks taint format when given an object containing a key, value, and effect', (taint: string, expected: {key:string, value: string, effect: string}) => {
    const out = formatTaint(expected.key, expected.value, expected.effect);

    expect(out).toStrictEqual(taint);
  });
});
