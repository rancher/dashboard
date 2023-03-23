import { shallowMount, mount } from '@vue/test-utils';
import ChartPsp from '@shell/components/ChartPsp.vue';

describe('component: ChartPsp', () => {
  it.each([
    true, false
  ])('should render checkbox referencing value.global.cattle.psp.enabled as %p', (value) => {
    const version = 'v1.24.11+rke2r1';
    const wrapper = shallowMount(ChartPsp, {
      propsData: {
        value:   { global: { cattle: { psp: { enabled: value } } } },
        cluster: { metadata: { annotations: { 'management.cattle.io/current-cluster-controllers-version': version } } },
      }
    });

    expect(wrapper.findComponent({ name: 'Checkbox' }).props().value).toBe(value);
  });

  it.each([
    ['v1.24.11+rke2r1', true],
    ['v1.24.11+rke2r1', false],
    ['v1.25.11+rke2r1', true],
  ])('should display the checkbox for cluster with k8s version %p and psp.enabled as %p', (version, value) => {
    const wrapper = shallowMount(ChartPsp, {
      propsData: {
        value:   { global: { cattle: { psp: { enabled: value } } } },
        cluster: { metadata: { annotations: { 'management.cattle.io/current-cluster-controllers-version': version } } },
      }
    });

    const input = wrapper.find(`[data-testid="psp-checkbox"]`).element as HTMLInputElement;

    expect(input).toBeDefined();
  });

  it.each([
    ['v1.25.11+rke2r1', false],
  ])('should not display the checkbox for cluster with k8s version %p and psp.enabled as %p', (version, value) => {
    const wrapper = shallowMount(ChartPsp, {
      propsData: {
        value:   { global: { cattle: { psp: { enabled: value } } } },
        cluster: { metadata: { annotations: { 'management.cattle.io/current-cluster-controllers-version': version } } },
      }
    });

    const input = wrapper.find(`[data-testid="psp-checkbox"]`).element as HTMLInputElement;

    expect(input).toBeUndefined();
  });

  it('should display the checkbox after disabling PSP with K8S v1.25+', async() => {
    const wrapper = mount(ChartPsp, {
      propsData: {
        value:   { global: { cattle: { psp: { enabled: true } } } },
        cluster: { metadata: { annotations: { 'management.cattle.io/current-cluster-controllers-version': 'v1.25.11+rke2r1' } } },
      }
    });
    const input = wrapper.find(`[data-testid="psp-checkbox"]`).element as HTMLInputElement;

    await wrapper.find('.checkbox-container').trigger('click');

    expect(input).toBeDefined();
  });

  it('should update value.global.cattle.psp.enabled when checkbox is toggled', async() => {
    const chartValues = { global: {} } as any;
    const version = 'v1.24.11+rke2r1';
    const wrapper = mount(ChartPsp, {
      propsData: {
        value:   chartValues,
        cluster: { metadata: { annotations: { 'management.cattle.io/current-cluster-controllers-version': version } } },
      }
    });

    await wrapper.find('.checkbox-container').trigger('click');

    expect(chartValues.global.cattle.psp.enabled).toBe(true);

    await wrapper.find('.checkbox-container').trigger('click');
    expect(chartValues.global.cattle.psp.enabled).toBe(false);
  });

  it.each([
    { global: {} } as any,
    { global: { cattle: {} } } as any,
  ])('should define cattle.psp.enabled and set to false', (chartValues) => {
    shallowMount(ChartPsp, { propsData: { value: chartValues } });

    expect(chartValues.global.cattle.psp.enabled).toBe(false);
  });
});
