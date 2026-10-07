import { defineComponent, onMounted, ref } from 'vue';
import { flushPromises, mount } from '@vue/test-utils';
import { useField, useForm } from 'vee-validate';
import RcContentGroup from '@components/Layout/RcContentGroup/RcContentGroup.vue';
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
        global: { components: { RcSection } },
        slots:  { default: '<RcSection type="secondary" mode="with-header" :expandable="false" title="Child" />' },
      });

      const childSection = wrapper.findAll('.rc-section')[1];

      expect(childSection.classes()).toContain('bg-secondary');
    });

    it('should allow explicit background to override the injected alternation', () => {
      const wrapper = mount(RcSection, {
        props: {
          ...defaultProps, background: 'primary', expanded: true
        },
        global: { components: { RcSection } },
        slots:  { default: '<RcSection type="secondary" mode="with-header" :expandable="false" background="primary" title="Child" />' },
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

      const emitted = wrapper.emitted('update:expanded') as [boolean][];

      expect(emitted).toHaveLength(1);
      expect(emitted[0]).toStrictEqual([false]);
    });

    it('should emit update:expanded with true when clicking a collapsed header', async() => {
      const wrapper = mount(RcSection, {
        props: {
          ...defaultProps, expandable: true, expanded: false
        }
      });

      await wrapper.find('.section-header').trigger('click');

      const emitted = wrapper.emitted('update:expanded') as [boolean][];

      expect(emitted).toHaveLength(1);
      expect(emitted[0]).toStrictEqual([true]);
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

      const emitted = wrapper.emitted('update:expanded') as [boolean][];

      expect(emitted).toHaveLength(1);
      expect(emitted[0]).toStrictEqual([false]);
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

      expect(wrapper.find('.section-content').isVisible()).toBe(false);
    });

    it('should keep the content in the DOM when expanded is false', () => {
      const wrapper = mount(RcSection, {
        props: { ...defaultProps, expanded: false },
        slots: { default: '<p>Content</p>' },
      });

      expect(wrapper.find('.section-content').exists()).toBe(true);
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

    it('should render the default slot straight into the section content', () => {
      const wrapper = mount(RcSection, {
        props: { ...defaultProps, expanded: true },
        slots: { default: '<p class="test-content">Content</p>' },
      });

      expect(wrapper.find('.section-content > .test-content').exists()).toBe(true);
      expect(wrapper.find('.rc-content-group').exists()).toBe(false);
    });

    it('should not show the default slot content when collapsed', () => {
      const wrapper = mount(RcSection, {
        props: {
          ...defaultProps, expandable: true, expanded: false
        },
        slots: { default: '<p class="test-content">Content</p>' },
      });

      expect(wrapper.find('.test-content').isVisible()).toBe(false);
    });

    it('should keep several content groups as siblings the section can space apart', () => {
      const wrapper = mount(RcSection, {
        props:  { ...defaultProps, expanded: true },
        global: { components: { RcContentGroup } },
        slots:  { default: '<RcContentGroup><p class="one" /></RcContentGroup><RcContentGroup><p class="two" /></RcContentGroup>' },
      });

      expect(wrapper.findAll('.section-content > .rc-content-group')).toHaveLength(2);
    });
  });

  describe('counter badge colour', () => {
    it('should give the counter slot its own element', () => {
      const wrapper = mount(RcSection, {
        props: { ...defaultProps, background: 'secondary' },
        slots: { counter: '<span class="test-counter">5</span>' },
      });

      expect(wrapper.find('.section-header .counter > .test-counter').exists()).toBe(true);
    });

    it('should not render the counter element when no counter slot is given', () => {
      const wrapper = mount(RcSection, { props: { ...defaultProps, background: 'secondary' } });

      expect(wrapper.find('.counter').exists()).toBe(false);
    });
  });

  describe('collapsed content validation (#18850)', () => {
    const REQUIRED = 'Required';

    // A field that registers with the surrounding vee-validate form on mount
    // and unregisters on unmount, like the fields of a real form.
    let mountCount = 0;

    const RequiredField = defineComponent({
      name: 'RequiredField',
      setup() {
        onMounted(() => {
          mountCount++;
        });
        const { value } = useField<string>('name', (v: unknown) => (v ? true : REQUIRED));

        return { value };
      },
      template: '<input class="required-field" v-model="value" />',
    });

    const mountForm = (expanded: boolean) => {
      let form!: ReturnType<typeof useForm>;

      const Host = defineComponent({
        components: { RcSection, RequiredField },
        setup() {
          form = useForm();
          const sectionExpanded = ref(expanded);

          return { sectionExpanded };
        },
        template: `
          <RcSection
            v-model:expanded="sectionExpanded"
            type="primary"
            mode="with-header"
            title="Network"
            expandable
          >
            <RequiredField />
          </RcSection>
        `,
      });

      const wrapper = mount(Host);

      return { wrapper, form: () => form };
    };

    it('should keep a field inside a collapsed section registered with the form', async() => {
      const { form } = mountForm(false);

      await flushPromises();

      expect(Object.keys(form().values)).toStrictEqual(['name']);
    });

    it('should report the form as invalid when an invalid field is inside a collapsed section', async() => {
      const { form } = mountForm(false);

      const result = await form().validate();

      expect(result.valid).toBe(false);
    });

    it('should report the form as invalid after collapsing a section holding an invalid field', async() => {
      const { wrapper, form } = mountForm(true);

      await wrapper.find('.section-header').trigger('click');
      await flushPromises();

      const result = await form().validate();

      expect({ collapsed: !wrapper.find('.section-content').isVisible(), errors: result.errors }).toStrictEqual({ collapsed: true, errors: { name: REQUIRED } });
    });

    it('should not remount the content when the section is collapsed and expanded again', async() => {
      mountCount = 0;
      const { wrapper } = mountForm(true);

      await wrapper.find('.section-header').trigger('click');
      await wrapper.find('.section-header').trigger('click');

      expect(mountCount).toStrictEqual(1);
    });
  });
});
