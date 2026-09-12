import { defineComponent, computed } from 'vue';
import { mount } from '@vue/test-utils';
import RcHeading from './RcHeading.vue';
import { provideHeadingLevel } from './useHeadingLevel';
import type { HeadingLevel, HeadingSize } from './types';

const Level = defineComponent({
  props: { level: { type: Number, required: true } },
  setup(props) {
    provideHeadingLevel(computed(() => props.level as HeadingLevel));
  },
  template: '<div><slot /></div>',
});

describe('component: RcHeading', () => {
  it('should render the level it was given', () => {
    const wrapper = mount(RcHeading, { props: { level: 3 as HeadingLevel } });

    expect(wrapper.find('h3').exists()).toBe(true);
  });

  it('should render the content in the slot', () => {
    const wrapper = mount(RcHeading, {
      props: { level: 2 as HeadingLevel },
      slots: { default: 'Language' },
    });

    expect(wrapper.find('h2').text()).toBe('Language');
  });

  it('should impart no style of its own when no size is given', () => {
    const wrapper = mount(RcHeading, { props: { level: 3 as HeadingLevel } });

    expect(wrapper.find('h3').classes()).toStrictEqual([]);
  });

  it.each([1, 2, 3, 4, 5, 6])('should take the size of an h%i on request', (level) => {
    const wrapper = mount(RcHeading, { props: { size: `h${ level }` as HeadingSize } });

    expect(wrapper.find('h2').classes()).toStrictEqual([`text-h${ level }`]);
  });

  it('should size independently of the level so a section can look unchanged', () => {
    const wrapper = mount(RcHeading, { props: { level: 2 as HeadingLevel, size: 'h4' as const } });

    expect(wrapper.find('h2').classes()).toStrictEqual(['text-h4']);
  });

  it('should default to h2, the level of a section under a page masthead', () => {
    const wrapper = mount(RcHeading);

    expect(wrapper.find('h2').exists()).toBe(true);
  });

  it('should take the level from the enclosing section when none is given', () => {
    const wrapper = mount(Level, {
      props:  { level: 4 },
      global: { components: { RcHeading } },
      slots:  { default: '<RcHeading size="h5">Nested</RcHeading>' },
    });

    expect(wrapper.find('h4').classes()).toStrictEqual(['text-h5']);
  });

  it('should prefer an explicit level over the enclosing section', () => {
    const wrapper = mount(Level, {
      props:  { level: 4 },
      global: { components: { RcHeading } },
      slots:  { default: '<RcHeading :level="2">Dialog title</RcHeading>' },
    });

    expect(wrapper.find('h2').exists()).toBe(true);
  });
});
