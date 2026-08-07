import { shallowMount } from '@vue/test-utils';
import ListGitRepoRestriction from '@shell/list/fleet.cattle.io.gitreporestriction.vue';
import { Banner } from '@components/Banner';
import PaginatedResourceTable from '@shell/components/PaginatedResourceTable.vue';

const createWrapper = () => {
  return shallowMount(ListGitRepoRestriction, { props: { schema: { id: 'fleet.cattle.io.gitreporestriction' } as any } });
};

describe('list/fleet.cattle.io.gitreporestriction', () => {
  it('should render a deprecation banner', () => {
    const wrapper = createWrapper();

    expect(wrapper.find('[data-testid="git-repo-restriction-deprecation-banner"]').exists()).toBe(true);
  });

  it('should render the deprecation banner with a warning color', () => {
    const wrapper = createWrapper();

    expect(wrapper.findComponent(Banner).props('color')).toStrictEqual('warning');
  });

  it('should render a "learn more" link to the Continuous Delivery Policies docs', () => {
    // renderStubDefaultSlot so the stubbed Banner renders its slot content (the links).
    const wrapper = shallowMount(ListGitRepoRestriction, {
      props:  { schema: { id: 'fleet.cattle.io.gitreporestriction' } as any },
      global: { renderStubDefaultSlot: true },
    });
    const learnMore = wrapper.find('[data-testid="git-repo-restriction-learn-more-policies"]');

    expect(learnMore.exists()).toBe(true);
    // getVersionData() is unset in tests, so the util resolves to the unversioned Policy docs.
    expect(learnMore.html()).toContain('reference/ref-policy');
  });

  it('should link the deprecation notice to the version-aware migration docs', () => {
    const wrapper = shallowMount(ListGitRepoRestriction, {
      props:  { schema: { id: 'fleet.cattle.io.gitreporestriction' } as any },
      global: { renderStubDefaultSlot: true },
    });
    const banner = wrapper.find('[data-testid="git-repo-restriction-deprecation-banner"]');

    // Built by getGitRepoRestrictionMigrationDocsUrl (fallback path in tests).
    expect(banner.html()).toContain('how-tos-for-operators/tenant-setup');
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
