import { shallowMount } from '@vue/test-utils';
import ResourceDetails from '@shell/components/fleet/dashboard/ResourceDetails.vue';
import { RcDrawer } from '@components/RcDrawer';

const createWrapper = () => shallowMount(ResourceDetails as any, {
  props: {
    value: {
      id: 'fleet-default/repo', _detailLocation: {}, source: {}
    },
    statePanel: { id: 'success' },
    workspace:  {},
  },
  global: {
    mocks: {
      $store: { getters: { 'management/schemaFor': jest.fn(), 'prefs/theme': 'light' } },
      t:      (key: string) => key,
    },
  },
});

describe('component: FleetDashboardResourceDetails', () => {
  it('should name the drawer after the resource', () => {
    const wrapper = createWrapper();

    expect(wrapper.findComponent(RcDrawer).props('title')).toBe('fleet-default/repo');
  });

  it('should emit close when the drawer is closed', async() => {
    const wrapper = createWrapper();

    await wrapper.findComponent(RcDrawer).vm.$emit('close');

    expect(wrapper.emitted('close')).toHaveLength(1);
  });
});
