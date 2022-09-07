import { shallowMount } from '@vue/test-utils';
import { ToggleSwitch } from './index';

describe('ToggleSwitch.vue', () => {
  it('renders falsy by default', () => {
    const wrapper = shallowMount(ToggleSwitch);

    const toggleInput = wrapper.find('input[type="checkbox"]').element as HTMLInputElement

    expect(toggleInput.checked).toBeFalsy();
  });

  it('renders a true value', () => {
    const wrapper = shallowMount(
      ToggleSwitch,
      {
        propsData: {
          value: true
        }
      });

    const toggleInput = wrapper.find('input[type="checkbox"]').element as HTMLInputElement

    expect(toggleInput.checked).toBe(true);
  });

  it('updates from falsy to truthy when props change', async () => {
    const wrapper = shallowMount(ToggleSwitch);
  
    const toggleInput = wrapper.find('input[type="checkbox"]').element as HTMLInputElement

    expect(toggleInput.checked).toBe(false);

    await wrapper.setProps({ value: true });
  
    expect(toggleInput.checked).toBe(true);
  });

  it('emits an input event with a true value', async () => {
    const wrapper = shallowMount(ToggleSwitch);

    (wrapper.vm as any).toggle(true);

    await wrapper.vm.$nextTick();

    expect(wrapper.emitted().input?.length).toBe(1);
    expect(wrapper.emitted().input?.[0][0]).toBe(true);

  });

  it('emits an input event with a false value', async () => {
    const wrapper = shallowMount(
      ToggleSwitch,
      {
        propsData: {
          value: true
        }
      }
    );

    (wrapper.vm as any).toggle(false);

    await wrapper.vm.$nextTick();

    expect(wrapper.emitted().input?.length).toBe(1);
    expect(wrapper.emitted().input?.[0][0]).toBe(false);
  })

  it('emits an input event with a custom onValue', async () => {
    const onValue = 'THE TRUTH';

    const wrapper = shallowMount(
      ToggleSwitch,
      {
        propsData: {
          onValue,
        }
      });

    (wrapper.vm as any).toggle(true);

    await wrapper.vm.$nextTick();

    expect(wrapper.emitted().input?.length).toBe(1);
    expect(wrapper.emitted().input?.[0][0]).toBe(onValue);
  });

  it('emits an input event with a custom offValue', async () => {
    const offValue = 'NOT THE TRUTH';

    const wrapper = shallowMount(
      ToggleSwitch,
      {
        propsData: {
          value: true,
          offValue,
        }
      });

    (wrapper.vm as any).toggle(false);

    await wrapper.vm.$nextTick();

    expect(wrapper.emitted().input?.length).toBe(1);
    expect(wrapper.emitted().input?.[0][0]).toBe(offValue);
  })
});
