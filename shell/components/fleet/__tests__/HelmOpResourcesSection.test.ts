import { shallowMount } from '@vue/test-utils';
import HelmOpResourcesSection from '@shell/components/fleet/HelmOpResourcesSection.vue';
import { _EDIT } from '@shell/config/query-params';

describe('component: HelmOpResourcesSection', () => {
  const props = {
    value:                    { metadata: { namespace: 'fleet-default' }, spec: { keepResources: false } },
    mode:                     _EDIT,
    correctDriftEnabled:      false,
    downstreamSecretsList:    ['secret-1'],
    downstreamConfigMapsList: ['cm-1'],
  };

  it('should render the section container', () => {
    const wrapper = shallowMount(HelmOpResourcesSection, { props });

    expect(wrapper.find('[data-testid="helmop-resources-section"]').exists()).toBe(true);
  });

  it('should emit update:correct-drift when checkbox changes', () => {
    const wrapper = shallowMount(HelmOpResourcesSection, { props });

    wrapper.findComponent({ name: 'Checkbox' }).vm.$emit('update:value', true);

    expect(wrapper.emitted('update:correct-drift')?.[0]).toStrictEqual([true]);
  });

  it('should emit update:downstream-resources when FleetSecretSelector emits', () => {
    const wrapper = shallowMount(HelmOpResourcesSection, { props });

    wrapper.findComponent({ name: 'FleetSecretSelector' }).vm.$emit('update:value', ['s1', 's2']);

    expect(wrapper.emitted('update:downstream-resources')?.[0]).toStrictEqual([{ kind: 'Secret', list: ['s1', 's2'] }]);
  });

  it('should emit update:downstream-resources for ConfigMap', () => {
    const wrapper = shallowMount(HelmOpResourcesSection, { props });

    wrapper.findComponent({ name: 'FleetConfigMapSelector' }).vm.$emit('update:value', ['cm-a']);

    expect(wrapper.emitted('update:downstream-resources')?.[0]).toStrictEqual([{ kind: 'ConfigMap', list: ['cm-a'] }]);
  });
});
