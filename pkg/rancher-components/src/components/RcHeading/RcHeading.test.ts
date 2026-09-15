import { mount } from '@vue/test-utils';
import RcHeading from './RcHeading.vue';
import type { HeadingSize } from './types';

describe('component: RcHeading', () => {
  it('should render a section heading one level below the page title', () => {
    const wrapper = mount(RcHeading, { props: { size: 4 } });

    expect(wrapper.element.tagName).toBe('H2');
  });

  it('should render the content in the slot', () => {
    const wrapper = mount(RcHeading, {
      props: { size: 4 },
      slots: { default: 'Language' },
    });

    expect(wrapper.text()).toBe('Language');
  });

  it.each([1, 2, 3, 4, 5, 6])('should take the look of an h%i without changing the level', (size) => {
    const wrapper = mount(RcHeading, { props: { size: size as HeadingSize } });

    expect(wrapper.element.tagName).toBe('H2');
    expect(wrapper.classes()).toStrictEqual([`size-${ size }`]);
  });
});
