import { useDefaultLabels } from '@shell/components/Resource/Detail/Metadata/Labels/composable';

describe('composable: useDefaultLabels', () => {
  it('should map labels to key/value rows when the resource has no filteredSystemLabels', () => {
    const resource = { labels: { foo: 'bar', baz: 'qux' } };

    expect(useDefaultLabels(resource).value).toStrictEqual([
      { key: 'foo', value: 'bar' },
      { key: 'baz', value: 'qux' },
    ]);
  });

  it('should prefer filteredSystemLabels so the detail page shows what the list shows', () => {
    const resource = {
      labels:               { 'kubernetes.io/os': 'linux', 'plan.cattle.io/machine-kind': 'Node' },
      filteredSystemLabels: { 'plan.cattle.io/machine-kind': 'Node' },
    };

    expect(useDefaultLabels(resource).value).toStrictEqual([{ key: 'plan.cattle.io/machine-kind', value: 'Node' }]);
  });

  it('should render nothing when filteredSystemLabels is empty but labels are not', () => {
    const resource = { labels: { 'kubernetes.io/os': 'linux' }, filteredSystemLabels: {} };

    expect(useDefaultLabels(resource).value).toStrictEqual([]);
  });

  it.each([
    ['labels is undefined', {}],
    ['labels is null', { labels: null }],
    ['labels is empty', { labels: {} }],
  ])('should return an empty list when %s', (_, resource) => {
    expect(useDefaultLabels(resource).value).toStrictEqual([]);
  });
});
