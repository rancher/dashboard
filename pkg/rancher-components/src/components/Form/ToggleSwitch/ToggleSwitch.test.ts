import { shallowMount, ThisTypedShallowMountOptions } from '@vue/test-utils';
import { ToggleSwitch } from './index';

const createWrapper = (options?: ThisTypedShallowMountOptions<Vue> | undefined) => shallowMount(ToggleSwitch, options);

describe('ToggleSwitch.vue', () => {
  it('renders falsy by default', () => {
    const wrapper = createWrapper();

    const toggleInput = wrapper.find('input[type="checkbox"]').element as HTMLInputElement

    expect(toggleInput.checked).toBeFalsy();
  });

  it('renders truthy', () => {
    const wrapper = createWrapper(
      {
        propsData: {
          value: true
        }
      });

    const toggleInput = wrapper.find('input[type="checkbox"]').element as HTMLInputElement

    expect(toggleInput.checked).toBeTruthy();
  });

  it('updates from falsy to truthy when props change', async () => {
    const wrapper = createWrapper();
  
    const toggleInput = wrapper.find('input[type="checkbox"]').element as HTMLInputElement

    expect(toggleInput.checked).toBeFalsy();

    await wrapper.setProps({ value: true });
  
    expect(toggleInput.checked).toBeTruthy();
  });

  it('emits an input event with default values when clicked', async () => {
    const wrapper = createWrapper();

    (wrapper.vm as any).toggle(true);

    await wrapper.vm.$nextTick();

    expect(wrapper.emitted().input).toBeTruthy()
    expect(wrapper.emitted().input?.length).toBe(1);
    expect(wrapper.emitted().input?.[0][0]).toBe(true);

    (wrapper.vm as any).toggle(false);

    await wrapper.vm.$nextTick();

    expect(wrapper.emitted('input')).toBeTruthy();
    expect(wrapper.emitted().input?.length).toBe(2);
    expect(wrapper.emitted().input?.[1][0]).toBe(false);
  });

  it('emits an input event with custom values when clicked', async () => {
    const onValue = 'THE TRUTH';
    const offValue = 'NOT THE TRUTH';

    const wrapper = createWrapper(
      {
        propsData: {
          onValue,
          offValue,
        }
      });

    (wrapper.vm as any).toggle(true);

    await wrapper.vm.$nextTick();

    expect(wrapper.emitted().input).toBeTruthy()
    expect(wrapper.emitted().input?.length).toBe(1);
    expect(wrapper.emitted().input?.[0][0]).toBe(onValue);

    (wrapper.vm as any).toggle(false);

    await wrapper.vm.$nextTick();

    expect(wrapper.emitted('input')).toBeTruthy();
    expect(wrapper.emitted().input?.length).toBe(2);
    expect(wrapper.emitted().input?.[1][0]).toBe(offValue);
  });
});

