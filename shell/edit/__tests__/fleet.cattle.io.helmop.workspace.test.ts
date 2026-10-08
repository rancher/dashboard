import { reactive } from 'vue';
import { mount } from '@vue/test-utils';
import { createStore } from 'vuex';
import { _CREATE, _EDIT } from '@shell/config/query-params';
import { CONFIG_MAP, SECRET } from '@shell/config/types';
import { CATALOG } from '@shell/config/labels-annotations';
import { AFTER_SAVE_HOOKS } from '@shell/mixins/child-hook';
import HelmOp from '@shell/models/fleet.cattle.io.helmop';
import HelmOpComponent from '@shell/edit/fleet.cattle.io.helmop.vue';
import { getFleetPolicyDefaults } from '@shell/utils/fleet-policy';
import { existsInNamespace, retargetToWorkspaceFromStore } from '@shell/utils/fleet-workspace';

jest.mock('@shell/utils/fleet-policy', () => ({ getFleetPolicyDefaults: jest.fn() }));
jest.mock('@shell/utils/fleet-workspace', () => ({
  ...jest.requireActual('@shell/utils/fleet-workspace'),
  existsInNamespace:            jest.fn(),
  retargetToWorkspaceFromStore: jest.fn(),
}));

const mockPolicyDefaults = getFleetPolicyDefaults as jest.Mock;
const mockExists = existsInNamespace as jest.Mock;
const mockRetarget = retargetToWorkspaceFromStore as jest.Mock;

const t = (key: string, args?: object) => (args ? `${ key }:${ JSON.stringify(args) }` : key);

const mockStore = () => ({
  dispatch: jest.fn(),
  commit:   jest.fn(),
  state:    {
    allWorkspaces: [{ id: 'fleet-default' }, { id: 'team-a' }],
    allNamespaces: [],
  },
  getters: {
    'i18n/t':                       t,
    'i18n/exists':                  jest.fn(),
    t,
    currentStore:                   () => 'current_store',
    'current_store/schemaFor':      jest.fn(),
    'current_store/all':            jest.fn(),
    'features/get':                 () => false,
    'management/paginationEnabled': () => false,
    'management/all':               () => [],
    workspace:                      'fleet-default',
  },
  rootGetters: { 'i18n/t': jest.fn() },
});

const basicsStep = () => [{
  name:           'basics',
  title:          'title',
  label:          'label',
  subtext:        'subtext',
  descriptionKey: 'description',
  ready:          true,
  weight:         1,
}];

const mountHelmOp = ({
  mode = _CREATE, spec = {}, annotations = {}, query = {}
}: any = {}) => {
  const value = reactive(new HelmOp({
    type:       'fleet.cattle.io.helmop',
    apiVersion: 'fleet.cattle.io/v1alpha1',
    kind:       'HelmOp',
    metadata:   {
      name: 'op', namespace: 'fleet-default', annotations
    },
    spec:         { helm: { repo: 'https://charts.example.com', chart: 'app' }, ...spec },
    status:       {},
    currentRoute: () => {},
  }, {
    getters:     { schemaFor: () => ({ linkFor: jest.fn() }) },
    dispatch:    jest.fn(),
    rootGetters: { 'i18n/t': jest.fn() },
  })) as any;

  value.applyDefaults = () => {};

  const store = mockStore();

  const wrapper = mount(HelmOpComponent, {
    props: {
      value, mode, realMode: mode
    },
    computed: { ...HelmOpComponent.computed, steps: basicsStep },
    global:   {
      provide: {
        store: createStore({
          getters: {
            currentStore:                   () => 'current_store',
            'management/paginationEnabled': () => () => false
          }
        })
      },
      mocks: {
        t,
        $store:      store,
        $fetchState: { pending: false },
        $route:      {
          query, hash: '', name: { endsWith: () => false }
        },
        $router: { currentRoute: { _value: { hash: '' } }, replace: jest.fn() },
      },
    },
  });

  return {
    wrapper, value, store
  };
};

const move = async(wrapper: any, value: any, workspace: string) => {
  value.metadata.namespace = workspace;
  await wrapper.vm.$nextTick();
  await wrapper.vm.workspaceChange;
};

