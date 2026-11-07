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
  projectId?: string;
  metadata?: { creationTimestamp: string };
}

interface Column {
  name: string;
  value: string | ((row: Binding) => string);
}

interface UserDetail {
  $el: HTMLElement;
  $nextTick: () => Promise<void>;
  globalBindings: { id: string, hasBound: boolean, grantedVia: string[] }[];
  clusterBindings: Binding[];
  isAdmin: boolean;
  tableHeaders: { gp: Column[], cr: Column[], pr: Column[] };
}

const globalRoles = [
  { id: 'users-manage', isSpecial: false },
  { id: 'clusters-create', isSpecial: false },
  { id: 'admin', isSpecial: false },
];

// Renders each row's action slot, with a button standing in for the table's default action menu
const SortableTableStub = {
  props:    { rows: { type: Array, default: () => [] }, rowActions: { type: Boolean, default: true } },
  template: `<div><div v-for="(row, i) in rows" :key="i" class="row"><slot v-if="rowActions" name="row-actions" :row="row"><button class="default-row-actions" /></slot></div></div>`,
};

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
    projectRoleBindings = [] as Binding[],
    groups = { [OPS_GROUP]: 'ops' } as Record<string, string>,
    stubs = { ResourceTabs: { template: '<div />' } } as Record<string, object>,
  } = {}): Promise<UserDetail> => {
    const dispatch = jest.fn((action: string, opt: { type?: string, resource?: object }) => {
      if (action === 'rancher/clone') {
        return Promise.resolve({ ...opt.resource });
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
      'i18n/t':             (key: string) => key,
      'i18n/exists':        () => true,
      'management/canList': () => true,
      'management/all':     (type: string) => ({
        [MANAGEMENT.CLUSTER_ROLE_TEMPLATE_BINDING]: clusterRoleBindings,
        [MANAGEMENT.PROJECT_ROLE_TEMPLATE_BINDING]: projectRoleBindings,
      }[type] || []),
    };

    const wrapper = shallowMount(DetailUser, {
      props:  { value: { id: USER_ID, fetchGroupPrincipals: () => Promise.resolve(groups) }, mode: 'view' },
      global: {
        mocks: {
          $store:      { getters, dispatch },
          $route:      { query: {}, params: {} },
          $router:     { applyQuery: jest.fn() },
          $fetchState: { pending: false },
        },
        stubs,
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

  it('only shows direct bindings, without a Granted Via column, when the user has no groups', async() => {
    const vm = await load({
      groups:             {},
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

  it('offers no row actions on cluster and project roles granted through a group', async() => {
    const vm = await load({
      clusterRoleBindings: [{ userName: USER_ID, clusterName: 'c-1' }, { groupPrincipalName: OPS_GROUP, clusterName: 'c-2' }],
      projectRoleBindings: [{ groupPrincipalName: OPS_GROUP, projectId: 'c-1:p-1' }, { userName: USER_ID, projectId: 'c-1:p-2' }],
      stubs:               {
        ResourceTabs:  { template: '<div><slot /></div>' },
        Tab:           { template: '<div><slot /></div>' },
        SortableTable: SortableTableStub,
      },
    });

    await vm.$nextTick();

    const rows = Array.from(vm.$el.querySelectorAll('.row')).slice(globalRoles.length).map((row) => !!row.querySelector('.default-row-actions'));

    // Cluster rows (direct, group), then project rows (group, direct)
    expect(rows).toStrictEqual([true, false, false, true]);
  });
});
