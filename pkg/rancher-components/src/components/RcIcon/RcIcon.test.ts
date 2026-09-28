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

  it('defaults the color to "inherit" when the status prop is omitted', () => {
    const wrapper = shallowMount(RcIcon, {
      props: {
        size: 'medium',
        type: 'search',
      },
    });

    const vm = wrapper.vm as unknown as { color: string };

    expect(vm.color).toBe('inherit');
  });

  it('uses "inherit" color when status is explicitly set to "inherit"', () => {
    const wrapper = shallowMount(RcIcon, {
      props: {
        size:   'medium',
        type:   'search',
        status: 'inherit'
      },
    });

    const vm = wrapper.vm as unknown as { color: string };

    expect(vm.color).toBe('inherit');
  });

  it('uses appropriate color when status is provided with a specific value', () => {
    const wrapper = shallowMount(RcIcon, {
      props: {
        size:   'medium',
        type:   'search',
        status: 'success'
      },
    });

    const vm = wrapper.vm as unknown as { color: string };

    expect(vm.color).not.toBe('inherit');
    expect(vm.color).toContain('--rc-success');
  });
});
