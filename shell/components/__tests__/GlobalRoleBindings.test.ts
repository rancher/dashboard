import { shallowMount } from '@vue/test-utils';
import GlobalRoleBindings from '@shell/components/GlobalRoleBindings.vue';
import { MANAGEMENT } from '@shell/config/types';
import { _EDIT } from '@shell/config/query-params';

const USER_ID = 'u-alice';
const OPS_GROUP = 'openldap_group://cn=ops,ou=Groups,dc=example,dc=test';
const OTHER_GROUP = 'openldap_group://cn=other,ou=Groups,dc=example,dc=test';

const loginRule = {
  apiGroups: ['management.cattle.io'], resources: ['preferences'], verbs: ['get', 'list', 'watch']
};

const globalRoles = [
  {
    id: 'user', nameDisplay: 'Standard User', builtin: true, rules: [loginRule]
  },
  {
    id: 'users-manage', nameDisplay: 'Manage Users', builtin: true, rules: []
  },
  {
    id: 'clusters-create', nameDisplay: 'Create new Clusters', builtin: true, rules: []
  },
];

interface Binding {
  id: string;
  globalRoleName: string;
  userName?: string;
  groupPrincipalName?: string;
}

interface RoleChanges {
  addRoles: string[];
  removeBindings: string[];
}

interface GlobalRoleBindingsVm {
  selectedRoles: string[];
  groupRoles: Record<string, string[]>;
  isGroupOnlyRole: (roleId: string) => boolean;
  checkboxChanged: () => void;
  roleChanges: RoleChanges;
}

describe('component: GlobalRoleBindings', () => {
  /**
   * Mount the user's form and run its fetch
   */
  const load = async({ globalRoleBindings = [] as Binding[], canSeeUserAttributes = true } = {}) => {
    const dispatch = jest.fn((action: string, opt: { type?: string }) => {
      if (action === 'management/find' && opt.type === MANAGEMENT.USER_ATTRIBUTE) {
        return Promise.resolve({ GroupPrincipals: { openldap: { Items: [{ metadata: { name: OPS_GROUP }, displayName: 'ops' }] } } });
      }

      if (action === 'management/findAll') {
        return Promise.resolve(opt.type === MANAGEMENT.GLOBAL_ROLE ? globalRoles : globalRoleBindings);
      }

      return Promise.resolve({});
    });

    const wrapper = shallowMount(GlobalRoleBindings, {
      props: {
        type: 'user', userId: USER_ID, mode: _EDIT, realMode: _EDIT
      },
      global: {
        mocks: {
          $store: {
            dispatch,
            getters: {
              'i18n/t':               (key: string) => key,
              'management/schemaFor': (type: string) => (type === MANAGEMENT.USER_ATTRIBUTE && !canSeeUserAttributes ? null : { id: type }),
            },
          },
          $fetchState: { pending: false },
        },
      },
    });

    await (wrapper.vm.$options as { fetch: () => Promise<void> }).fetch.call(wrapper.vm);

    return { wrapper, vm: wrapper.vm as unknown as GlobalRoleBindingsVm };
  };

  it('checks and disables a role that is only bound to one of the user\'s groups', async() => {
    const { vm } = await load({
      globalRoleBindings: [
        {
          id: 'grb-1', globalRoleName: 'user', userName: USER_ID
        },
        {
          id: 'grb-2', globalRoleName: 'users-manage', groupPrincipalName: OPS_GROUP
        },
        {
          id: 'grb-3', globalRoleName: 'clusters-create', groupPrincipalName: OTHER_GROUP
        },
      ]
    });

    expect(vm.selectedRoles).toStrictEqual(['user', 'users-manage']);
    expect(vm.groupRoles).toStrictEqual({ 'users-manage': ['ops'] });
    expect(vm.isGroupOnlyRole('users-manage')).toBe(true);
    expect(vm.isGroupOnlyRole('user')).toBe(false);
  });

  it('keeps a role enabled when it is bound to the user as well as their group', async() => {
    const { vm } = await load({
      globalRoleBindings: [
        {
          id: 'grb-1', globalRoleName: 'users-manage', userName: USER_ID
        },
        {
          id: 'grb-2', globalRoleName: 'users-manage', groupPrincipalName: OPS_GROUP
        },
      ]
    });

    expect(vm.selectedRoles).toStrictEqual(['users-manage']);
    expect(vm.isGroupOnlyRole('users-manage')).toBe(false);
  });

  it('does not report a change or add a user binding for a group role', async() => {
    const { wrapper, vm } = await load({
      globalRoleBindings: [{
        id: 'grb-2', globalRoleName: 'users-manage', groupPrincipalName: OPS_GROUP
      }]
    });

    expect(wrapper.emitted('hasChanges')?.at(-1)).toStrictEqual([false]);
    expect(vm.roleChanges.addRoles).toStrictEqual([]);

    vm.selectedRoles.push('clusters-create');
    vm.checkboxChanged();

    expect(vm.roleChanges.addRoles).toStrictEqual(['clusters-create']);
    expect(vm.roleChanges.removeBindings).toStrictEqual([]);
  });

  it('counts a group role when checking the user can log in', async() => {
    const { wrapper } = await load({
      globalRoleBindings: [{
        id: 'grb-2', globalRoleName: 'user', groupPrincipalName: OPS_GROUP
      }]
    });

    expect(wrapper.emitted('canLogIn')?.at(-1)).toStrictEqual([true]);
  });

  it('only shows the user\'s own roles when the viewer cannot see UserAttributes', async() => {
    const { vm } = await load({
      canSeeUserAttributes: false,
      globalRoleBindings:   [
        {
          id: 'grb-1', globalRoleName: 'user', userName: USER_ID
        },
        {
          id: 'grb-2', globalRoleName: 'users-manage', groupPrincipalName: OPS_GROUP
        },
      ]
    });

    expect(vm.selectedRoles).toStrictEqual(['user']);
    expect(vm.groupRoles).toStrictEqual({});
  });
});
