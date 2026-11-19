import { flushPromises, shallowMount } from '@vue/test-utils';
import ExplorerMembers from '@shell/components/ExplorerMembers.vue';
import { MANAGEMENT, NORMAN } from '@shell/config/types';

const CRTB = MANAGEMENT.CLUSTER_ROLE_TEMPLATE_BINDING;
const CLUSTER_ID = 'c-m-abc';
const CLUSTER_URL = `https://rancher.example/v1/management.cattle.io.clusters/${ CLUSTER_ID }`;
const ADD_BUTTON = '[data-testid="button-cluster-member-add"]';

const schemasTheAddFormNeeds = [CRTB, MANAGEMENT.ROLE_TEMPLATE, MANAGEMENT.USER];
const normanCrtbSchemaGivenToEveryUser = { id: NORMAN.CLUSTER_ROLE_TEMPLATE_BINDING, collectionMethods: ['POST', 'GET'] };
const mayCreateMembers = { resourcePermissions: { [CRTB]: { create: CLUSTER_URL, list: CLUSTER_URL } } };

interface MountOptions {
  clusterPermissionsRequest?: () => Promise<any>;
  managementSchemas?: string[];
}

function mountExplorerMembers({ clusterPermissionsRequest = () => Promise.resolve(mayCreateMembers), managementSchemas = schemasTheAddFormNeeds }: MountOptions = {}) {
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
              id: CLUSTER_ID, isLocal: false, links: { self: CLUSTER_URL }
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
  describe('cluster membership Add button', () => {
    it('asks the current cluster whether the user may create cluster role template bindings in it', async() => {
      const { wrapper, dispatch } = mountExplorerMembers();

      await fetchAndRender(wrapper);

      expect(dispatch).toHaveBeenCalledWith('management/request', { url: `${ CLUSTER_URL }?checkPermissions=${ CRTB }` });
    });

    it('is hidden before the permission check has answered', () => {
      const { wrapper } = mountExplorerMembers();

      expect(wrapper.find(ADD_BUTTON).exists()).toBe(false);
    });

    it('is shown when the user may create cluster role template bindings in the current cluster', async() => {
      const { wrapper } = mountExplorerMembers();

      await fetchAndRender(wrapper);

      expect(wrapper.find(ADD_BUTTON).exists()).toBe(true);
    });

    it.each([
      ['the user may only read them', { resourcePermissions: { [CRTB]: { get: CLUSTER_URL, list: CLUSTER_URL } } }],
      ['the response has no permissions for them', { resourcePermissions: { [MANAGEMENT.PROJECT]: { create: CLUSTER_URL } } }],
      ['the response has no resource permissions', {}],
      ['the response is empty', undefined],
    ])('is hidden when %s', async(_, response) => {
      const { wrapper } = mountExplorerMembers({ clusterPermissionsRequest: () => Promise.resolve(response) });

      await fetchAndRender(wrapper);

      expect(wrapper.find(ADD_BUTTON).exists()).toBe(false);
    });

    it('is hidden when the user may create members but cannot read the role templates the Add form lists', async() => {
      const { wrapper } = mountExplorerMembers({ managementSchemas: [CRTB, MANAGEMENT.USER] });

      await fetchAndRender(wrapper);

      expect(wrapper.find(ADD_BUTTON).exists()).toBe(false);
    });

    it('is hidden when the permission check fails', async() => {
      jest.spyOn(console, 'warn').mockImplementation(() => {});
      const { wrapper } = mountExplorerMembers({ clusterPermissionsRequest: () => Promise.reject(new Error('403')) });

      await fetchAndRender(wrapper);

      expect(wrapper.find(ADD_BUTTON).exists()).toBe(false);
    });

    it('logs which cluster the failed permission check was for', async() => {
      const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
      const error = new Error('403');
      const { wrapper } = mountExplorerMembers({ clusterPermissionsRequest: () => Promise.reject(error) });

      await fetchAndRender(wrapper);

      expect(warn).toHaveBeenCalledWith(`cluster membership permission check failed for ${ CLUSTER_ID }, hiding Add (fail-closed):`, error);
    });

    it('treats an empty answer as no permission rather than as a failed check', async() => {
      const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
      const { wrapper } = mountExplorerMembers({ clusterPermissionsRequest: () => Promise.resolve(undefined) });

      await fetchAndRender(wrapper);

      expect(warn).not.toHaveBeenCalled();
    });

    it('does not fail the page load when the current cluster is gone before the check runs', async() => {
      jest.spyOn(console, 'warn').mockImplementation(() => {});
      const pageWithoutCluster = {
        $store: { dispatch: jest.fn() }, currentCluster: undefined, canEditClusterMembers: false
      };

      await expect((ExplorerMembers as any).methods.loadClusterMembershipPermissions.call(pageWithoutCluster)).resolves.toBeUndefined();
    });

    it('keeps the page loading until the permission check has answered, so Add never appears late', async() => {
      let answerPermissionCheck: (response: any) => void = () => {};
      const { wrapper } = mountExplorerMembers({ clusterPermissionsRequest: () => new Promise((resolve) => (answerPermissionCheck = resolve)) });
      let fetchFinished = false;
      const fetching = (ExplorerMembers as any).fetch.call(wrapper.vm).then(() => (fetchFinished = true));

      await flushPromises();
      const finishedBeforeAnswer = fetchFinished;

      answerPermissionCheck(mayCreateMembers);
      await fetching;

      expect(finishedBeforeAnswer).toBe(false);
    });
  });
});
