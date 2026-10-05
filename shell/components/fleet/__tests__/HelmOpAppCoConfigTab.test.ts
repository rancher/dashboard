import { defineComponent, h, nextTick } from 'vue';
import { shallowMount } from '@vue/test-utils';
import HelmOpAppCoConfigTab from '@shell/components/fleet/HelmOpAppCoConfigTab.vue';
import HelmOpAppCoResourcesSection from '@shell/components/fleet/HelmOpAppCoResourcesSection.vue';
import { _EDIT } from '@shell/config/query-params';

describe('component: HelmOpAppCoConfigTab', () => {
  const defaultProps = {
    value: {
      metadata: { namespace: 'fleet-default' },
      spec:     { helm: { valuesFrom: [] } },
    },
    mode:               _EDIT,
    realMode:           _EDIT,
    registerBeforeHook: jest.fn(),
  };

  const mountWithSecrets = (downstreamSecretsList: string[]) => {
    return shallowMount(HelmOpAppCoConfigTab, {
      props: {
        ...defaultProps,
        downstreamSecretsList,
      },
      global: {
        stubs: {
          RcSection:      { template: '<div><slot /></div>' },
          RcIcon:         true,
          Tab:            { template: '<div><slot /></div>' },
          Tabbed:         { template: '<div><slot /></div>' },
          RcContentGroup: false,
        }
      }
    });
  };

  describe('deprecated badge', () => {
    const DEPRECATED_BADGE = '[data-testid="appco-config-deprecated-badge"]';

    const mountWithDeprecation = (appCoChartDeprecated: boolean) => {
      return shallowMount(HelmOpAppCoConfigTab, {
        props: {
          ...defaultProps,
          value: {
            metadata: { namespace: 'fleet-default' },
            spec:     { helm: { chart: 'apache-apisix-dashboard', valuesFrom: [] } },
          },
          appCoChartEntries: { 'apache-apisix-dashboard': [{ version: '0.8.3' }] },
          appCoChartDeprecated,
        },
        global: {
          stubs: {
            RcSection:      { template: '<div><slot /></div>' },
            RcIcon:         true,
            Tab:            { template: '<div><slot /></div>' },
            Tabbed:         { template: '<div><slot /></div>' },
            RcContentGroup: false,
          }
        }
      });
    };

    it('should render the deprecated badge when the selected chart is deprecated', () => {
      const wrapper = mountWithDeprecation(true);

      expect(wrapper.find(DEPRECATED_BADGE).exists()).toBe(true);
    });

    it('should not render the deprecated badge when the selected chart is not deprecated', () => {
      const wrapper = mountWithDeprecation(false);

      expect(wrapper.find(DEPRECATED_BADGE).exists()).toBe(false);
    });
  });

  describe('appCoLockedSecrets', () => {
    it('should only lock image pull secrets, not auth secrets', () => {
      const wrapper = mountWithSecrets([
        'fleet-appco-auth-2n9px-image-pull-secret',
        'fleet-appco-auth-2n9px',
      ]);

      const resourcesSection = wrapper.findComponent(HelmOpAppCoResourcesSection);

      expect(resourcesSection.props('lockedSecrets')).toStrictEqual([
        'fleet-appco-auth-2n9px-image-pull-secret',
      ]);
    });

    it('should return empty array when no image pull secrets exist', () => {
      const wrapper = mountWithSecrets([
        'fleet-appco-auth-abc123',
        'some-other-secret',
      ]);

      const resourcesSection = wrapper.findComponent(HelmOpAppCoResourcesSection);

      expect(resourcesSection.props('lockedSecrets')).toStrictEqual([]);
    });
  });

  describe('advanced section expansion', () => {
    const ADVANCED = '[data-testid="appco-config-advanced"]';

    const mountWithValuesTab = (refreshYaml: jest.Mock) => {
      const HelmOpValuesTabStub = defineComponent({
        name: 'HelmOpValuesTab',
        setup(_, { expose }) {
          expose({ refreshYaml });

          return () => h('div');
        },
      });

      return shallowMount(HelmOpAppCoConfigTab, {
        props:  { ...defaultProps },
        global: {
          stubs: {
            RcSection: {
              template: '<div><slot /></div>', props: ['expanded'], emits: ['update:expanded']
            },
            RcIcon:          true,
            Tab:             { template: '<div><slot /></div>' },
            Tabbed:          { template: '<div><slot /></div>' },
            RcContentGroup:  false,
            HelmOpValuesTab: HelmOpValuesTabStub,
          }
        }
      });
    };

    it('should start with the advanced section collapsed', () => {
      const wrapper = mountWithValuesTab(jest.fn());

      expect(wrapper.findComponent(ADVANCED).props('expanded')).toBe(false);
    });

    it('should pass the new expanded state back to the advanced section', async() => {
      const wrapper = mountWithValuesTab(jest.fn());

      wrapper.findComponent(ADVANCED).vm.$emit('update:expanded', true);
      await nextTick();

      expect(wrapper.findComponent(ADVANCED).props('expanded')).toBe(true);
    });

    it('should refresh the values YAML editor when the advanced section is expanded', async() => {
      const refreshYaml = jest.fn();
      const wrapper = mountWithValuesTab(refreshYaml);

      wrapper.findComponent(ADVANCED).vm.$emit('update:expanded', true);
      await nextTick();
      await nextTick();

      expect(refreshYaml).toHaveBeenCalledWith();
    });

    it('should not refresh the values YAML editor when the advanced section is collapsed', async() => {
      const refreshYaml = jest.fn();
      const wrapper = mountWithValuesTab(refreshYaml);

      wrapper.findComponent(ADVANCED).vm.$emit('update:expanded', false);
      await nextTick();
      await nextTick();

      expect(refreshYaml).not.toHaveBeenCalledWith();
    });
  });
});
