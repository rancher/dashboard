import { shallowMount } from '@vue/test-utils';
import { Checkbox } from './index';

describe('Checkbox.vue', () => {
  it('is unchecked by default', () => {
    const wrapper = shallowMount(Checkbox);
    const cbInput = wrapper.find('input[type="checkbox"]').element as HTMLInputElement;

    expect(cbInput.checked).toBe(false);
  });

  it('renders a true value', () => {
    const wrapper = shallowMount(Checkbox, { propsData: { value: true } });
    const cbInput = wrapper.find('input[type="checkbox"]').element as HTMLInputElement;

    expect(cbInput.checked).toBe(true);
  });

  it('updates from false to true when props change', async () => {
    const wrapper = shallowMount(Checkbox);
    const cbInput = wrapper.find('input[type="checkbox"]').element as HTMLInputElement;

    expect(cbInput.checked).toBe(false);

    await wrapper.setProps({ value: true });

    expect(cbInput.checked).toBe(true);
  });

  it('emits an input event with a true value', async () => {
    const wrapper = shallowMount(Checkbox);
    const event = {
      target: { tagName: 'input', href: null },
      stopPropagation: () => { },
      preventDefault: () => { }
    };

    (wrapper.vm as any).clicked(event);
    await wrapper.vm.$nextTick();

    expect(wrapper.emitted().input?.length).toBe(1);
    expect(wrapper.emitted().input?.[0][0]).toBe(true);
  });

  it('emits an input event with a custom valueWhenTrue', async () => {
    const valueWhenTrue = 'BIG IF TRUE';
    const event = {
      target: { tagName: 'input', href: null },
      stopPropagation: () => { },
      preventDefault: () => { }
    };

    const wrapper = shallowMount(Checkbox, { propsData: { value: false, valueWhenTrue } });

    (wrapper.vm as any).clicked(event);
    await wrapper.vm.$nextTick();

    expect(wrapper.emitted().input?.length).toBe(1);
    expect(wrapper.emitted().input?.[0][0]).toBe(valueWhenTrue);
  });

  it('updates from valueWhenTrue to falsy', async () => {
    const valueWhenTrue = 'REAL HUGE IF FALSE';
    const event = {
      target: { tagName: 'input', href: null },
      stopPropagation: () => { },
      preventDefault: () => { }
    };

    const wrapper = shallowMount(Checkbox, { propsData: { value: valueWhenTrue, valueWhenTrue } });

    (wrapper.vm as any).clicked(event);
    await wrapper.vm.$nextTick();

    expect(wrapper.emitted().input?.[0][0]).toBe(null);
  })
});
