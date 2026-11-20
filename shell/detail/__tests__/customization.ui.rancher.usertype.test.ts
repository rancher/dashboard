import { flushPromises, shallowMount, VueWrapper } from '@vue/test-utils';
import DetailUserType from '@shell/detail/customization.ui.rancher.usertype.vue';
import Banner from '@components/Banner/Banner.vue';
import { MANAGEMENT } from '@shell/config/types';
import { PolicyRule } from '@shell/types/resources/rbac';

const SortableTableStub = {
  props:    { rows: { type: Array, default: () => [] }, headers: { type: Array, default: () => [] } },
  template: '<table><tr v-for="(row, i) in rows" :key="i" class="row" /></table>',
};

const bannerLabelKey = (wrapper: VueWrapper, testId: string) => wrapper.findAllComponents(Banner).find((banner) => banner.attributes('data-testid') === testId)?.props('labelKey');

describe('view: customization.ui.rancher.usertype', () => {
  /**
   * Mount the page and run its fetch, with every tab rendered
   */
  const load = async({
    principalIds = [] as string[],
    rules = [] as PolicyRule[],
    canListBindings = true,
  } = {}) => {
    const assignedPrincipalIds = jest.fn(() => Promise.resolve(principalIds));
    const wrapper = shallowMount(DetailUserType, {
      props: {
        value: {
          metadata: { name: 'dev' }, spec: { displayName: 'Developer', rules }, assignedPrincipalIds
        }
      },
      global: {
        mocks: {
          $store:      { getters: { 'i18n/t': (key: string) => key, 'management/canList': (type: string) => canListBindings && type === MANAGEMENT.GLOBAL_ROLE_BINDING } },
          $fetchState: { pending: false },
        },
        stubs: {
          ResourceTabs:  { template: '<div><slot /></div>' },
          Tab:           { props: ['name'], template: '<section :data-tab="name"><slot /></section>' },
          SortableTable: SortableTableStub,
        },
      },
    });

    await (wrapper.vm.$options as { fetch: () => Promise<void> }).fetch.call(wrapper.vm);
    await flushPromises();

    return { wrapper, assignedPrincipalIds };
  };

  describe('users & groups', () => {
    it('should list the user type\'s users and groups, under a note', async() => {
      const { wrapper } = await load({ principalIds: ['local://u-alice', 'github_org://devops'] });

      expect(bannerLabelKey(wrapper, 'usertype-detail-assignments-note')).toBe('userType.detail.assignmentsNote');
      expect(wrapper.findAll('[data-testid="usertype-detail-assignments"] principal-stub').map((p) => p.attributes('value'))).toStrictEqual(['local://u-alice', 'github_org://devops']);
    });

    it('should say when nobody is assigned', async() => {
      const { wrapper } = await load();

      expect(wrapper.find('[data-testid="usertype-detail-no-assignments"]').text()).toContain('userType.detail.noAssignments');
    });

    it('should hide the tab, and not look the users up, when the viewer can\'t list global role bindings', async() => {
      const { wrapper, assignedPrincipalIds } = await load({ canListBindings: false });

      expect(wrapper.find('[data-tab="assignments"]').exists()).toBe(false);
      expect(assignedPrincipalIds).not.toHaveBeenCalled();
    });
  });

  describe('resource permissions', () => {
    it('should show the rules in a table without a non-resource URLs column, under a note', async() => {
      const { wrapper } = await load({
        rules: [{
          apiGroups: ['apps'], resources: ['deployments'], verbs: ['create']
        }]
      });
      const table = wrapper.findComponent(SortableTableStub);

      expect(bannerLabelKey(wrapper, 'usertype-detail-rules-note')).toBe('userType.resourcePermissions.description');
      expect(table.exists()).toBe(true);
      expect(table.findAll('.row')).toHaveLength(1);
      expect(table.props('headers')).not.toContainEqual(expect.objectContaining({ name: 'url' }));
    });

    it('should say when there are no rules', async() => {
      const { wrapper } = await load();

      expect(wrapper.find('[data-testid="usertype-detail-rules"]').exists()).toBe(false);
      expect(wrapper.find('[data-testid="usertype-detail-no-rules"]').text()).toContain('userType.detail.noRules');
    });
  });
});
