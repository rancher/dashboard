import { abbreviateClusterName } from '@shell/utils/cluster';

describe('fx: abbreviateClusterName', () => {
  it.each([
    ['local', 'lcl'],
    ['world-wide-web', 'www'],
    ['a', 'a'],
    ['ab', 'ab'],
    ['abc', 'abc'],
    ['', ''],
    ['1', '1'],
    ['12', '12'],
    ['123', '123'],
    ['a1', 'a1'],
    ['aa1', 'aa1'],
    ['aaa1', 'aa1'],
    ['a-b', 'a-b'],
    ['1-2', '1-2'],
    ['a-b-c', 'abc'],
    ['abc-def-ghi', 'adg'],
    ['abcd-efgh', 'adh'],
    ['a-bc', 'abc'],
    ['ab-c', 'abc'],
    ['ab-cd', 'abd'],
    ['a-bcd', 'abd'],
    ['abc-d', 'acd'],
    ['0123-4567-89ab-cdef', '048'],
    ['0123-4567-89ab-cdef-ghij', '048'],
    ['0123-4567-8901-2345', '048'],
    ['0123-4567-8901-2345-6789', '048'],
    ['a1b', 'a1b'],
    ['a1b2', 'a1b'],
    ['ab12cd34', 'a1c'],
    ['test-cluster-one', 'tco'],
    ['test-cluster-1', 'tc1'],
    ['customer-support-team-1', 'cst'],
    ['customer-support-team-one', 'cst'],
    ['customer-support-team-prod', 'cst'],
    ['customer-support-team-dev', 'cst'],
    ['customer-support-team-prod-1', 'cst'],
    ['customer-support-team-dev-1', 'cst'],
    ['customer-support-team-prod-2', 'cst'],
    ['customer-support-team-dev-2', 'cst'],

    ['s322', 's32'],
    ['sowmya2', 'sa2'],
    ['sowmya4', 'sa4'],
    ['sowmya', 'sma'],
    ['sowmyatest4', 'st4'],
  ])('should evaluate %p as %p', (value, expected) => {
    const result = abbreviateClusterName(value);

    expect(result).toStrictEqual(expected);
  });
});
