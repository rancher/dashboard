import { mount } from '@vue/test-utils';
import RcInputUnit from './RcInputUnit.vue';

const mountUnit = (props: Record<string, unknown> = {}) => mount(RcInputUnit, { props: { unit: 'MiB', ...props } });

describe('component: RcInputUnit', () => {
  it('renders the unit after the input', () => {
    const wrapper = mountUnit();

    expect(wrapper.find('.rc-input-unit').text()).toStrictEqual('MiB');
  });

  it('describes the input by its unit', () => {
    const wrapper = mountUnit();
    const unitId = wrapper.find('.rc-input-unit').attributes('id');

    expect(wrapper.find('input').attributes('aria-describedby')).toStrictEqual(unitId);
  });

  it('describes the input by its helper text and then its unit', () => {
    const wrapper = mountUnit({ id: 'memory', helperText: 'Per container' });
    const unitId = wrapper.find('.rc-input-unit').attributes('id');

    expect(wrapper.find('input').attributes('aria-describedby')).toStrictEqual(`memory-helper ${ unitId }`);
  });

  it.each(['small', 'medium', 'large'])('sizes the unit to a %s field', (size) => {
    const wrapper = mountUnit({ size });

    expect(wrapper.find('.rc-input-unit').classes()).toContain(`rc-input-unit-${ size }`);
  });

  it('emits a number with the number modifier', async() => {
    const wrapper = mountUnit({
      type: 'number', modelValue: 0, modelModifiers: { number: true }
    });

    await wrapper.find('input').setValue('512');

    expect(wrapper.emitted('update:modelValue')).toStrictEqual([[512]]);
  });

  it('renders the unit inline after the value in view mode', () => {
    const wrapper = mountUnit({ mode: 'view', modelValue: 512 });

    expect(wrapper.find('.rc-field-box').text()).toStrictEqual('512MiB');
    expect(wrapper.find('.rc-input-view-value + .rc-input-unit').exists()).toBe(true);
  });
});