describe('view: fleet.cattle.io.helmop - workspace', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPolicyDefaults.mockResolvedValue({ clientSecretName: '', helmSecretName: '' });
    mockRetarget.mockImplementation((store, targets) => Promise.resolve({
      targets, removedClusters: [], removedClusterGroups: []
    }));
  });

  it('offers the workspaces in the form, without creating a namespace', () => {
    const { wrapper } = mountHelmOp();
    const field = wrapper.findComponent({ name: 'NameNsDescription' });

    expect(field.props('namespaced')).toBe(true);
    expect(field.props('namespaceOptions')).toStrictEqual(['fleet-default', 'team-a']);
    expect(field.props('namespaceCreateAllowed')).toBe(false);
  });

  it('points the values from secrets and config maps at the new workspace, dropping the missing ones', async() => {
    const { wrapper, value } = mountHelmOp({
      spec: {
        helm: {
          repo:       'https://charts.example.com',
          chart:      'app',
          valuesFrom: [
            {
              secretKeyRef: {
                name: 'shared-secret', key: 'a', namespace: 'fleet-default'
              }
            },
            {
              configMapKeyRef: {
                name: 'local-values', key: 'values.yaml', namespace: 'fleet-default'
              }
            },
            {
              configMapKeyRef: {
                name: 'shared-values', key: 'values.yaml', namespace: 'fleet-default'
              }
            },
          ]
        }
      }
    });

    mockExists.mockImplementation((store, type, ws, name) => Promise.resolve(name.startsWith('shared')));

    await move(wrapper, value, 'team-a');

    expect(mockExists).toHaveBeenCalledWith(expect.anything(), SECRET, 'team-a', 'shared-secret');
    expect(mockExists).toHaveBeenCalledWith(expect.anything(), CONFIG_MAP, 'team-a', 'local-values');
    expect(value.spec.helm.valuesFrom).toStrictEqual([
      {
        secretKeyRef: {
          name: 'shared-secret', key: 'a', namespace: 'team-a'
        }
      },
      {
        configMapKeyRef: {
          name: 'shared-values', key: 'values.yaml', namespace: 'team-a'
        }
      },
    ]);
  });

  it('removes values from altogether when none exist in the new workspace', async() => {
    const { wrapper, value } = mountHelmOp({ spec: { helm: { valuesFrom: [{ secretKeyRef: { name: 'gone', key: 'a' } }] } } });

    mockExists.mockResolvedValue(false);

    await move(wrapper, value, 'team-a');

    expect(value.spec.helm.valuesFrom).toBeUndefined();
  });

  it('keeps the downstream resources that exist in the new workspace and lists each removed name once', async() => {
    const { wrapper, value } = mountHelmOp({
      spec: {
        helm: {
          repo: 'https://charts.example.com', chart: 'app', valuesFrom: [{ configMapKeyRef: { name: 'local-values', key: 'v' } }]
        },
        downstreamResources: [{ kind: 'Secret', name: 'shared-secret' }, { kind: 'ConfigMap', name: 'local-values' }],
      }
    });

    mockExists.mockImplementation((store, type, ws, name) => Promise.resolve(name.startsWith('shared')));

    await move(wrapper, value, 'team-a');

    expect(value.spec.downstreamResources).toStrictEqual([{ kind: 'Secret', name: 'shared-secret' }]);
    expect(wrapper.vm.workspaceNotice.match(/local-values/g)).toHaveLength(1);
    expect(wrapper.find('[data-testid="helmop-workspace-notice"]').attributes('role')).toBe('status');
  });

  it('checks a helm secret stored with its namespace by its name only', async() => {
    const { wrapper, value } = mountHelmOp({ spec: { helmSecretName: 'fleet-default/helm-creds' } });

    mockExists.mockResolvedValue(true);

    await move(wrapper, value, 'team-a');

    expect(mockExists).toHaveBeenCalledWith(expect.anything(), SECRET, 'team-a', 'helm-creds');
    expect(value.spec.helmSecretName).toBe('fleet-default/helm-creds');
  });

  it('replaces the helm secret the old workspace policy filled in with the new workspace one', async() => {
    mockPolicyDefaults.mockImplementation((store, namespace) => Promise.resolve({ clientSecretName: '', helmSecretName: `${ namespace }-helm` }));

    const { wrapper, value } = mountHelmOp();

    await wrapper.vm.applyPolicyDefaults();
    await move(wrapper, value, 'team-a');

    expect(value.spec.helmSecretName).toBe('team-a-helm');
    expect(wrapper.vm.workspaceNotice).toBe('');
  });

  it('leaves an App Collection bundle alone, whose workspace is the one of its credential', async() => {
    const { wrapper, value } = mountHelmOp({
      annotations: { [CATALOG.SUSE_APP_COLLECTION]: 'true' },
      spec:        { helmSecretName: 'fleet-appco-auth-abc' },
    });

    await move(wrapper, value, 'team-a');

    expect(wrapper.vm.workspaceChange).toBeNull();
    expect(value.spec.helmSecretName).toBe('fleet-appco-auth-abc');
  });

  it('does not touch the resource when editing', async() => {
    const { wrapper, value } = mountHelmOp({ mode: _EDIT, spec: { helmSecretName: 'helm-creds' } });

    await move(wrapper, value, 'team-a');

    expect(wrapper.vm.workspaceChange).toBeNull();
    expect(value.spec.helmSecretName).toBe('helm-creds');
  });

  it('moves the header to the workspace the new resource was saved in', async() => {
    const { wrapper, value, store } = mountHelmOp();

    value.metadata.namespace = 'team-a';
    await wrapper.vm.applyHooks(AFTER_SAVE_HOOKS);

    expect(store.commit).toHaveBeenCalledWith('updateWorkspace', { value: 'team-a', getters: store.getters });
  });
});
