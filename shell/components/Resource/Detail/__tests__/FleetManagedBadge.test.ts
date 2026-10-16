import { shallowMount } from '@vue/test-utils';
import FleetManagedBadge from '@shell/components/Resource/Detail/FleetManagedBadge.vue';
import { FLEET } from '@shell/config/labels-annotations';

const createWrapper = (resource?: object) => shallowMount(FleetManagedBadge, { props: { resource } });

const findBadge = (wrapper: ReturnType<typeof createWrapper>) => wrapper.find('[data-testid="fleet-managed-badge"]');

describe('component: FleetManagedBadge', () => {
  it('should render a badge with the Fleet icon when the resource is managed by Fleet', () => {
    const wrapper = createWrapper({ metadata: { labels: { [FLEET.MANAGED_BY_KIND]: 'gitrepo' } } });
    const badge = findBadge(wrapper);

    expect(badge.exists()).toBe(true);
    expect(badge.find('i').classes()).toContain('icon-fleet-alt');
    expect(badge.text()).toStrictEqual('%resourceDetail.masthead.fleetManagedBadge%');
  });

  it.each([
    ['no resource', undefined],
    ['no labels', { metadata: {} }],
    ['only unrelated labels', { metadata: { labels: { [FLEET.MANAGED]: 'true' } } }],
  ])('should not render when the resource has %s', (_, resource) => {
    const wrapper = createWrapper(resource);

    expect(findBadge(wrapper).exists()).toBe(false);
  });
});
