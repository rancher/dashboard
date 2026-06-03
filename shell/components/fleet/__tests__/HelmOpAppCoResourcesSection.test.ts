import { shallowMount } from '@vue/test-utils';
import HelmOpAppCoResourcesSection from '@shell/components/fleet/HelmOpAppCoResourcesSection.vue';
import FleetSecretSelector from '@shell/components/fleet/FleetSecretSelector.vue';
import { _EDIT } from '@shell/config/query-params';

describe('component: HelmOpAppCoResourcesSection', () => {
  const props = {
    value:                    { metadata: { namespace: 'fleet-default' }, spec: { keepResources: false } },
    mode:                     _EDIT,
    correctDriftEnabled:      false,
    downstreamSecretsList:    ['secret-1'],
    downstreamConfigMapsList: ['cm-1'],
  };

  const shallowMountWithSlots = (overrides = {}) => {
    return shallowMount(HelmOpAppCoResourcesSection, {
      props: { ...props, ...overrides },
      global: {
        stubs: {
          RcSection: { template: '<div><slot /></div>' },
          RcIcon:    true,
        }
      }
    });
  };

  it('should render the section container', () => {
    const wrapper = shallowMountWithSlots();

    expect(wrapper.find('[data-testid="helmop-appco-resources-section"]').exists()).toBe(true);
  });

  it('should show locked secret banner when lockedSecrets is non-empty', () => {
    const wrapper = shallowMountWithSlots({ lockedSecrets: ['locked-1'] });

    expect(wrapper.find('[data-testid="helmop-appco-resources-locked-secret-banner"]').exists()).toBe(true);
  });

  it('should not show locked secret banner when lockedSecrets is empty', () => {
    const wrapper = shallowMountWithSlots({ lockedSecrets: [] });

    expect(wrapper.find('[data-testid="helmop-appco-resources-locked-secret-banner"]').exists()).toBe(false);
  });

  it('should pass lockedSecrets to FleetSecretSelector as locked-options', () => {
    const lockedSecrets = ['locked-a', 'locked-b'];
    const wrapper = shallowMountWithSlots({ lockedSecrets });

    const selector = wrapper.findComponent(FleetSecretSelector);

    expect(selector.props('lockedOptions')).toStrictEqual(lockedSecrets);
  });

  it('should emit update:correct-drift', () => {
    const wrapper = shallowMountWithSlots();
    const checkbox = wrapper.findComponent({ name: 'Checkbox' });

    checkbox.vm.$emit('update:value', true);

    expect(wrapper.emitted('update:correct-drift')?.[0]).toStrictEqual([true]);
  });
});
