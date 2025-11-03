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
});
