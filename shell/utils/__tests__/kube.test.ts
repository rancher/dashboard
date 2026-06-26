import { normalizeName } from '@shell/utils/kube';

describe('normalizeName', () => {
  it.each([
    {
      desc:     'trims leading and trailing whitespace',
      input:    '  hello  ',
      expected: 'hello',
    },
    {
      desc:     'converts uppercase to lowercase',
      input:    'Hello World',
      expected: 'hello-world',
    },
    {
      desc:     'replaces spaces with hyphens',
      input:    'my resource name',
      expected: 'my-resource-name',
    },
    {
      desc:     'collapses multiple spaces into a single hyphen',
      input:    'foo   bar',
      expected: 'foo-bar',
    },
    {
      desc:     'collapses consecutive hyphens into one',
      input:    'foo--bar',
      expected: 'foo-bar',
    },
    {
      desc:     'strips leading hyphens',
      input:    '---foo',
      expected: 'foo',
    },
    {
      desc:     'strips trailing hyphens',
      input:    'foo---',
      expected: 'foo',
    },
    {
      desc:     'handles empty string',
      input:    '',
      expected: '',
    },
    {
      desc:     'handles null by treating it as empty string',
      input:    null as unknown as string,
      expected: '',
    },
    {
      desc:     'handles undefined by treating it as empty string',
      input:    undefined as unknown as string,
      expected: '',
    },
    {
      desc:     'leaves already-normalized names unchanged',
      input:    'my-resource',
      expected: 'my-resource',
    },
    {
      desc:     'handles mixed-case with spaces and leading/trailing hyphens',
      input:    ' -My Resource- ',
      expected: 'my-resource',
    },
  ])('$desc', ({ input, expected }) => {
    expect(normalizeName(input)).toStrictEqual(expected);
  });
});
