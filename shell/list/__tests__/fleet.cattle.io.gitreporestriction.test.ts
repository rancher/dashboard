import { shallowMount } from '@vue/test-utils';
import { createStore } from 'vuex';
import ListGitRepoRestriction from '@shell/list/fleet.cattle.io.gitreporestriction.vue';
import { Banner } from '@components/Banner';
import PaginatedResourceTable from '@shell/components/PaginatedResourceTable.vue';

// The component reads useStore()/useI18n(store) at setup; provide a minimal Vuex store so it mounts in a
// realistic state (no "injection store not found" warning) and stub RouterLink for the deprecation banner.
const store = createStore({ getters: { 'i18n/t': () => (key: string) => key } });

const createWrapper = () => shallowMount(ListGitRepoRestriction, {
  props:  { schema: { id: 'fleet.cattle.io.gitreporestriction' } as any },
  global: { plugins: [store], stubs: { RouterLink: true } },
});

describe('list/fleet.cattle.io.gitreporestriction', () => {
  it('should render a deprecation banner', () => {
    const wrapper = createWrapper();

    expect(wrapper.find('[data-testid="git-repo-restriction-deprecation-banner"]').exists()).toBe(true);
  });

  it('should render the deprecation banner with a warning color', () => {
    const wrapper = createWrapper();

    expect(wrapper.findComponent(Banner).props('color')).toStrictEqual('warning');
  });

  // Render RichTranslation's named slots (shallowMount would otherwise leave them unrendered) so we can
  // assert the links interpolated into the deprecation ("Policies") and migration-guide messages.
  const richTranslationStub = { template: `<div><slot name="policiesLink" :content="'Policies'" /><slot name="docsLink" :content="'guide'" /></div>` };
  const routerLinkStub = { props: ['to'], template: '<a class="router-link-stub"><slot /></a>' };

  const mountWithSlots = () => shallowMount(ListGitRepoRestriction, {
    props:  { schema: { id: 'fleet.cattle.io.gitreporestriction' } as any },
    global: {
      plugins:               [store],
      renderStubDefaultSlot: true,
      stubs:                 { RichTranslation: richTranslationStub, RouterLink: routerLinkStub },
    },
  });

  it('routes the "Policies" link to the in-app Fleet Policies list', () => {
    const link = mountWithSlots().findComponent(routerLinkStub);

    expect(link.exists()).toBe(true);
    expect(link.props('to')).toStrictEqual({
      name:   'c-cluster-product-resource',
      params: {
        cluster: '_', product: 'fleet', resource: 'fleet.cattle.io.policy'
      },
    });
  });

  it('links the migration guide to the version-aware migration docs', () => {
    const link = mountWithSlots().find('.migration-guide-link');

    expect(link.exists()).toBe(true);
    // getGitRepoRestrictionMigrationDocsUrl resolves to the fallback path in tests.
    expect(link.attributes('href')).toContain('how-tos-for-operators/tenant-setup');
  });

  it('should render the paginated resource table alongside the banner', () => {
    const wrapper = createWrapper();

    expect(wrapper.findComponent(PaginatedResourceTable).exists()).toBe(true);
  });

  it('should pass the schema through to the paginated resource table', () => {
    const wrapper = createWrapper();

    expect(wrapper.findComponent(PaginatedResourceTable).props('schema')).toStrictEqual({ id: 'fleet.cattle.io.gitreporestriction' });
  });
});
