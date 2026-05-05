import { shallowMount } from '@vue/test-utils';
import CountBox from '@shell/components/CountBox.vue';

describe('component: CountBox', () => {
  const defaultProps = {
    name:            'Test',
    count:           5,
    primaryColorVar: '--sizzle-1',
  };

  describe('when clickable is false', () => {
    it('should render as a div', () => {
      const wrapper = shallowMount(CountBox, { props: defaultProps });

      expect(wrapper.element.tagName).toBe('DIV');
    });

    it('should not have the clickable class', () => {
      const wrapper = shallowMount(CountBox, { props: defaultProps });

      expect(wrapper.classes()).not.toContain('clickable');
    });

    it('should not emit click event when clicked', async() => {
      const wrapper = shallowMount(CountBox, { props: defaultProps });

      await wrapper.trigger('click');

      expect(wrapper.emitted('click')).toBeUndefined();
    });
  });

  describe('when clickable is true', () => {
    it('should have the clickable class', () => {
      const wrapper = shallowMount(CountBox, {
        props: {
          ...defaultProps,
          clickable: true,
        },
      });

      expect(wrapper.classes()).toContain('clickable');
    });

    it('should emit click event when clicked', async() => {
      const wrapper = shallowMount(CountBox, {
        props: {
          ...defaultProps,
          clickable: true,
        },
      });

      await wrapper.trigger('click');

      expect(wrapper.emitted('click')).toHaveLength(1);
    });
  });

  describe('display', () => {
    it('should display the count', () => {
      const wrapper = shallowMount(CountBox, { props: defaultProps });

      expect(wrapper.find('h1').text()).toBe('5');
    });

    it('should display the name', () => {
      const wrapper = shallowMount(CountBox, { props: defaultProps });

      expect(wrapper.find('label').text()).toBe('Test');
    });
  });
});
