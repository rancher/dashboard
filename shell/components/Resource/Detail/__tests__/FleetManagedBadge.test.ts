import { shallowMount } from '@vue/test-utils';
import { createStore } from 'vuex';
import FleetManagedBadge from '@shell/components/Resource/Detail/FleetManagedBadge.vue';
import { BadgeState } from '@components/BadgeState';
import { FLEET } from '@shell/config/labels-annotations';

const createWrapper = (resource?: object) => shallowMount(FleetManagedBadge, {
  props:  { resource },
  global: { plugins: [createStore({})] }
});

describe('component: FleetManagedBadge', () => {
  it('should render a badge with the Fleet icon when the resource is managed by Fleet', () => {
    const wrapper = createWrapper({ metadata: { labels: { [FLEET.MANAGED_BY_KIND]: 'gitrepo' } } });
    const badge = wrapper.findComponent(BadgeState);

    expect(badge.exists()).toBe(true);
    expect(badge.props('icon')).toStrictEqual('icon-fleet');
    expect(badge.props('label')).toStrictEqual('%resourceDetail.masthead.fleetManagedBadge%');
  });

  it.each([
    ['no resource', undefined],
    ['no labels', { metadata: {} }],
    ['only unrelated labels', { metadata: { labels: { [FLEET.MANAGED]: 'true' } } }],
  ])('should not render when the resource has %s', (_, resource) => {
    const wrapper = createWrapper(resource);

    expect(wrapper.findComponent(BadgeState).exists()).toBe(false);
  });
});
