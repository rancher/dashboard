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
  groupPrincipalName?: string;
}

interface RoleChanges {
  addRoles: string[];
  removeBindings: string[];
}

interface GlobalRoleBindingsVm {
  selectedRoles: string[];
  groupRoles: Record<string, string[]>;
  checkboxChanged: () => void;
  roleChanges: RoleChanges;
}

describe('component: GlobalRoleBindings', () => {
  /**
   * Mount the user's form and run its fetch
   */
  const load = async({ globalRoleBindings = [] as Binding[], groups = { [OPS_GROUP]: 'ops' } as Record<string, string> } = {}) => {
    const user = { id: USER_ID, fetchGroupPrincipals: () => Promise.resolve(groups) };
    const dispatch = jest.fn((action: string, opt: { type?: string }) => {
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
});
