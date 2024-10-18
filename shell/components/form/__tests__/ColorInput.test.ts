import { shallowMount } from '@vue/test-utils';
import ColorInput from '@shell/components/form/ColorInput.vue';

describe('colorInput.vue', () => {
  it('disables the input when disabled prop is true', () => {
    const wrapper = shallowMount(
      ColorInput,
      { props: { disabled: true } }
    );

    const colorWrapper = wrapper.find('.color-input');
    const colorInput = wrapper.find('input');

    expect(colorWrapper.classes()).toContain('disabled');
    expect(Object.keys(colorInput.attributes())).toContain('disabled');
  });

  it('defaults to enabled when no disabled prop is passed', () => {
    const wrapper = shallowMount(ColorInput);

    const colorWrapper = wrapper.find('.color-input');
    const colorInput = wrapper.find('input');

    expect(colorWrapper.classes()).not.toContain('disabled');
    expect(Object.keys(colorInput.attributes())).not.toContain('disabled');
  });
});
