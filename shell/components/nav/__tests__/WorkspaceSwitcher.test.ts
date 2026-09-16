import { shallowMount } from '@vue/test-utils';
import WorkspaceSwitcher from '@shell/components/nav/WorkspaceSwitcher.vue';

describe('component: WorkspaceSwitcher', () => {
  const workspaces = [
    { id: 'fleet-default', nameDisplay: 'fleet-default' },
    { id: 'fleet-local', nameDisplay: 'fleet-local' }
  ];

  const mountSwitcher = (workspace: string, allWorkspaces = workspaces) => {
    const dispatch = jest.fn();
    const commit = jest.fn();
    const wrapper = shallowMount(WorkspaceSwitcher, {
      global: {
        mocks: {
          $store: {
            state: {
              workspace,
              allWorkspaces,
              allNamespaces:    [],
              defaultNamespace: '',
            },
            getters: { 'prefs/get': () => '' },
            commit,
            dispatch,
          }
        }
      }
    });

    return {
      wrapper, dispatch, commit
    };
  };

  it('should restore a workspace that no longer exists through the store', () => {
    const { dispatch } = mountSwitcher('removed-workspace');

    expect(dispatch).toHaveBeenCalledWith('restoreWorkspace', { value: 'removed-workspace' });
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

  it('should offer every known workspace as an option', () => {
    const { wrapper } = mountSwitcher('fleet-default');

    expect(wrapper.vm.options).toStrictEqual([
      { label: 'fleet-default', value: 'fleet-default' },
      { label: 'fleet-local', value: 'fleet-local' }
    ]);
  });
});
