import { nextTick, reactive } from 'vue';
import { shallowMount } from '@vue/test-utils';
import WorkspaceSwitcher from '@shell/components/nav/WorkspaceSwitcher.vue';

describe('component: WorkspaceSwitcher', () => {
  const workspaces = [
    { id: 'fleet-default', nameDisplay: 'fleet-default' },
    { id: 'fleet-local', nameDisplay: 'fleet-local' }
  ];

  const mountSwitcher = (workspace: string, allWorkspaces = workspaces, lastNamespace = '') => {
    const dispatch = jest.fn();
    const commit = jest.fn();
    const state = reactive({
      workspace,
      allWorkspaces,
      allNamespaces:    [],
      defaultNamespace: '',
    });
    const wrapper = shallowMount(WorkspaceSwitcher, {
      global: {
        mocks: {
          $store: {
            state,
            getters: { 'prefs/get': () => lastNamespace },
            commit,
            dispatch,
          }
        }
      }
    });

    return {
      wrapper, dispatch, commit, state
    };
  };

  it('should restore a workspace that no longer exists through the store', () => {
    const { dispatch } = mountSwitcher('removed-workspace');

    expect(dispatch).toHaveBeenCalledWith('restoreWorkspace', { value: 'removed-workspace' });
  });

  it('should restore a last-namespace that is not a workspace', () => {
    const { dispatch } = mountSwitcher('', workspaces, 'cattle-system');

    expect(dispatch).toHaveBeenCalledWith('restoreWorkspace', { value: 'cattle-system' });
  });

  it('should leave a workspace that exists alone', () => {
    const { dispatch, commit } = mountSwitcher('fleet-local');

    expect(dispatch).not.toHaveBeenCalled();
    expect(commit).not.toHaveBeenCalled();
  });

  it('should leave the selection alone when no workspaces are known yet', () => {
    const { dispatch, commit } = mountSwitcher('a-workspace', []);

    expect(dispatch).not.toHaveBeenCalled();
    expect(commit).not.toHaveBeenCalled();
  });

  it('should restore through the store when the workspace list arrives without the selection', async() => {
    const { dispatch, state } = mountSwitcher('removed-workspace', []);

    state.allWorkspaces = workspaces;
    await nextTick();

    expect(dispatch).toHaveBeenCalledWith('restoreWorkspace', { value: 'removed-workspace' });
  });

  it('should offer every known workspace as an option', () => {
    const { wrapper } = mountSwitcher('fleet-default');

    expect(wrapper.vm.options).toStrictEqual([
      { label: 'fleet-default', value: 'fleet-default' },
      { label: 'fleet-local', value: 'fleet-local' }
    ]);
  });
});
