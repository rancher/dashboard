import { shallowMount } from '@vue/test-utils';
import ClusterGroupComponent from '@shell/edit/fleet.cattle.io.clustergroup.vue';
import { _CREATE, _EDIT } from '@shell/config/query-params';
import { AFTER_SAVE_HOOKS } from '@shell/mixins/child-hook';

const createStore = (workspace = 'fleet-default') => ({
  dispatch: jest.fn(),
  commit:   jest.fn(),
  state:    { allWorkspaces: [{ id: 'fleet-default' }, { id: 'team-a' }], allNamespaces: [] },
  getters:  {
    'i18n/t':               (text: string) => text,
    'management/schemaFor': () => null,
    'management/byId':      () => null,
    currentStore:           () => 'management',
    workspace,
  },
});

const clusterGroup = (namespace = 'fleet-default') => ({
  type:     'fleet.cattle.io.clustergroup',
  metadata: { name: 'group', namespace },
  spec:     { selector: { matchLabels: {}, matchExpressions: [] } },
});

const mountClusterGroup = ({ mode = _CREATE, value = clusterGroup(), store = createStore() } = {}) => shallowMount(ClusterGroupComponent, {
  props:  { value, mode },
  global: {
    mocks: {
      $store: store, $fetchState: { pending: false }, $route: { query: {}, name: 'c-cluster-product-resource-create' }
    },
    stubs: {
      CruResource: {
        name: 'CruResource', template: '<div><slot /></div>', props: ['validationPassed']
      }
    },
  },
});

describe('edit: fleet.cattle.io.clustergroup', () => {
  it('should pick the workspace from the workspaces, without offering to create a namespace', () => {
    const wrapper = mountClusterGroup();
    const field = wrapper.findComponent({ name: 'NameNsDescription' });

    expect(field.props('namespaced')).toBe(true);
    expect(field.props('namespaceOptions')).toStrictEqual(['fleet-default', 'team-a']);
    expect(field.props('namespaceCreateAllowed')).toBe(false);
    expect(field.props('namespaceLabel')).toBe('nameNsDescription.workspace.label');
  });

  it.each([
    ['fleet-default', true],
    ['', false],
  ])('should only let a group in workspace %p be saved: %p', (namespace, expected) => {
    const wrapper = mountClusterGroup({ value: clusterGroup(namespace) });

    expect(wrapper.findComponent({ name: 'CruResource' }).props('validationPassed')).toBe(expected);
  });

  it('should move the header to the workspace the new group was saved in', async() => {
    const store = createStore();
    const value = clusterGroup();
    const wrapper = mountClusterGroup({ value, store });

    value.metadata.namespace = 'team-a';
    await (wrapper.vm as any).applyHooks(AFTER_SAVE_HOOKS);

    expect(store.commit).toHaveBeenCalledWith('updateWorkspace', { value: 'team-a', getters: store.getters });
  });

  it('should move the header to the workspace of the group being edited', () => {
    const store = createStore('team-a');

    mountClusterGroup({ mode: _EDIT, store });

    expect(store.commit).toHaveBeenCalledWith('updateWorkspace', { value: 'fleet-default', getters: store.getters });
  });
});
