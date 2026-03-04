import { mount } from '@vue/test-utils';
import RcSection from './RcSection.vue';

describe('component: RcSection', () => {
  const defaultProps = {
    type:       'primary' as const,
    mode:       'with-header' as const,
    background: 'primary' as const,
    expandable: false,
    title:      'Test title',
  };

  describe('type prop', () => {
    it('should apply type-primary class when type is "primary"', () => {
      const wrapper = mount(RcSection, { props: { ...defaultProps, type: 'primary' } });

      expect(wrapper.find('.rc-section').classes()).toContain('type-primary');
    });

    it('should apply type-secondary class when type is "secondary"', () => {
      const wrapper = mount(RcSection, { props: { ...defaultProps, type: 'secondary' } });

      expect(wrapper.find('.rc-section').classes()).toContain('type-secondary');
    });
  });

  describe('background prop', () => {
    it('should apply bg-primary class when background is "primary"', () => {
      const wrapper = mount(RcSection, { props: { ...defaultProps, background: 'primary' } });

      expect(wrapper.find('.rc-section').classes()).toContain('bg-primary');
    });

    it('should apply bg-secondary class when background is "secondary"', () => {
      const wrapper = mount(RcSection, { props: { ...defaultProps, background: 'secondary' } });

      expect(wrapper.find('.rc-section').classes()).toContain('bg-secondary');
    });
  });

  describe('mode prop', () => {
    it('should render section-header when mode is "with-header"', () => {
      const wrapper = mount(RcSection, { props: { ...defaultProps, mode: 'with-header' } });

      expect(wrapper.find('.section-header').exists()).toBe(true);
    });

    it('should not render section-header when mode is "no-header"', () => {
      const wrapper = mount(RcSection, { props: { ...defaultProps, mode: 'no-header' } });

      expect(wrapper.find('.section-header').exists()).toBe(false);
    });

    it('should apply no-header class to content when mode is "no-header"', () => {
      const wrapper = mount(RcSection, { props: { ...defaultProps, mode: 'no-header' } });

      expect(wrapper.find('.section-content').classes()).toContain('no-header');
    });
  });

  describe('title prop', () => {
    it('should render the title text', () => {
      const wrapper = mount(RcSection, { props: { ...defaultProps, title: 'My Section' } });

      expect(wrapper.find('.title').text()).toBe('My Section');
    });

    it('should render the title slot when provided', () => {
      const wrapper = mount(RcSection, {
        props: { ...defaultProps },
        slots: { title: '<span class="custom-title">Custom</span>' },
      });

      expect(wrapper.find('.custom-title').exists()).toBe(true);
      expect(wrapper.find('.custom-title').text()).toBe('Custom');
    });
  });

  describe('expandable behavior', () => {
    it('should render toggle icon when expandable is true', () => {
      const wrapper = mount(RcSection, { props: { ...defaultProps, expandable: true } });

      expect(wrapper.find('.toggle-icon').exists()).toBe(true);
    });

    it('should not render toggle icon when expandable is false', () => {
      const wrapper = mount(RcSection, { props: { ...defaultProps, expandable: false } });

      expect(wrapper.find('.toggle-icon').exists()).toBe(false);
    });

    it('should set role="button" on header when expandable', () => {
      const wrapper = mount(RcSection, { props: { ...defaultProps, expandable: true } });

      expect(wrapper.find('.section-header').attributes('role')).toBe('button');
    });

    it('should not set role on header when not expandable', () => {
      const wrapper = mount(RcSection, { props: { ...defaultProps, expandable: false } });

      expect(wrapper.find('.section-header').attributes('role')).toBeUndefined();
    });

    it('should set tabindex="0" on header when expandable', () => {
      const wrapper = mount(RcSection, { props: { ...defaultProps, expandable: true } });

      expect(wrapper.find('.section-header').attributes('tabindex')).toBe('0');
    });

    it('should set aria-expanded on header when expandable', () => {
      const wrapper = mount(RcSection, { props: { ...defaultProps, expandable: true, expanded: true } });

      expect(wrapper.find('.section-header').attributes('aria-expanded')).toBe('true');
    });

    it('should emit update:expanded with false when clicking an expanded header', async() => {
      const wrapper = mount(RcSection, { props: { ...defaultProps, expandable: true, expanded: true } });

      await wrapper.find('.section-header').trigger('click');

      expect(wrapper.emitted('update:expanded')).toHaveLength(1);
      expect(wrapper.emitted('update:expanded')![0]).toStrictEqual([false]);
    });

    it('should emit update:expanded with true when clicking a collapsed header', async() => {
      const wrapper = mount(RcSection, { props: { ...defaultProps, expandable: true, expanded: false } });

      await wrapper.find('.section-header').trigger('click');

      expect(wrapper.emitted('update:expanded')).toHaveLength(1);
      expect(wrapper.emitted('update:expanded')![0]).toStrictEqual([true]);
    });

    it('should not emit update:expanded when clicking a non-expandable header', async() => {
      const wrapper = mount(RcSection, { props: { ...defaultProps, expandable: false } });

      await wrapper.find('.section-header').trigger('click');

      expect(wrapper.emitted('update:expanded')).toBeUndefined();
    });

    it('should emit update:expanded on Enter keydown', async() => {
      const wrapper = mount(RcSection, { props: { ...defaultProps, expandable: true, expanded: true } });

      await wrapper.find('.section-header').trigger('keydown.enter');

      expect(wrapper.emitted('update:expanded')).toHaveLength(1);
      expect(wrapper.emitted('update:expanded')![0]).toStrictEqual([false]);
    });

    it('should emit update:expanded on Space keydown', async() => {
      const wrapper = mount(RcSection, { props: { ...defaultProps, expandable: true, expanded: true } });

      await wrapper.find('.section-header').trigger('keydown.space');

      expect(wrapper.emitted('update:expanded')).toHaveLength(1);
      expect(wrapper.emitted('update:expanded')![0]).toStrictEqual([false]);
    });
  });

  describe('expanded prop', () => {
    it('should default expanded to true', () => {
      const wrapper = mount(RcSection, { props: { ...defaultProps, expandable: true } });

      expect(wrapper.find('.section-content').exists()).toBe(true);
    });

    it('should render content when expanded is true', () => {
      const wrapper = mount(RcSection, {
        props: { ...defaultProps, expanded: true },
        slots: { default: '<p>Content</p>' },
      });

      expect(wrapper.find('.section-content').exists()).toBe(true);
      expect(wrapper.find('p').text()).toBe('Content');
    });

    it('should hide content when expanded is false', () => {
      const wrapper = mount(RcSection, {
        props: { ...defaultProps, expanded: false },
        slots: { default: '<p>Content</p>' },
      });

      expect(wrapper.find('.section-content').exists()).toBe(false);
    });

    it('should apply expandable-content class when expandable is true', () => {
      const wrapper = mount(RcSection, { props: { ...defaultProps, expandable: true, expanded: true } });

      expect(wrapper.find('.section-content').classes()).toContain('expandable-content');
    });

    it('should not apply expandable-content class when expandable is false', () => {
      const wrapper = mount(RcSection, { props: { ...defaultProps, expandable: false, expanded: true } });

      expect(wrapper.find('.section-content').classes()).not.toContain('expandable-content');
    });

    it('should add collapsed class to header when not expanded', () => {
      const wrapper = mount(RcSection, { props: { ...defaultProps, expandable: true, expanded: false } });

      expect(wrapper.find('.section-header').classes()).toContain('collapsed');
    });
  });

  describe('slots', () => {
    it('should render badges slot inside right-wrapper', () => {
      const wrapper = mount(RcSection, {
        props: { ...defaultProps },
        slots: { badges: '<span class="test-badge">Badge</span>' },
      });

      expect(wrapper.find('.right-wrapper .status-badges .test-badge').exists()).toBe(true);
    });

    it('should render actions slot inside right-wrapper', () => {
      const wrapper = mount(RcSection, {
        props: { ...defaultProps },
        slots: { actions: '<button class="test-action">Act</button>' },
      });

      expect(wrapper.find('.right-wrapper .actions .test-action').exists()).toBe(true);
    });

    it('should not render right-wrapper when no badges or actions slots', () => {
      const wrapper = mount(RcSection, { props: { ...defaultProps } });

      expect(wrapper.find('.right-wrapper').exists()).toBe(false);
    });

    it('should render counter slot', () => {
      const wrapper = mount(RcSection, {
        props: { ...defaultProps },
        slots: { counter: '<span class="test-counter">5</span>' },
      });

      expect(wrapper.find('.test-counter').exists()).toBe(true);
    });

    it('should render errors slot', () => {
      const wrapper = mount(RcSection, {
        props: { ...defaultProps },
        slots: { errors: '<span class="test-error">!</span>' },
      });

      expect(wrapper.find('.test-error').exists()).toBe(true);
    });
  });
});
