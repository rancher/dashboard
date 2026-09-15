import { mount } from '@vue/test-utils';
import WorkspaceSwitcher from '@shell/components/nav/WorkspaceSwitcher.vue';

describe('component: WorkspaceSwitcher', () => {
  const workspaces = [
    { id: 'fleet-default', nameDisplay: 'fleet-default' },
    { id: 'fleet-local', nameDisplay: 'fleet-local' }
  ];

  const mountSwitcher = (workspace: string, dispatch = jest.fn()) => {
    const wrapper = mount(WorkspaceSwitcher, {
      global: {
        mocks: {
          $store: {
            state: {
              workspace,
              allWorkspaces:    workspaces,
              allNamespaces:    [],
              defaultNamespace: '',
            },
            getters: { 'prefs/get': () => '' },
            commit:  jest.fn(),
            dispatch,
          }
        },
        stubs: { Select: true }
      }
    });

    return { wrapper, dispatch };
  };

  it('should restore the workspace through the store when mounted', () => {
    const { dispatch } = mountSwitcher('fleet-local');

    expect(dispatch).toHaveBeenCalledWith('restoreWorkspace', { value: 'fleet-local' });
  });

  it('should restore a workspace that no longer exists, so a deleted one is not kept', () => {
    const { dispatch } = mountSwitcher('removed-workspace');

    expect(dispatch).toHaveBeenCalledWith('restoreWorkspace', { value: 'removed-workspace' });
  });

  it('should offer every known workspace as an option', () => {
    const { wrapper } = mountSwitcher('fleet-default');

    expect((wrapper.vm as any).options).toStrictEqual([
      { label: 'fleet-default', value: 'fleet-default' },
      { label: 'fleet-local', value: 'fleet-local' }
    ]);
  });
});
