import { shallowMount } from '@vue/test-utils';
import ExplorerMembers from '@shell/components/ExplorerMembers.vue';
import { MANAGEMENT, NORMAN } from '@shell/config/types';

const CRTB = MANAGEMENT.CLUSTER_ROLE_TEMPLATE_BINDING;
const CLUSTER_URL = 'https://rancher.example/v1/management.cattle.io.clusters/c-m-abc';
const ADD_BUTTON = '[data-testid="button-cluster-member-add"]';

const managementSchemas = [CRTB, MANAGEMENT.ROLE_TEMPLATE, MANAGEMENT.USER];
const normanCrtbSchemaGivenToEveryUser = { id: NORMAN.CLUSTER_ROLE_TEMPLATE_BINDING, collectionMethods: ['POST', 'GET'] };

function mountExplorerMembers(clusterPermissionsRequest: () => Promise<any>) {
  const dispatch = jest.fn((action: string) => {
    if (action === 'management/request') {
      return clusterPermissionsRequest();
    }

    return Promise.resolve([]);
  });

  const wrapper = shallowMount(ExplorerMembers, {
    global: {
      mocks: {
        $store: {
          getters: {
            'management/schemaFor': (type: string) => (managementSchemas.includes(type) ? { id: type } : null),
            'rancher/schemaFor':    (type: string) => (type === NORMAN.CLUSTER_ROLE_TEMPLATE_BINDING ? normanCrtbSchemaGivenToEveryUser : null),
            currentCluster:         {
              id: 'c-m-abc', isLocal: false, links: { self: CLUSTER_URL }
            },
            currentProduct: { inStore: 'management' },
          },
          dispatch,
        },
        $fetchState: { pending: false },
      },
      stubs: {
        Tabbed: { template: '<div><slot /></div>' },
        Tab:    { template: '<div><slot /></div>' },
      },
      directives: { 'trim-whitespace': (id: any) => id },
    },
  });

  return { wrapper, dispatch };
}

async function fetchAndRender(wrapper: any) {
  await (ExplorerMembers as any).fetch.call(wrapper.vm);
  await wrapper.vm.$nextTick();
}

describe('component: ExplorerMembers', () => {
  it('asks the current cluster whether the user may create cluster role template bindings in it', async() => {
    const { wrapper, dispatch } = mountExplorerMembers(() => Promise.resolve({}));

    await fetchAndRender(wrapper);

    expect(dispatch).toHaveBeenCalledWith('management/request', { url: `${ CLUSTER_URL }?checkPermissions=${ CRTB }` });
  });

  it('shows Add when the user may create cluster role template bindings in the current cluster', async() => {
    const { wrapper } = mountExplorerMembers(() => Promise.resolve({ resourcePermissions: { [CRTB]: { create: CLUSTER_URL, list: CLUSTER_URL } } }));

    await fetchAndRender(wrapper);

    expect(wrapper.find(ADD_BUTTON).exists()).toBe(true);
  });

  it.each([
    ['the user may only read them', { resourcePermissions: { [CRTB]: { get: CLUSTER_URL, list: CLUSTER_URL } } }],
    ['the response has no resource permissions', {}],
  ])('hides Add when %s', async(_, response) => {
    const { wrapper } = mountExplorerMembers(() => Promise.resolve(response));

    await fetchAndRender(wrapper);

    expect(wrapper.find(ADD_BUTTON).exists()).toBe(false);
  });

  it('hides Add when the permission check fails', async() => {
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    const { wrapper } = mountExplorerMembers(() => Promise.reject(new Error('403')));

    await fetchAndRender(wrapper);

    expect(wrapper.find(ADD_BUTTON).exists()).toBe(false);
  });
});
