import { shallowMount } from '@vue/test-utils';
import FleetManagedBanner from '@shell/components/Resource/Detail/FleetManagedBanner.vue';
import { Banner } from '@components/Banner';
import { FLEET } from '@shell/config/labels-annotations';

describe('component: FleetManagedBanner', () => {
  it.each([
    ['gitrepo'],
    ['helmop'],
    ['bundle'],
  ])('should render an info banner when the resource is managed by a Fleet %p', (kind) => {
    const resource = { metadata: { labels: { [FLEET.MANAGED_BY_KIND]: kind } } };

    const wrapper = shallowMount(FleetManagedBanner, { props: { resource } });
    const banner = wrapper.findComponent(Banner);

    expect(banner.exists()).toBe(true);
    expect(banner.props('color')).toStrictEqual('info');
    expect(banner.props('labelKey')).toStrictEqual('resourceDetail.masthead.fleetManaged');
  });

  it.each([
    ['no resource', undefined],
    ['no metadata', {}],
    ['no labels', { metadata: {} }],
    ['only unrelated labels', { metadata: { labels: { [FLEET.MANAGED]: 'true', 'app.kubernetes.io/managed-by': 'Helm' } } }],
  ])('should not render when the resource has %s', (_, resource) => {
    const wrapper = shallowMount(FleetManagedBanner, { props: { resource } });

    expect(wrapper.findComponent(Banner).exists()).toBe(false);
  });
});
