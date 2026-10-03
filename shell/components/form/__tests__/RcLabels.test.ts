import { shallowMount } from '@vue/test-utils';
import RcLabels from '@shell/components/form/RcLabels.vue';
import RcKeyValue from '@shell/components/form/RcKeyValue.vue';
import { ToggleSwitch } from '@components/Form/ToggleSwitch';
import { _EDIT, _VIEW } from '@shell/config/query-params';

jest.mock('vuex', () => ({ useStore: () => ({}) }));
jest.mock('@shell/composables/useI18n', () => ({ useI18n: () => ({ t: (key: string) => key }) }));

// The default shallow-mount stub doesn't render its default slot, which would hide the content under test
// Note: in templates `t` resolves to the global jest mock from jest.setup.js, which renders keys as `%key%`
const RcContentGroupStub = {
  name:     'RcContentGroup',
  template: '<div><slot /></div>',
};

describe('component: RcLabels', () => {
  const createValue = (overrides = {}) => ({
    labels:                 { 'my-label': 'my-value', 'kubernetes.io/hostname': 'node-1' },
    annotations:            { 'my-annotation': 'my-annotation' },
    systemLabels:           ['kubernetes.io/hostname'],
    systemAnnotations:      [],
    readOnlyAnnotationKeys: ['read-only-annotation'],
    setLabels:              jest.fn(),
    setAnnotations:         jest.fn(),
    ...overrides,
  });

  const mountComponent = (propsData = {}, value = createValue()) => {
    return shallowMount(RcLabels, {
      props: {
        value,
        mode: _EDIT,
        ...propsData,
      },
      global: { stubs: { RcContentGroup: RcContentGroupStub } },
    });
  };

  const findLabelsKeyValue = (wrapper: ReturnType<typeof mountComponent>) => wrapper.findAllComponents(RcKeyValue).find((c) => c.attributes('data-testid') === 'labels-keyvalue');
  const findAnnotationsKeyValue = (wrapper: ReturnType<typeof mountComponent>) => wrapper.findAllComponents(RcKeyValue).find((c) => c.attributes('data-testid') === 'annotations-keyvalue');

  describe('rendering', () => {
    it('should render an RcKeyValue for labels and one for annotations by default', () => {
      const wrapper = mountComponent();

      expect(wrapper.findAllComponents(RcKeyValue)).toHaveLength(2);
    });

    it('should not render the labels RcKeyValue when showLabels is false', () => {
      const wrapper = mountComponent({ showLabels: false });

      expect(findLabelsKeyValue(wrapper)).toBeUndefined();
    });

    it('should not render the annotations RcKeyValue when showAnnotations is false', () => {
      const wrapper = mountComponent({ showAnnotations: false });

      expect(findAnnotationsKeyValue(wrapper)).toBeUndefined();
    });

    it.each([
      [true, true],
      [false, false],
    ])('should render the labels title when showLabelTitle is %p', (showLabelTitle, expected) => {
      const wrapper = mountComponent({ showLabelTitle });

      expect(wrapper.find('h3').exists()).toBe(expected);
    });

    it('should render the labels title as h4 when compact', () => {
      const wrapper = mountComponent({ compact: true });

      expect(wrapper.find('h4').text()).toBe('%labels.labels.title%');
    });

    it.each([
      [true, true],
      [false, false],
    ])('should render the labels description when showLabelDescription is %p', (showLabelDescription, expected) => {
      const wrapper = mountComponent({ showLabelDescription });

      expect(wrapper.find('p').exists()).toBe(expected);
    });

    it.each([
      [true, '%labels.annotations.title%'],
      [false, ''],
    ])('should pass the annotations title when showAnnotationTitle is %p', (showAnnotationTitle, expected) => {
      const wrapper = mountComponent({ showAnnotationTitle });

      expect(findAnnotationsKeyValue(wrapper)?.props('title')).toBe(expected);
    });
  });

  describe('values', () => {
    it('should pass labels without protected keys to the labels RcKeyValue', () => {
      const wrapper = mountComponent();

      expect(findLabelsKeyValue(wrapper)?.props('value')).toStrictEqual({ 'my-label': 'my-value' });
    });

    it('should pass annotations to the annotations RcKeyValue', () => {
      const wrapper = mountComponent();

      expect(findAnnotationsKeyValue(wrapper)?.props('value')).toStrictEqual({ 'my-annotation': 'my-annotation' });
    });

    it('should disable read-only annotation keys', () => {
      const wrapper = mountComponent();

      expect(findAnnotationsKeyValue(wrapper)?.props('disabledKeys')).toStrictEqual(['read-only-annotation']);
    });

    it('should default disabled annotation keys to an empty list', () => {
      const wrapper = mountComponent({}, createValue({ readOnlyAnnotationKeys: undefined }));

      expect(findAnnotationsKeyValue(wrapper)?.props('disabledKeys')).toStrictEqual([]);
    });

    it('should keep protected labels when the labels RcKeyValue is updated', () => {
      const value = createValue();
      const wrapper = mountComponent({}, value);

      findLabelsKeyValue(wrapper)?.vm.$emit('update:value', { 'new-label': 'new-value' });

      expect(value.setLabels).toHaveBeenCalledWith({ 'new-label': 'new-value', 'kubernetes.io/hostname': 'node-1' });
    });

    it('should set annotations when the annotations RcKeyValue is updated', () => {
      const value = createValue();
      const wrapper = mountComponent({}, value);

      findAnnotationsKeyValue(wrapper)?.vm.$emit('update:value', { 'new-annotation': 'new-value' });

      expect(value.setAnnotations).toHaveBeenCalledWith({ 'new-annotation': 'new-value' });
    });
  });

  describe('showSystemKeys', () => {
    const systemValue = () => createValue({
      annotations:       { 'my-annotation': 'my-annotation', 'sys-annotation': 'sys-value' },
      systemAnnotations: ['sys-annotation'],
    });

    it('should not render a toggle of its own', () => {
      const wrapper = mountComponent({ mode: _VIEW });

      expect(wrapper.findComponent(ToggleSwitch).exists()).toBe(false);
    });

    it.each([
      [false, { 'my-label': 'my-value' }],
      [true, { 'my-label': 'my-value', 'kubernetes.io/hostname': 'node-1' }],
    ])('should pass the matching labels to the labels RcKeyValue when showSystemKeys is %p', (showSystemKeys, expected) => {
      const wrapper = mountComponent({ mode: _VIEW, showSystemKeys }, systemValue());

      expect(findLabelsKeyValue(wrapper)?.props('value')).toStrictEqual(expected);
    });

    it.each([
      [false, { 'my-annotation': 'my-annotation' }],
      [true, { 'my-annotation': 'my-annotation', 'sys-annotation': 'sys-value' }],
    ])('should pass the matching annotations to the annotations RcKeyValue when showSystemKeys is %p', (showSystemKeys, expected) => {
      const wrapper = mountComponent({ mode: _VIEW, showSystemKeys }, systemValue());

      expect(findAnnotationsKeyValue(wrapper)?.props('value')).toStrictEqual(expected);
    });
  });
});
