import { shallowMount } from '@vue/test-utils';
import RCLabelsAndAnnotations from '@shell/components/RcLabelsAndAnnotations.vue';
import RcLabels from '@shell/components/form/RcLabels.vue';
import { SECTION_TYPE } from '@components/RcSection';
import { ToggleSwitch } from '@components/Form/ToggleSwitch';
import { _EDIT, _VIEW } from '@shell/config/query-params';

const mockT = jest.fn((key: string) => key);

// RcSection's default shallow-mount stub doesn't render its default slot, which would hide
// the nested sections/Labels instances under test - render the slot so they still mount.
const RcSectionStub = {
  name:     'RcSection',
  props:    ['title', 'type', 'mode', 'expandable', 'expanded'],
  template: '<div><slot /></div>',
};

describe('component: RCLabelsAndAnnotations', () => {
  const mockValue = {
    labels:      { 'my-label': 'my-value' },
    annotations: { 'my-annotation': 'my-annotation' },
  };

  const mountComponent = (propsData = {}) => {
    return shallowMount(RCLabelsAndAnnotations, {
      props: {
        value: mockValue,
        mode:  _EDIT,
        ...propsData,
      },
      global: {
        mocks: { t: mockT },
        stubs: { RcSection: RcSectionStub },
      },
    });
  };

  it('should render a primary section wrapping two secondary sections', () => {
    const wrapper = mountComponent();

    const sections = wrapper.findAllComponents(RcSectionStub);

    expect(sections).toHaveLength(3);
    expect(sections[0].props('type')).toBe(SECTION_TYPE.PRIMARY);
    expect(sections[1].props('type')).toBe(SECTION_TYPE.SECONDARY);
    expect(sections[2].props('type')).toBe(SECTION_TYPE.SECONDARY);
  });

  it('should always title the primary section with the generic labels and annotations translation', () => {
    const wrapper = mountComponent();

    const sections = wrapper.findAllComponents(RcSectionStub);

    expect(sections[0].props('title')).toBe('generic.labelsAndAnnotations');
  });

  it('should request the raw (unescaped) translation for the primary section title', () => {
    // the real `t()` HTML-escapes by default (e.g. "&" -> "&amp;"), which is wrong for a title
    // rendered as plain text by RcSection - the raw flag must be passed to avoid that.
    mountComponent();

    expect(mockT).toHaveBeenCalledWith('generic.labelsAndAnnotations', {}, true);
  });

  it('should title the nested secondary sections Labels and Annotations', () => {
    const wrapper = mountComponent();

    const sections = wrapper.findAllComponents(RcSectionStub);

    expect(sections[1].props('title')).toBe('labels.labels.title');
    expect(sections[2].props('title')).toBe('labels.annotations.title');
  });

  it('should pass expandable and expanded through to the primary section', () => {
    const wrapper = mountComponent({ expandable: true, expanded: false });

    const sections = wrapper.findAllComponents(RcSectionStub);

    expect(sections[0].props('expandable')).toBe(true);
    expect(sections[0].props('expanded')).toBe(false);
  });

  it('should not make the nested secondary sections expandable', () => {
    const wrapper = mountComponent();

    const sections = wrapper.findAllComponents(RcSectionStub);

    expect(sections[1].props('expandable')).toBe(false);
    expect(sections[2].props('expandable')).toBe(false);
  });

  it('should configure the Labels-only instance to show labels but not annotations', () => {
    const wrapper = mountComponent();

    const labelsInstances = wrapper.findAllComponents(RcLabels);
    const labelsOnly = labelsInstances[0];

    expect(labelsOnly.props('showLabels')).toBe(true);
    expect(labelsOnly.props('showAnnotations')).toBe(false);
    expect(labelsOnly.props('showLabelTitle')).toBe(false);
  });

  it('should configure the Annotations-only instance to show annotations but not labels', () => {
    const wrapper = mountComponent();

    const labelsInstances = wrapper.findAllComponents(RcLabels);
    const annotationsOnly = labelsInstances[1];

    expect(annotationsOnly.props('showLabels')).toBe(false);
    expect(annotationsOnly.props('showAnnotationTitle')).toBe(false);
  });

  it('should emit update:value when either Labels instance updates its value', () => {
    const wrapper = mountComponent();
    const newValue = { labels: { a: '1' } };

    wrapper.findAllComponents(RcLabels)[0].vm.$emit('update:value', newValue);

    expect(wrapper.emitted('update:value')).toStrictEqual([[newValue]]);
  });

  it('should forward the input event from either Labels instance', () => {
    const wrapper = mountComponent();
    const event = { some: 'event' };

    wrapper.findAllComponents(RcLabels)[1].vm.$emit('input', event);

    expect(wrapper.emitted('input')).toStrictEqual([[event]]);
  });

  it('should not listen for update:expanded on the primary section, letting it manage its own toggle state', () => {
    // RcSection's defineModel only falls back to local toggle state when its `expanded` prop
    // has no paired `onUpdate:expanded` listener - see shell/components/RCLabelsAndAnnotations.vue.
    const wrapper = mountComponent();

    const primarySection = wrapper.findAllComponents(RcSectionStub)[0];

    expect(primarySection.vm.$attrs['onUpdate:expanded']).toBeUndefined();
  });

  it('should render an RcLabels instance for labels and one for annotations', () => {
    const wrapper = mountComponent();

    expect(wrapper.findAllComponents(RcLabels)).toHaveLength(2);
  });

  describe('system labels and annotations toggle', () => {
    const systemValue = {
      labels:            { 'my-label': 'my-value', 'kubernetes.io/hostname': 'node-1' },
      annotations:       { 'my-annotation': 'my-annotation' },
      systemLabels:      ['kubernetes.io/hostname'],
      systemAnnotations: [],
    };

    it('should show the toggle in view mode when there are protected keys', () => {
      const wrapper = mountComponent({ mode: _VIEW, value: systemValue });

      expect(wrapper.findComponent(ToggleSwitch).exists()).toBe(true);
    });

    it('should show the toggle in view mode when only annotations have protected keys', () => {
      const value = {
        ...mockValue,
        annotations:       { 'my-annotation': 'my-annotation', 'sys-annotation': 'sys-value' },
        systemAnnotations: ['sys-annotation'],
      };
      const wrapper = mountComponent({ mode: _VIEW, value });

      expect(wrapper.findComponent(ToggleSwitch).exists()).toBe(true);
    });

    it('should not show the toggle in edit mode', () => {
      const wrapper = mountComponent({ value: systemValue });

      expect(wrapper.findComponent(ToggleSwitch).exists()).toBe(false);
    });

    it('should not show the toggle in view mode when there are no protected keys', () => {
      const wrapper = mountComponent({ mode: _VIEW });

      expect(wrapper.findComponent(ToggleSwitch).exists()).toBe(false);
    });

    it.each([0, 1])('should not show system keys in RcLabels instance %i by default', (index) => {
      const wrapper = mountComponent({ mode: _VIEW, value: systemValue });

      expect(wrapper.findAllComponents(RcLabels)[index].props('showSystemKeys')).toBe(false);
    });

    it.each([0, 1])('should show system keys in RcLabels instance %i when the toggle is on', async(index) => {
      const wrapper = mountComponent({ mode: _VIEW, value: systemValue });

      wrapper.findComponent(ToggleSwitch).vm.$emit('update:value', true);
      await wrapper.vm.$nextTick();

      expect(wrapper.findAllComponents(RcLabels)[index].props('showSystemKeys')).toBe(true);
    });
  });
});
