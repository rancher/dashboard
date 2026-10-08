import { reactive } from 'vue';
import { mount } from '@vue/test-utils';
import { _CREATE, _EDIT, _VIEW } from '@shell/config/query-params';
import { SECRET } from '@shell/config/types';
import { AFTER_SAVE_HOOKS } from '@shell/mixins/child-hook';
import GitRepo from '@shell/models/fleet.cattle.io.gitrepo';
import GitRepoComponent from '@shell/edit/fleet.cattle.io.gitrepo.vue';
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

const createStore = (workspace = 'fleet-default') => ({
  dispatch: jest.fn(),
  commit:   jest.fn(),
  state:    {
    allWorkspaces: [{ id: 'fleet-default' }, { id: 'fleet-local' }, { id: 'team-a' }],
    allNamespaces: [],
  },
  getters: {
    'i18n/t':                  t,
    'i18n/exists':             jest.fn(),
    t,
    currentStore:              () => 'current_store',
    'current_store/schemaFor': jest.fn(),
    'current_store/all':       jest.fn(),
    'features/get':            () => false,
    workspace,
  },
  rootGetters: { 'i18n/t': jest.fn() },
});

const metadataStep = () => [{
  name:           'stepMetadata',
  title:          'title',
  label:          'label',
  subtext:        'subtext',
  descriptionKey: 'description',
  ready:          true,
  weight:         1,
}];

const mountGitRepo = ({
  mode = _CREATE, realMode = mode, spec = {}, namespace = 'fleet-default', store = createStore()
}: any = {}) => {
  const value = reactive(new GitRepo({
    type:         'fleet.cattle.io.gitrepo',
    apiVersion:   'fleet.cattle.io/v1alpha1',
    kind:         'GitRepo',
    metadata:     { name: 'repo', namespace },
    spec:         { repo: 'https://github.com/rancher/fleet-examples', ...spec },
    status:       {},
    currentRoute: () => {},
  }, {
    getters:     { schemaFor: () => ({ linkFor: jest.fn() }) },
    dispatch:    jest.fn(),
    rootState:   { $extension: { getPlugins: () => ({}) } },
    rootGetters: { 'i18n/t': jest.fn() },
  })) as any;

  const wrapper = mount(GitRepoComponent, {
    props: {
      value, liveValue: value, mode, realMode
    },
    computed: { ...GitRepoComponent.computed, steps: metadataStep },
    global:   {
      mocks: {
        t,
        $store:      store,
        $fetchState: { pending: false },
        $route:      { query: { AS: '' }, name: { endsWith: () => false } },
      },
    },
  });

  return {
    wrapper, value, store
  };
};

const followHeader = (wrapper: { vm: object }, neu: string, old: string) => {
  const watchers = GitRepoComponent.watch as Record<string, (neu: string, old: string) => void>;

  watchers.workspace.call(wrapper.vm, neu, old);
};

const move = async(wrapper: any, value: any, workspace: string) => {
  value.metadata.namespace = workspace;
  await wrapper.vm.$nextTick();
  await wrapper.vm.workspaceChange;
};

