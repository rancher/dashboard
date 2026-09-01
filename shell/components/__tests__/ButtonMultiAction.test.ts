import { shallowMount } from '@vue/test-utils';
import ButtonMultiAction from '@shell/components/ButtonMultiAction.vue';

describe('buttonMultiAction.vue', () => {
  it('renders correct classes when props are provided', () => {
    const wrapper = shallowMount(ButtonMultiAction, {
      props: {
        borderless: true,
        invisible:  true,
      },
    });

    expect(wrapper.find('button').classes()).toContain('borderless');
    expect(wrapper.find('button').classes()).toContain('invisible');
  });

  it('renders correct classes when props are absent', () => {
    const wrapper = shallowMount(ButtonMultiAction);

    expect(wrapper.find('button').classes()).not.toContain('borderless');
    expect(wrapper.find('button').classes()).not.toContain('invisible');
  });

  it('emits click event when button is clicked', () => {
    const wrapper = shallowMount(ButtonMultiAction);

    wrapper.find('button').trigger('click');

    expect(wrapper.emitted('click')).toBeTruthy();
  });
});
