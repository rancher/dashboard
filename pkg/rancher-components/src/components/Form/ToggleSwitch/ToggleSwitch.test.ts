import { shallowMount, VueWrapper } from '@vue/test-utils';
import { ToggleSwitch } from './index';

describe('toggleSwitch.vue', () => {
  it('renders falsy by default', () => {
    const wrapper = shallowMount(ToggleSwitch);

    const toggleInput = wrapper.find('input[type="checkbox"]').element as HTMLInputElement;

    expect(toggleInput.checked).toBeFalsy();
  });

  it('renders a true value', () => {
    const wrapper = shallowMount(
      ToggleSwitch,
      { props: { value: true } });

    const toggleInput = wrapper.find('input[type="checkbox"]').element as HTMLInputElement;

    expect(toggleInput.checked).toBe(true);
  });

  it('updates from falsy to truthy when props change', async() => {
    const wrapper = shallowMount(ToggleSwitch);

    const toggleInput = wrapper.find('input[type="checkbox"]').element as HTMLInputElement;

    expect(toggleInput.checked).toBe(false);

    await wrapper.setProps({ value: true });

    expect(toggleInput.checked).toBe(true);
  });

  it('emits an input event with a true value', async() => {
    const wrapper: VueWrapper<InstanceType<typeof ToggleSwitch>> = shallowMount(ToggleSwitch);

    wrapper.vm.toggle(true);

    await wrapper.vm.$nextTick();

    const emitted = wrapper.emitted('update:value') as [boolean][];

    expect(emitted).toHaveLength(1);
    expect(emitted[0][0]).toBe(true);
  });

  it('emits an input event with a false value', async() => {
    const wrapper: VueWrapper<InstanceType<typeof ToggleSwitch>> = shallowMount(
      ToggleSwitch,
      { props: { value: true } }
    );

    wrapper.vm.toggle(false);

    await wrapper.vm.$nextTick();

    const emitted = wrapper.emitted('update:value') as [boolean][];

    expect(emitted).toHaveLength(1);
    expect(emitted[0][0]).toBe(false);
  });

  it('emits an input event with a custom onValue', async() => {
    const onValue = 'THE TRUTH';

    const wrapper: VueWrapper<InstanceType<typeof ToggleSwitch>> = shallowMount(
      ToggleSwitch,
      { props: { onValue } });

    wrapper.vm.toggle(true);

    await wrapper.vm.$nextTick();

    const emitted = wrapper.emitted('update:value') as [string][];

    expect(emitted).toHaveLength(1);
    expect(emitted[0][0]).toBe(onValue);
  });

  it('emits an input event with a custom offValue', async() => {
    const offValue = 'NOT THE TRUTH';

    const wrapper: VueWrapper<InstanceType<typeof ToggleSwitch>> = shallowMount(
      ToggleSwitch,
      {
        props: {
          value: true,
          offValue,
        }
      });

    wrapper.vm.toggle(false);

    await wrapper.vm.$nextTick();

    const emitted = wrapper.emitted('update:value') as [string][];

    expect(emitted).toHaveLength(1);
    expect(emitted[0][0]).toBe(offValue);
  });

  it('adds focus class when input is focused', async() => {
    const wrapper = shallowMount(ToggleSwitch);

    await wrapper.find('input').trigger('focus');

    expect(wrapper.find('.slider').classes()).toContain('focus');
  });

  it('removes focus class when input is blurred', async() => {
    const wrapper = shallowMount(ToggleSwitch);

    await wrapper.find('input').trigger('focus');
    await wrapper.find('input').trigger('blur');

    expect(wrapper.find('.slider').classes()).not.toContain('focus');
  });

  // The container only stops the mouse, so without this the input stays in the
  // tab order and a keyboard user can work a switch a mouse user cannot.
  describe('when disabled', () => {
    it('disables the underlying checkbox', () => {
      const wrapper = shallowMount(ToggleSwitch, { props: { disabled: true } });

      const toggleInput = wrapper.find('input[type="checkbox"]').element as HTMLInputElement;

      expect(toggleInput.disabled).toBe(true);
    });

    it('leaves the checkbox enabled by default', () => {
      const wrapper = shallowMount(ToggleSwitch);

      const toggleInput = wrapper.find('input[type="checkbox"]').element as HTMLInputElement;

      expect(toggleInput.disabled).toBe(false);
    });

    it('does not emit when the input is driven anyway', async() => {
      const wrapper = shallowMount(ToggleSwitch, { props: { disabled: true } });

      await wrapper.find('input').trigger('input');

      expect(wrapper.emitted('update:value')).toBeUndefined();
    });

    it.each([
      ['on', true],
      ['off', false],
    ])('does not emit when the %s label is clicked', async(_label, value) => {
      const wrapper: VueWrapper<InstanceType<typeof ToggleSwitch>> = shallowMount(ToggleSwitch, { props: { disabled: true } });

      wrapper.vm.toggle(value);

      await wrapper.vm.$nextTick();

      expect(wrapper.emitted('update:value')).toBeUndefined();
    });

    it('keeps showing the value it was given', async() => {
      const wrapper: VueWrapper<InstanceType<typeof ToggleSwitch>> = shallowMount(ToggleSwitch, { props: { disabled: true, value: true } });

      wrapper.vm.toggle(false);

      await wrapper.vm.$nextTick();

      expect((wrapper.find('input[type="checkbox"]').element as HTMLInputElement).checked).toBe(true);
    });
  });
});
