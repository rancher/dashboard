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

    it('should default to "primary" background when no background prop and no parent', () => {
      const { background: _, ...propsWithoutBg } = defaultProps;
      const wrapper = mount(RcSection, { props: propsWithoutBg });

      expect(wrapper.find('.rc-section').classes()).toContain('bg-primary');
    });

    it('should alternate background from parent via provide/inject', () => {
      const wrapper = mount(RcSection, {
        props: {
          ...defaultProps, background: 'primary', expanded: true
        },
        slots: {
          default: {
            components: { RcSection },
            template:   '<RcSection type="secondary" mode="with-header" :expandable="false" title="Child" />',
          },
        },
      });

      const childSection = wrapper.findAll('.rc-section')[1];

      expect(childSection.classes()).toContain('bg-secondary');
    });

    it('should allow explicit background to override the injected alternation', () => {
      const wrapper = mount(RcSection, {
        props: {
          ...defaultProps, background: 'primary', expanded: true
        },
        slots: {
          default: {
            components: { RcSection },
            template:   '<RcSection type="secondary" mode="with-header" :expandable="false" background="primary" title="Child" />',
          },
        },
      });

      const childSection = wrapper.findAll('.rc-section')[1];

      expect(childSection.classes()).toContain('bg-primary');
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
    it('should render toggle button when expandable is true', () => {
      const wrapper = mount(RcSection, { props: { ...defaultProps, expandable: true } });

      expect(wrapper.find('.toggle-button').exists()).toBe(true);
    });

    it('should not render toggle button when expandable is false', () => {
      const wrapper = mount(RcSection, { props: { ...defaultProps, expandable: false } });

      expect(wrapper.find('.toggle-button').exists()).toBe(false);
    });

    it('should set aria-expanded on toggle button when expandable', () => {
      const wrapper = mount(RcSection, {
        props: {
          ...defaultProps, expandable: true, expanded: true
        }
      });

      expect(wrapper.find('.toggle-button').attributes('aria-expanded')).toBe('true');
    });

    it('should set aria-expanded="false" on toggle button when collapsed', () => {
      const wrapper = mount(RcSection, {
        props: {
          ...defaultProps, expandable: true, expanded: false
        }
      });

      expect(wrapper.find('.toggle-button').attributes('aria-expanded')).toBe('false');
    });

    it('should set aria-label to "Collapse section" on toggle button when expanded', () => {
      const wrapper = mount(RcSection, {
        props: {
          ...defaultProps, expandable: true, expanded: true
        }
      });

      expect(wrapper.find('.toggle-button').attributes('aria-label')).toBe('Collapse section');
    });

    it('should set aria-label to "Expand section" on toggle button when collapsed', () => {
      const wrapper = mount(RcSection, {
        props: {
          ...defaultProps, expandable: true, expanded: false
        }
      });

      expect(wrapper.find('.toggle-button').attributes('aria-label')).toBe('Expand section');
    });

    it('should emit update:expanded with false when clicking an expanded header', async() => {
      const wrapper = mount(RcSection, {
        props: {
          ...defaultProps, expandable: true, expanded: true
        }
      });

      await wrapper.find('.section-header').trigger('click');

      expect(wrapper.emitted('update:expanded')).toHaveLength(1);
      expect(wrapper.emitted('update:expanded')![0]).toStrictEqual([false]);
    });

    it('should emit update:expanded with true when clicking a collapsed header', async() => {
      const wrapper = mount(RcSection, {
        props: {
          ...defaultProps, expandable: true, expanded: false
        }
      });

      await wrapper.find('.section-header').trigger('click');

      expect(wrapper.emitted('update:expanded')).toHaveLength(1);
      expect(wrapper.emitted('update:expanded')![0]).toStrictEqual([true]);
    });

    it('should not emit update:expanded when clicking a non-expandable header', async() => {
      const wrapper = mount(RcSection, { props: { ...defaultProps, expandable: false } });

      await wrapper.find('.section-header').trigger('click');

      expect(wrapper.emitted('update:expanded')).toBeUndefined();
    });

    it('should emit update:expanded when toggle button is clicked', async() => {
      const wrapper = mount(RcSection, {
        props: {
          ...defaultProps, expandable: true, expanded: true
        }
      });

      await wrapper.find('.toggle-button').trigger('click');

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
      const wrapper = mount(RcSection, {
        props: {
          ...defaultProps, expandable: true, expanded: true
        }
      });

      expect(wrapper.find('.section-content').classes()).toContain('expandable-content');
    });

    it('should not apply expandable-content class when expandable is false', () => {
      const wrapper = mount(RcSection, {
        props: {
          ...defaultProps, expandable: false, expanded: true
        }
      });

      expect(wrapper.find('.section-content').classes()).not.toContain('expandable-content');
    });

    it('should add collapsed class to header when not expanded', () => {
      const wrapper = mount(RcSection, {
        props: {
          ...defaultProps, expandable: true, expanded: false
        }
      });

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
