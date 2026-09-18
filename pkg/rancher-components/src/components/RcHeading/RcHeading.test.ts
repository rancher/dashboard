import { mount } from '@vue/test-utils';
import RcHeading from './RcHeading.vue';
import type { HeadingSize } from './types';

describe('component: RcHeading', () => {
  it('should stay out of the page heading outline', () => {
    const wrapper = mount(RcHeading, { props: { size: 4 } });

    expect(wrapper.element.tagName).toBe('DIV');
    expect(wrapper.find('h1, h2, h3, h4, h5, h6').exists()).toBe(false);
  });

  it('should render the content in the slot', () => {
    const wrapper = mount(RcHeading, {
      props: { size: 4 },
      slots: { default: 'Language' },
    });

    expect(wrapper.text()).toBe('Language');
  });

  it.each([1, 2, 3, 4, 5, 6])('should take the look of an h%i', (size) => {
    const wrapper = mount(RcHeading, { props: { size: size as HeadingSize } });

    expect(wrapper.classes()).toStrictEqual([`size-${ size }`]);
  });
});
