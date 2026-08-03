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
          RcSection: { template: '<div><slot /></div>' },
          RcIcon:    true,
          Tab:       { template: '<div><slot /></div>' },
          Tabbed:    { template: '<div><slot /></div>' },
        }
      }
    });
  };

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
});
