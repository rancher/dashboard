import { shallowMount } from '@vue/test-utils';
import DetailUser from '@shell/detail/management.cattle.io.user.vue';
import { MANAGEMENT } from '@shell/config/types';

const USER_ID = 'u-alice';
const OPS_GROUP = 'openldap_group://cn=ops,ou=Groups,dc=example,dc=test';
const OTHER_GROUP = 'openldap_group://cn=other,ou=Groups,dc=example,dc=test';
// The global i18n mock renders a key as %key%
const DIRECT = '%user.detail.generic.direct%';

interface Binding {
  userName?: string;
  groupPrincipalName?: string;
  globalRoleName?: string;
  clusterName?: string;
  metadata?: { creationTimestamp: string };
}

interface Column {
  name: string;
  value: string | ((row: Binding) => string);
}

interface UserDetail {
  globalBindings: { id: string, hasBound: boolean, grantedVia: string[] }[];
  clusterBindings: Binding[];
  isAdmin: boolean;
  tableHeaders: { gp: Column[], cr: Column[], pr: Column[] };
}

const userAttribute = {
  id:              USER_ID,
  GroupPrincipals: {
    local:    { Items: null },
    openldap: { Items: [{ metadata: { name: OPS_GROUP }, displayName: 'ops' }] },
  },
};

const globalRoles = [
  { id: 'users-manage', isSpecial: false },
  { id: 'clusters-create', isSpecial: false },
  { id: 'admin', isSpecial: false },
];

const grb = (globalRoleName: string, subject: Binding): Binding => ({
  globalRoleName,
  ...subject,
  metadata: { creationTimestamp: '2026-10-28T00:00:00Z' },
});

describe('view: management.cattle.io.user', () => {
  /**
   * Mount the page and run its fetch, as the page does before it renders the tabs
   */
  const load = async({
    globalRoleBindings = [] as Binding[],
    clusterRoleBindings = [] as Binding[],
    canSeeUserAttributes = true,
    findUserAttribute = (): Promise<object> => Promise.resolve(userAttribute),
  } = {}): Promise<UserDetail> => {
    const dispatch = jest.fn((action: string, opt: { type?: string, resource?: object }) => {
      if (action === 'rancher/clone') {
        return Promise.resolve({ ...opt.resource });
      }

      if (action === 'management/find' && opt.type === MANAGEMENT.USER_ATTRIBUTE) {
        return findUserAttribute();
      }

      if (action === 'management/findAll') {
        switch (opt.type) {
        case MANAGEMENT.GLOBAL_ROLE:
          return Promise.resolve(globalRoles);
        case MANAGEMENT.GLOBAL_ROLE_BINDING:
          return Promise.resolve(globalRoleBindings);
        default:
          return Promise.resolve([]);
        }
      }

      return Promise.resolve({});
    });

    const getters = {
      'i18n/t':               (key: string) => key,
      'i18n/exists':          () => true,
      'management/canList':   () => true,
      'management/schemaFor': (type: string) => (type === MANAGEMENT.USER_ATTRIBUTE && !canSeeUserAttributes ? null : { id: type }),
      'management/all':       (type: string) => (type === MANAGEMENT.CLUSTER_ROLE_TEMPLATE_BINDING ? clusterRoleBindings : []),
    };

    const wrapper = shallowMount(DetailUser, {
      props:  { value: { id: USER_ID }, mode: 'view' },
      global: {
        mocks: {
          $store:      { getters, dispatch },
          $route:      { query: {}, params: {} },
          $router:     { applyQuery: jest.fn() },
          $fetchState: { pending: false },
        },
        stubs: { ResourceTabs: { template: '<div />' } },
      },
    });

    await (wrapper.vm.$options as { fetch: () => Promise<void> }).fetch.call(wrapper.vm);

    return wrapper.vm as unknown as UserDetail;
  };

  const boundRoles = (vm: UserDetail) => vm.globalBindings.filter((r) => r.hasBound).map((r) => ({ id: r.id, grantedVia: r.grantedVia }));

  it('shows a global role bound to one of the user\'s groups, naming the group', async() => {
    const vm = await load({
      globalRoleBindings: [
        grb('clusters-create', { userName: USER_ID }),
        grb('users-manage', { groupPrincipalName: OPS_GROUP }),
      ]
    });

    expect(boundRoles(vm)).toStrictEqual([
      { id: 'users-manage', grantedVia: ['ops'] },
      { id: 'clusters-create', grantedVia: [DIRECT] },
    ]);
    expect(vm.isAdmin).toBe(false);
  });

  it('lists every source when a role is bound both directly and through a group', async() => {
    const vm = await load({
      globalRoleBindings: [
        grb('users-manage', { userName: USER_ID }),
        grb('users-manage', { groupPrincipalName: OPS_GROUP }),
      ]
    });

    expect(boundRoles(vm)).toStrictEqual([{ id: 'users-manage', grantedVia: [DIRECT, 'ops'] }]);
  });

  it('treats the user as an administrator when the admin role is bound to their group', async() => {
    const vm = await load({ globalRoleBindings: [grb('admin', { groupPrincipalName: OPS_GROUP })] });

    expect(vm.isAdmin).toBe(true);
  });

  it('ignores bindings for groups the user is not in', async() => {
    const vm = await load({ globalRoleBindings: [grb('admin', { groupPrincipalName: OTHER_GROUP })] });

    expect(boundRoles(vm)).toStrictEqual([]);
    expect(vm.isAdmin).toBe(false);
  });

  it.each([
    ['the viewer cannot see UserAttributes', { canSeeUserAttributes: false }],
    ['the user has no UserAttribute', { findUserAttribute: () => Promise.reject(new Error('not found')) }],
  ])('only shows direct bindings, without a Granted Via column, when %s', async(_, opts) => {
    const vm = await load({
      ...opts,
      globalRoleBindings: [
        grb('clusters-create', { userName: USER_ID }),
        grb('users-manage', { groupPrincipalName: OPS_GROUP }),
      ]
    });

    expect(boundRoles(vm)).toStrictEqual([{ id: 'clusters-create', grantedVia: [DIRECT] }]);
    expect(vm.tableHeaders.gp.map((h) => h.name)).not.toContain('grantedVia');
  });

  it('shows cluster roles bound to the user\'s groups with the group in the Granted Via column', async() => {
    const direct = { userName: USER_ID, clusterName: 'c-1' };
    const viaGroup = { groupPrincipalName: OPS_GROUP, clusterName: 'c-2' };
    const otherGroup = { groupPrincipalName: OTHER_GROUP, clusterName: 'c-3' };
    const vm = await load({ clusterRoleBindings: [direct, viaGroup, otherGroup] });

    const column = vm.tableHeaders.cr.find((h) => h.name === 'grantedVia');
    const grantedVia = column?.value as (row: Binding) => string;

    expect(vm.clusterBindings).toStrictEqual([direct, viaGroup]);
    expect(vm.clusterBindings.map(grantedVia)).toStrictEqual([DIRECT, 'ops']);
  });
});
