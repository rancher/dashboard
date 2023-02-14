import { shallowMount, mount } from '@vue/test-utils';
import ChartPsp from '@shell/components/ChartPsp.vue';

describe('component: ChartPsp', () => {
  it.each([[
    { global: { cattle: { psp: { enabled: true } } } }, true
  ], [{ global: { cattle: { psp: { enabled: false } } } }, false]])('should render checkbox referencing value.global.cattle.psp.enabled', (chartValue, checkboxValue) => {
    const wrapper = shallowMount(ChartPsp, { propsData: { value: chartValue } });

    expect(wrapper.findComponent({ name: 'Checkbox' }).props().value).toBe(checkboxValue);
  });

  it('should update value.global.cattle.psp.enabled when checkbox is toggled', async() => {
    const chartValues = { global: {} } as any;
    const wrapper = mount(ChartPsp, { propsData: { value: chartValues } });

    await wrapper.find('.checkbox-container').trigger('click');

    expect(chartValues.global.cattle.psp.enabled).toBe(true);

    await wrapper.find('.checkbox-container').trigger('click');
    expect(chartValues.global.cattle.psp.enabled).toBe(false);
  });

  it('should define cattle.psp.enabled and set to false if not present in value.global', () => {
    const chartValues = { global: {} } as any;

    shallowMount(ChartPsp, { propsData: { value: chartValues } });

    expect(chartValues.global.cattle.psp.enabled).toBe(false);
  });
});
