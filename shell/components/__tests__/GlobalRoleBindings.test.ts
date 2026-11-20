import { nextTick } from 'vue';
import { shallowMount } from '@vue/test-utils';
import GlobalRoleBindings from '@shell/components/GlobalRoleBindings.vue';
import { Checkbox } from '@components/Form/Checkbox';
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
  userPrincipalName?: string;
  groupPrincipalName?: string;
}

interface RoleChanges {
  addRoles: string[];
  removeBindings: string[];
}

interface GlobalRoleBindingsVm {
  selectedRoles: string[];
  startingSelectedRoles: { roleId: string, bindingId: string }[];
  groupRoles: Record<string, string[]>;
  checkboxChanged: () => void;
  roleChanges: RoleChanges;
}

describe('component: GlobalRoleBindings', () => {
  /**
   * Mount the user's form and run its fetch
   */
  const load = async({
    globalRoleBindings = [] as Binding[],
    groups = { [OPS_GROUP]: 'ops' } as Record<string, string>,
    userPrincipalIds = [] as string[],
    roles = globalRoles,
  } = {}) => {
    const user = { id: USER_ID, fetchGroupPrincipals: () => Promise.resolve(groups) };
    const dispatch = jest.fn((action: string, opt: { type?: string }) => {
      if (action === 'management/findAll') {
        return Promise.resolve(opt.type === MANAGEMENT.GLOBAL_ROLE ? roles : globalRoleBindings);
      }

      return Promise.resolve({});
    });

    const wrapper = shallowMount(GlobalRoleBindings, {
      props: {
        type: 'user', userId: USER_ID, userPrincipalIds, mode: _EDIT, realMode: _EDIT
      },
      global: {
        mocks: {
          $store: {
            dispatch,
            getters: {
              'i18n/t':          (key: string) => key,
              'management/byId': (type: string, id: string) => (type === MANAGEMENT.USER && id === USER_ID ? user : undefined),
            },
          },
          $fetchState: { pending: false },
        },
        stubs: { Card: { template: '<div><slot name="title" /><slot name="body" /></div>' } },
      },
    });

    await (wrapper.vm.$options as { fetch: () => Promise<void> }).fetch.call(wrapper.vm);

    return { wrapper, vm: wrapper.vm as unknown as GlobalRoleBindingsVm };
  };

  it('only checks the user\'s own roles and notes the roles bound to their groups', async() => {
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

    expect(vm.selectedRoles).toStrictEqual(['user']);
    expect(vm.groupRoles).toStrictEqual({ 'users-manage': ['ops'] });
  });

  it('checks the roles bound to the user by name and by any of their principals', async() => {
    const { vm } = await load({
      userPrincipalIds:   ['local://u-alice'],
      globalRoleBindings: [
        {
          id: 'grb-name', globalRoleName: 'user', userName: USER_ID
        },
        {
          id: 'grb-principal', globalRoleName: 'users-manage', userPrincipalName: 'local://u-alice'
        },
        {
          id: 'grb-bob', globalRoleName: 'clusters-create', userPrincipalName: 'local://u-bob'
        },
      ]
    });

    expect(vm.selectedRoles).toStrictEqual(['user', 'users-manage']);
    expect(vm.startingSelectedRoles).toStrictEqual([
      { roleId: 'user', bindingId: 'grb-name' },
      { roleId: 'users-manage', bindingId: 'grb-principal' },
    ]);
  });

  it('only checks the roles bound by name when the user\'s principals aren\'t given', async() => {
    const { vm } = await load({
      globalRoleBindings: [
        {
          id: 'grb-name', globalRoleName: 'user', userName: USER_ID
        },
        {
          id: 'grb-principal', globalRoleName: 'users-manage', userPrincipalName: 'local://u-alice'
        },
      ]
    });

    expect(vm.selectedRoles).toStrictEqual(['user']);
  });

  it('adds a user binding when a role the group already grants is checked', async() => {
    const { wrapper, vm } = await load({
      globalRoleBindings: [{
        id: 'grb-2', globalRoleName: 'users-manage', groupPrincipalName: OPS_GROUP
      }]
    });

    expect(wrapper.emitted('hasChanges')?.at(-1)).toStrictEqual([false]);

    vm.selectedRoles.push('users-manage');
    vm.checkboxChanged();

    expect(vm.roleChanges.addRoles).toStrictEqual(['users-manage']);
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

  it('only shows the user\'s own roles when the user has no groups', async() => {
    const { vm } = await load({
      groups:             {},
      globalRoleBindings: [
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

  it('removes only the direct binding when a role the group also grants is unchecked, and the user can still log in', async() => {
    const { wrapper, vm } = await load({
      globalRoleBindings: [
        {
          id: 'grb-1', globalRoleName: 'user', userName: USER_ID
        },
        {
          id: 'grb-2', globalRoleName: 'user', groupPrincipalName: OPS_GROUP
        },
      ]
    });

    vm.selectedRoles.splice(vm.selectedRoles.indexOf('user'), 1);
    vm.checkboxChanged();

    expect(vm.roleChanges.addRoles).toStrictEqual([]);
    expect(vm.roleChanges.removeBindings).toStrictEqual(['grb-1']);
    expect(wrapper.emitted('canLogIn')?.at(-1)).toStrictEqual([true]);
  });

  it('gives every role the user\'s groups grant a tooltip, and disables none of them', async() => {
    const { wrapper } = await load({
      globalRoleBindings: [
        {
          id: 'grb-1', globalRoleName: 'user', userName: USER_ID
        },
        {
          id: 'grb-2', globalRoleName: 'users-manage', groupPrincipalName: OPS_GROUP
        },
        {
          id: 'grb-3', globalRoleName: 'clusters-create', userName: USER_ID
        },
        {
          id: 'grb-4', globalRoleName: 'clusters-create', groupPrincipalName: OPS_GROUP
        },
      ]
    });

    await nextTick();

    const checkboxes = Object.fromEntries(wrapper.findAllComponents(Checkbox).map((c) => [c.props('valueWhenTrue'), { tooltip: c.props('tooltip'), disabled: c.props('disabled') }]));

    expect(checkboxes).toStrictEqual({
      user:              { tooltip: null, disabled: false },
      'users-manage':    { tooltip: 'rbac.globalRoles.groupRole', disabled: false },
      'clusters-create': { tooltip: 'rbac.globalRoles.groupRole', disabled: false },
    });
  });

  describe('user type roles', () => {
    const roles = [
      ...globalRoles,
      {
        id: 'usertype-dev', nameDisplay: 'User Type: Developer', builtin: false, isUserTypeRole: true, rules: []
      },
      {
        id: 'gr-custom', nameDisplay: 'Custom', builtin: false, isUserTypeRole: false, rules: []
      },
    ];

    it('gives a user type\'s role no checkbox, and other custom roles one', async() => {
      const { wrapper } = await load({ roles });

      await nextTick();

      const values = wrapper.findAllComponents(Checkbox).map((c) => c.props('valueWhenTrue'));

      expect(values).toContain('gr-custom');
      expect(values).not.toContain('usertype-dev');
    });

    it('never adds or removes a user type binding when other roles change', async() => {
      const { vm } = await load({
        roles,
        globalRoleBindings: [
          {
            id: 'grb-1', globalRoleName: 'user', userName: USER_ID
          },
          {
            id: 'grb-type', globalRoleName: 'usertype-dev', userName: USER_ID
          },
        ]
      });

      vm.selectedRoles.splice(vm.selectedRoles.indexOf('user'), 1);
      vm.selectedRoles.push('gr-custom');
      vm.checkboxChanged();

      expect(vm.roleChanges.addRoles).toStrictEqual(['gr-custom']);
      expect(vm.roleChanges.removeBindings).toStrictEqual(['grb-1']);
    });
  });
});
