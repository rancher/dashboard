import { shallowMount } from '@vue/test-utils';
import RcIcon from './RcIcon.vue';

describe('rcIcon.vue', () => {
  it('renders with the correct type class and size classes', () => {
    const wrapper = shallowMount(RcIcon, {
      props: {
        size: 'medium',
        type: 'search',
      },
    });

    expect(wrapper.classes()).toContain('icon-search');
    expect(wrapper.classes()).toContain('medium');
  });

  it('sets aria-hidden to true by default', () => {
    const wrapper = shallowMount(RcIcon, {
      props: {
        size: 'medium',
        type: 'search',
      },
    });

    expect(wrapper.attributes('aria-hidden')).toBe('true');
  });

  it('sets aria-hidden to false when explicitly provided', () => {
    const wrapper = shallowMount(RcIcon, {
      props: {
        size:       'medium',
        type:       'search',
        ariaHidden: false,
      },
    });

    expect(wrapper.attributes('aria-hidden')).toBe('false');
  });

  it('sets aria-hidden to true when explicitly provided', () => {
    const wrapper = shallowMount(RcIcon, {
      props: {
        size:       'medium',
        type:       'search',
        ariaHidden: true,
      },
    });

    expect(wrapper.attributes('aria-hidden')).toBe('true');
  });
});
