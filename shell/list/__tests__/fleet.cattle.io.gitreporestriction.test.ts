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

  it('should render the paginated resource table alongside the banner', () => {
    const wrapper = createWrapper();

    expect(wrapper.findComponent(PaginatedResourceTable).exists()).toBe(true);
  });

  it('should pass the schema through to the paginated resource table', () => {
    const wrapper = createWrapper();

    expect(wrapper.findComponent(PaginatedResourceTable).props('schema')).toStrictEqual({ id: 'fleet.cattle.io.gitreporestriction' });
  });
});
