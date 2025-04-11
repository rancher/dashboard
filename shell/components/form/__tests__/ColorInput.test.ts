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

  it('a11y: adding ARIA props should correctly fill out the appropriate fields on the component', () => {
    const label = 'some-label';
    const describeById = 'some-id';

    const wrapper = shallowMount(ColorInput, {
      props: { label },
      attrs: { 'aria-describedby': describeById }
    });

    const colorInput = wrapper.find('input');
    const ariaDisabled = colorInput.attributes('aria-disabled');
    const ariaLabel = colorInput.attributes('aria-label');
    const ariaDescribedBy = colorInput.attributes('aria-describedby');

    expect(ariaDisabled).toBe('false');
    expect(ariaLabel).toBe(label);
    expect(ariaDescribedBy).toBe(describeById);
  });

  it('a11y: adding aria-label ($attrs) from parent should override label-based aria-label', () => {
    const inputLabel = 'some-label';
    const overrideLabel = 'some-override-label';

    const wrapper = shallowMount(ColorInput, {
      props: { label: inputLabel },
      attrs: { 'aria-label': overrideLabel }
    });

    const colorInput = wrapper.find('input');
    const ariaLabel = colorInput.attributes('aria-label');

    expect(ariaLabel).toBe(overrideLabel);
    expect(ariaLabel).not.toBe(inputLabel);
  });
});