describe('view: fleet.cattle.io.gitrepo - workspace', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPolicyDefaults.mockResolvedValue({ clientSecretName: '', helmSecretName: '' });
    mockRetarget.mockImplementation((store, targets) => Promise.resolve({
      targets, removedClusters: [], removedClusterGroups: []
    }));
    mockExists.mockResolvedValue(true);
  });

  it('offers the workspaces in the form, without creating a namespace', () => {
    const { wrapper } = mountGitRepo();
    const field = wrapper.findComponent({ name: 'NameNsDescription' });

    expect(field.props('namespaced')).toBe(true);
    expect(field.props('namespaceOptions')).toStrictEqual(['fleet-default', 'fleet-local', 'team-a']);
    expect(field.props('namespaceCreateAllowed')).toBe(false);
    expect(field.props('namespaceLabel')).toBe('nameNsDescription.workspace.label');
  });

  describe('when the workspace changes on create', () => {
    it('keeps the secrets that exist in the new workspace and removes the others', async() => {
      const { wrapper, value } = mountGitRepo({ spec: { clientSecretName: 'git-creds', helmSecretName: 'helm-creds' } });

      mockExists.mockImplementation((store, type, workspace, name) => Promise.resolve(type === SECRET && name === 'helm-creds'));

      await move(wrapper, value, 'team-a');

      expect(mockExists).toHaveBeenCalledWith(expect.anything(), SECRET, 'team-a', 'git-creds');
      expect(value.spec.clientSecretName).toBeUndefined();
      expect(value.spec.helmSecretName).toBe('helm-creds');
      expect(wrapper.vm.workspaceNotice).toContain('fleet.workspaces.moved.removed');
      expect(wrapper.vm.workspaceNotice).toContain('fleet.workspaces.moved.secret:{\\"name\\":\\"git-creds\\"}');
      expect(wrapper.find('[data-testid="gitrepo-workspace-notice"]').attributes('role')).toBe('status');
    });

    it('drops an existing secret picked in the form, which is cached against the old workspace', async() => {
      const { wrapper, value } = mountGitRepo();

      const cached = wrapper.vm.tempCachedValues as Record<string, object | undefined>;

      cached.clientSecretName = { selected: 'fleet-default/git-creds' };
      cached.helmSecretName = {
        selected: 'basic', publicKey: 'user', privateKey: 'pass'
      };

      await move(wrapper, value, 'team-a');

      expect(cached.clientSecretName).toBeUndefined();
      expect(cached.helmSecretName).toStrictEqual({
        selected: 'basic', publicKey: 'user', privateKey: 'pass'
      });
    });

    it('replaces the credential the old workspace policy filled in with the new workspace one', async() => {
      mockPolicyDefaults.mockImplementation((store, namespace) => Promise.resolve({ clientSecretName: `${ namespace }-default`, helmSecretName: '' }));

      const { wrapper, value } = mountGitRepo();

      await wrapper.vm.applyPolicyDefaults();
      expect(value.spec.clientSecretName).toBe('fleet-default-default');

      await move(wrapper, value, 'team-a');

      expect(mockExists).not.toHaveBeenCalledWith(expect.anything(), SECRET, 'team-a', 'fleet-default-default');
      expect(value.spec.clientSecretName).toBe('team-a-default');
      expect(wrapper.vm.workspaceNotice).toBe('');
    });

    it('retargets and lists the clusters and cluster groups that were removed', async() => {
      mockRetarget.mockResolvedValue({
        targets: [{ clusterSelector: { matchLabels: { env: 'dev' } } }], removedClusters: ['c-1'], removedClusterGroups: ['group-1']
      });

      const { wrapper, value } = mountGitRepo({ spec: { targets: [{ clusterName: 'c-1' }, { clusterGroup: 'group-1' }, { clusterSelector: { matchLabels: { env: 'dev' } } }] } });

      wrapper.vm.targetsCreated = 'clusters';

      await move(wrapper, value, 'team-a');

      expect(mockRetarget).toHaveBeenCalledWith(expect.anything(), expect.any(Array), 'team-a');
      expect(value.spec.targets).toStrictEqual([{ clusterSelector: { matchLabels: { env: 'dev' } } }]);
      expect(wrapper.vm.targetsCreated).toBe('clusters');
      expect(wrapper.vm.workspaceNotice).toContain('fleet.workspaces.moved.cluster:{\\"name\\":\\"c-1\\"}');
      expect(wrapper.vm.workspaceNotice).toContain('fleet.workspaces.moved.clusterGroup:{\\"name\\":\\"group-1\\"}');
    });

    it('falls back to no target mode once every picked target is removed', async() => {
      mockRetarget.mockResolvedValue({
        targets: undefined, removedClusters: ['c-1'], removedClusterGroups: []
      });

      const { wrapper, value } = mountGitRepo({ spec: { targets: [{ clusterName: 'c-1' }] } });

      wrapper.vm.targetsCreated = 'clusters';

      await move(wrapper, value, 'team-a');

      expect(value.spec.targets).toBeUndefined();
      expect(wrapper.vm.targetsCreated).toBe('none');
    });

    it('waits for the change to settle before checking the name on Next', async() => {
      const { wrapper, value } = mountGitRepo();
      let settle: (v: boolean) => void = () => {};

      mockExists.mockReturnValue(new Promise((resolve) => {
        settle = resolve;
      }));
      value.spec.clientSecretName = 'git-creds';
      value.dryRunCreate = jest.fn();

      value.metadata.namespace = 'team-a';
      await wrapper.vm.$nextTick();

      const next = wrapper.vm.beforeNext({ name: 'stepMetadata' });

      await Promise.resolve();
      expect(value.dryRunCreate).not.toHaveBeenCalled();

      settle(false);
      await next;

      expect(value.dryRunCreate).toHaveBeenCalledWith(expect.objectContaining({ metadata: { name: 'repo', namespace: 'team-a' } }));
    });
  });

  it('does not touch the resource when the workspace of an existing one is shown', async() => {
    const { wrapper, value } = mountGitRepo({ mode: _EDIT, spec: { clientSecretName: 'git-creds' } });

    value.metadata.namespace = 'team-a';
    await wrapper.vm.$nextTick();

    expect(wrapper.vm.workspaceChange).toBeNull();
    expect(value.spec.clientSecretName).toBe('git-creds');
  });

  describe('header workspace', () => {
    it('follows the header while the user has not picked another workspace', async() => {
      const { wrapper, value } = mountGitRepo();

      followHeader(wrapper, 'team-a', 'fleet-default');

      expect(value.metadata.namespace).toBe('team-a');
    });

    it('stops following the header once the user picked a workspace in the form', async() => {
      const { wrapper, value } = mountGitRepo({ namespace: 'fleet-local' });

      followHeader(wrapper, 'team-a', 'fleet-default');

      expect(value.metadata.namespace).toBe('fleet-local');
    });

    it('follows the header when the form holds no known workspace', async() => {
      const { wrapper, value } = mountGitRepo({ namespace: 'default' });

      followHeader(wrapper, 'team-a', 'fleet-default');

      expect(value.metadata.namespace).toBe('team-a');
    });

    it('moves to the workspace the new resource was saved in', async() => {
      const { wrapper, value, store } = mountGitRepo();

      value.metadata.namespace = 'team-a';
      await wrapper.vm.applyHooks(AFTER_SAVE_HOOKS);

      expect(store.commit).toHaveBeenCalledWith('updateWorkspace', { value: 'team-a', getters: store.getters });
    });

    it.each([_EDIT, _VIEW])('moves to the workspace of the resource opened in %p mode', (mode) => {
      const store = createStore('fleet-local');

      mountGitRepo({ mode, store });

      expect(store.commit).toHaveBeenCalledWith('updateWorkspace', { value: 'fleet-default', getters: store.getters });
    });

    it('stays where it is when a clone is cancelled', () => {
      const store = createStore('fleet-local');

      mountGitRepo({ realMode: 'clone', store });

      expect(store.commit).not.toHaveBeenCalled();
    });
  });
});
