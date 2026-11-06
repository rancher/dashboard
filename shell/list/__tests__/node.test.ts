import { shallowMount } from '@vue/test-utils';
import ListNode from '@shell/list/node.vue';
import { POD } from '@shell/config/types';

describe('list: node', () => {
  const createWrapper = ({ canPaginate = false, canListPods = false } = {}) => {
    const dispatch = jest.fn(() => Promise.resolve([]));
    const getters = {
      'cluster/schemaFor':         jest.fn((type: string) => (type === POD && !canListPods ? undefined : { id: type })),
      'rancher/schemaFor':         jest.fn(() => undefined),
      'management/schemaFor':      jest.fn(() => undefined),
      'cluster/all':               jest.fn(() => []),
      'cluster/paginationEnabled': jest.fn(() => canPaginate),
      'type-map/headersFor':       jest.fn(() => [{ name: 'name' }, { name: 'age' }]),
      'prefs/get':                 jest.fn(),
      'i18n/t':                    (key: string) => key,
      currentCluster:              { provClusterId: 'fleet-default/a-cluster' },
    };

    return shallowMount(ListNode, {
      props:  { resource: 'node', schema: { id: 'node' } as any },
      global: { mocks: { $store: { getters, dispatch } } },
    });
  };

  const podsRequests = (wrapper: any) => wrapper.vm.$store.dispatch.mock.calls.filter(([, args]: any[]) => args?.type === POD || args === POD);

  it.each([
    ['headers', {}],
    ['paginationHeaders', { canPaginate: true }],
  ])('should add the pods column before the last column of the %s, from the node, even when the user can not list pods', (computed, opts) => {
    const wrapper: any = createWrapper(opts);
    const headers = wrapper.vm[computed];

    expect(headers.map((header: any) => header.name)).toStrictEqual(['name', 'pods', 'age']);
    expect(headers[1].getValue({ podUsagePercentage: '25' })).toStrictEqual('25');
  });

  it('should not fetch pods for the pods column, even when the user can list them', async() => {
    const wrapper: any = createWrapper({ canListPods: true });

    await wrapper.vm.fetchSecondaryResources({ canPaginate: false });
    await wrapper.vm.fetchPageSecondaryResources({
      canPaginate: true, force: false, page: [{ id: 'node-1' }]
    });
    wrapper.unmount();

    expect(podsRequests(wrapper)).toStrictEqual([]);
  });
});
