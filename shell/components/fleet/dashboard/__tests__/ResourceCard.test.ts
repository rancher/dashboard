import { shallowMount } from '@vue/test-utils';
import ResourceCard from '@shell/components/fleet/dashboard/ResourceCard.vue';
import suseAppCoLogo from '@shell/assets/images/content/suse.svg';
import suseAppCoLogoDark from '@shell/assets/images/content/dark/suse.svg';

const statePanel = {
  index: 2,
  id:    'success',
  label: 'Active',
  color: '#5D995D',
  icon:  'icon icon-checkmark',
};

const baseValue = {
  type:                'fleet.cattle.io.helmop',
  id:                  'helm-op',
  nameDisplay:         'helm-op',
  metadata:            { namespace: 'fleet-default' },
  dashboardIcon:       'icon icon-helm',
  status:              { desiredReadyClusters: 1 },
  allResourceStatuses: { states: {} },
};

const mountCard = (value: Record<string, unknown>, theme = 'light') => {
  return shallowMount(ResourceCard as any, {
    props:  { value, statePanel },
    global: {
      mocks: {
        $store: {
          getters: {
            'i18n/withFallback': () => '',
            'prefs/theme':       theme,
          }
        }
      },
      stubs: {
        // Render the image slot so we can assert what icon is displayed
        RcItemCard: { template: '<div><slot name="item-card-image" /></div>' },
      },
      directives: { 'clean-tooltip': {} },
    },
  });
};

describe('component: FleetDashboardResourceCard', () => {
  describe('SUSE Application Collection bundles', () => {
    it('renders the SUSE AppCo logo instead of the resource icon glyph', () => {
      const wrapper = mountCard({ ...baseValue, isSuseAppCollectionFromUI: true });

      const img = wrapper.find('img.suse-appco-icon');

      expect(img.exists()).toBe(true);
      expect(wrapper.find('i.icon-lg').exists()).toBe(false);
    });

    it('uses the light logo variant by default', () => {
      const wrapper = mountCard({ ...baseValue, isSuseAppCollectionFromUI: true });

      expect((wrapper.vm as any).suseAppCoIcon).toBe(suseAppCoLogo);
    });

    it('uses the dark logo variant when the dark theme is active', () => {
      const wrapper = mountCard({ ...baseValue, isSuseAppCollectionFromUI: true }, 'dark');

      expect((wrapper.vm as any).suseAppCoIcon).toBe(suseAppCoLogoDark);
    });
  });

  describe('non SUSE Application Collection resources', () => {
    it('renders the default resource icon glyph', () => {
      const wrapper = mountCard({ ...baseValue, isSuseAppCollectionFromUI: false });

      const icon = wrapper.find('i.icon-lg');

      expect(icon.exists()).toBe(true);
      expect(icon.classes()).toContain('icon-helm');
      expect(wrapper.find('img.suse-appco-icon').exists()).toBe(false);
    });

    it('treats a missing isSuseAppCollectionFromUI flag as a non-AppCo resource', () => {
      const wrapper = mountCard({ ...baseValue });

      expect((wrapper.vm as any).isSuseAppCollection).toBe(false);
      expect(wrapper.find('i.icon-lg').exists()).toBe(true);
    });
  });
});
