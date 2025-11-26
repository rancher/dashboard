import { mount } from '@vue/test-utils';
import Labels, { Factory } from '@shell/components/form/Labels.vue';
import KeyValue from '@shell/components/form/KeyValue.vue';
import { ToggleSwitch } from '@rc/Form/ToggleSwitch';
import { _EDIT, _VIEW } from '@shell/config/query-params';

const mockT = jest.fn((key: string) => key);

describe('class: Factory', () => {
  const mockProtectedWarning = 'Protected Key';

  it('should correctly initialize with no protected keys or regexes', () => {
    const factory = new Factory([], [], mockProtectedWarning, { a: '1', b: '2' });

    expect((factory as any).protectedKeys).toStrictEqual([]);
    expect((factory as any).protectedRegexes).toStrictEqual([]);
    expect((factory as any).protectedWarning).toBe(mockProtectedWarning);
    expect(factory.initValue).toStrictEqual({ a: '1', b: '2' });
    expect(factory.value).toStrictEqual({ a: '1', b: '2' });
    expect(factory.keyErrors).toStrictEqual({});
    expect(factory.hasProtectedKeys).toBe(false);
  });

  it('should correctly initialize with protected keys', () => {
    const factory = new Factory(['key1'], [], mockProtectedWarning, { key1: 'value1', key2: 'value2' });

    expect((factory as any).protectedKeys).toStrictEqual(['key1']);
    expect(factory.value).toStrictEqual({ key2: 'value2' });
    expect(factory.hasProtectedKeys).toBe(true);
  });

  it('should correctly initialize with protected regexes', () => {
    const factory = new Factory([], [/^key/], mockProtectedWarning, { key1: 'value1', other: 'value2' });

    expect((factory as any).protectedRegexes.map((r: RegExp) => r.source)).toStrictEqual(['^key']);
    expect(factory.value).toStrictEqual({ other: 'value2' });
    expect(factory.hasProtectedKeys).toBe(true);
  });

  it('should omit protected keys from value but keep them in initValue', () => {
    const factory = new Factory(['protected'], [], mockProtectedWarning, { protected: 'pVal', normal: 'nVal' });

    expect(factory.initValue).toStrictEqual({ protected: 'pVal', normal: 'nVal' });
    expect(factory.value).toStrictEqual({ normal: 'nVal' });
  });

  it('should update value and call callbackFn, preserving initial protected keys', () => {
    const initialValue = {
      system: 'sysVal', user: 'userVal', system2: 'sysVal'
    };
    const factory = new Factory(['system', 'system2'], [], mockProtectedWarning, initialValue);
    const callback = jest.fn();

    const newValue = {
      newUser: 'newUVal', user: 'updatedUserVal', newProtected: 'newPVal', system: 'foo'
    };

    factory.update(newValue, callback);

    // The internal factory.value is just the new set
    expect(factory.value).toStrictEqual(newValue);

    // The callback should receive the mix of new unprotected values and initial protected values
    expect(callback).toHaveBeenCalledWith({
      newProtected: 'newPVal',
      newUser:      'newUVal',
      user:         'updatedUserVal',
      system:       'sysVal', // 'system' is the original protected from initialValue, sysVal is the original value
      system2:      'sysVal' // 'system2' is the original protected from initialValue
    });
  });

  it('should handle null/undefined update value gracefully', () => {
    const initialValue = { system: 'sysVal', user: 'userVal' };
    const factory = new Factory(['system'], [], mockProtectedWarning, initialValue);
    const callback = jest.fn();

    factory.update({}, callback);

    expect(factory.value).toStrictEqual({});
    expect(factory.keyErrors).toStrictEqual({});
    expect(callback).toHaveBeenCalledWith({ system: 'sysVal' }); // Only the original protected values
  });

  it('should correctly identify protected keys based on both array and regex', () => {
    const factory = new Factory(['staticKey'], [/^dynamic/], mockProtectedWarning, {});

    expect((factory as any).isProtected('staticKey')).toBe(true);
    expect((factory as any).isProtected('dynamicKey')).toBe(true);
    expect((factory as any).isProtected('otherKey')).toBe(false);
  });
});

describe('component: Labels', () => {
  const mockValue = {
    labels: {
      'kubernetes.io/hostname': 'test-app',
      'my-label':               'my-value'
    },
    systemLabels: ['kubernetes.io/hostname'],
    annotations:  {
      'cattle.io/system': 'user',
      'my-annotation':    'my-annotation'
    },
    systemAnnotations: ['cattle.io/system'],
    setLabels:         jest.fn(),
    setAnnotations:    jest.fn(),
  };

  it('should initialize with correct data properties', () => {
    const wrapper = mount(Labels, {
      props: {
        value: mockValue,
        mode:  'create',
      },
      global: { mocks: { t: mockT } },
    });

    const data = (wrapper.vm as any).$data;

    expect(data.labels).toBeDefined();
    expect(data.labels.initValue).toStrictEqual(mockValue.labels);
    expect(data.labels.protectedKeys).toStrictEqual(mockValue.systemLabels);
    expect(data.labels.value).toStrictEqual({ 'my-label': 'my-value' });
    expect(data.labels.hasProtectedKeys).toBe(true);
    expect(data.labels.keyErrors).toStrictEqual({}); // only when manually update

    expect(data.annotations).toBeDefined();
    expect(data.annotations.initValue).toStrictEqual(mockValue.annotations);
    expect(data.annotations.protectedKeys).toStrictEqual(mockValue.systemAnnotations);
    expect(data.annotations.value).toStrictEqual({ 'my-annotation': 'my-annotation' });
    expect(data.annotations.hasProtectedKeys).toBe(true);
    expect(data.annotations.keyErrors).toStrictEqual({}); // only when manually update

    expect(data.toggler).toBe(false);
  });

  it('should render KeyValue for labels', () => {
    const wrapper = mount(Labels, {
      props: {
        value: mockValue,
        mode:  'create',
      },
      global: { mocks: { t: mockT } },
    });

    const labelsKeyValue = wrapper.findComponent(KeyValue);

    expect(labelsKeyValue.exists()).toBe(true);
    expect(labelsKeyValue.props('value')).toStrictEqual({ 'my-label': 'my-value' });
    expect(labelsKeyValue.props('addLabel')).toBe('labels.addLabel');
    expect(labelsKeyValue.props('mode')).toBe('create');
    expect(labelsKeyValue.props('keyErrors')).toStrictEqual({});
  });

  it('should render KeyValue for annotations if showAnnotations is true', () => {
    const wrapper = mount(Labels, {
      props: {
        value:           mockValue,
        mode:            'create',
        showAnnotations: true,
      },
      global: { mocks: { t: mockT } },
    });

    const keyValueComponents = wrapper.findAllComponents(KeyValue);

    expect(keyValueComponents).toHaveLength(2);
    const annotationsKeyValue = keyValueComponents[1]; // The second KeyValue is for annotations

    expect(annotationsKeyValue.exists()).toBe(true);
    expect(annotationsKeyValue.props('value')).toStrictEqual({ 'my-annotation': 'my-annotation' });
    expect(annotationsKeyValue.props('addLabel')).toBe('labels.addAnnotation');
    expect(annotationsKeyValue.props('mode')).toBe('create');
    expect(annotationsKeyValue.props('keyErrors')).toStrictEqual({});
  });

  it('should not render KeyValue for annotations if showAnnotations is false', () => {
    const wrapper = mount(Labels, {
      props: {
        value:           mockValue,
        mode:            'create',
        showAnnotations: false,
      },
      global: { mocks: { t: mockT } },
    });

    const keyValueComponents = wrapper.findAllComponents(KeyValue);

    expect(keyValueComponents).toHaveLength(1); // Only the KeyValue for labels
  });

  it('should show ToggleSwitch in VIEW mode if there are protected keys', async() => {
    const wrapper = mount(Labels, {
      props: {
        value: mockValue,
        mode:  _VIEW,
      },
      global: { mocks: { t: mockT } },
    });

    expect((wrapper.vm as any).showToggler).toBe(true);
    const toggleSwitch = wrapper.findComponent(ToggleSwitch);

    expect(toggleSwitch.exists()).toBe(true);
    expect(toggleSwitch.props('onLabel')).toBe('labels.labels.show');
  });

  it('should not show ToggleSwitch in non-VIEW mode', () => {
    const wrapper = mount(Labels, {
      props: {
        value: mockValue,
        mode:  _EDIT,
      },
      global: { mocks: { t: mockT } },
    });

    expect((wrapper.vm as any).showToggler).toBe(false);
    expect(wrapper.findComponent(ToggleSwitch).exists()).toBe(false);
  });

  it('should not show ToggleSwitch in VIEW mode if no protected keys', () => {
    const mockValueNoProtected = {
      labels:            { 'my-label': 'my-value' },
      systemLabels:      [],
      annotations:       { 'my-annotation': 'my-annotation' },
      systemAnnotations: [],
      setLabels:         jest.fn(),
      setAnnotations:    jest.fn(),
    };

    const wrapper = mount(Labels, {
      props: {
        value: mockValueNoProtected,
        mode:  _VIEW,
      },
      global: { mocks: { t: mockT } },
    });

    expect((wrapper.vm as any).showToggler).toBe(false);
    expect(wrapper.findComponent(ToggleSwitch).exists()).toBe(false);
  });

  it('should toggle label values when ToggleSwitch is activated', async() => {
    const wrapper = mount(Labels, {
      props: {
        value: mockValue,
        mode:  _VIEW,
      },
      global: { mocks: { t: mockT } },
    });

    const labelsKeyValue = wrapper.findComponent(KeyValue);

    expect(labelsKeyValue.props('value')).toStrictEqual({ 'my-label': 'my-value' }); // Initial: hidden protected

    // Activate the toggle
    await wrapper.findComponent(ToggleSwitch).vm.$emit('update:value', true);
    await wrapper.vm.$nextTick();

    expect((wrapper.vm as any).toggler).toBe(true);
    expect(labelsKeyValue.props('value')).toStrictEqual(mockValue.labels); // Should show all labels including protected
  });

  it('should toggle annotation values when ToggleSwitch is activated', async() => {
    const wrapper = mount(Labels, {
      props: {
        value: mockValue,
        mode:  _VIEW,
      },
      global: { mocks: { t: mockT } },
    });

    const annotationsKeyValue = wrapper.findAllComponents(KeyValue)[1];

    expect(annotationsKeyValue.props('value')).toStrictEqual({ 'my-annotation': 'my-annotation' }); // Initial: hidden protected

    // Activate the toggle
    await wrapper.findComponent(ToggleSwitch).vm.$emit('update:value', true);
    await wrapper.vm.$nextTick();

    expect((wrapper.vm as any).toggler).toBe(true);
    expect(annotationsKeyValue.props('value')).toStrictEqual(mockValue.annotations); // Should show all annotations including protected
  });

  it('should call setLabels when labels KeyValue emits update:value', async() => {
    const wrapper = mount(Labels, {
      props: {
        value: mockValue,
        mode:  'create',
      },
      global: { mocks: { t: mockT } },
    });

    const labelsKeyValue = wrapper.findComponent(KeyValue);
    const newLabels = { 'new-label': 'new-value', 'my-label': 'my-value' };

    await labelsKeyValue.vm.$emit('update:value', newLabels);

    // We expect setLabels to be called with the new values, preserving initial protected ones
    expect(mockValue.setLabels).toHaveBeenCalledWith({
      'new-label':              'new-value',
      'my-label':               'my-value',
      'kubernetes.io/hostname': 'test-app'
    });
  });

  it('should call setAnnotations when annotations KeyValue emits update:value', async() => {
    const wrapper = mount(Labels, {
      props: {
        value:           mockValue,
        mode:            'create',
        showAnnotations: true,
      },
      global: { mocks: { t: mockT } },
    });

    const annotationsKeyValue = wrapper.findAllComponents(KeyValue)[1];
    const newAnnotations = { 'new-anno': 'new-value', 'my-annotation': 'my-annotation' };

    await annotationsKeyValue.vm.$emit('update:value', newAnnotations);

    // We expect setAnnotations to be called with the new values, preserving initial protected ones
    expect(mockValue.setAnnotations).toHaveBeenCalledWith({
      'new-anno':         'new-value',
      'my-annotation':    'my-annotation',
      'cattle.io/system': 'user'
    });
  });

  it('should add newly entered protected keys to keyErrors', async() => {
    const wrapper = mount(Labels, {
      props: {
        value: mockValue,
        mode:  'create',
      },
      global: { mocks: { t: mockT } },
    });

    // Insert new protected key
    const newLabels = {
      'my-label':               'my-value',
      'kubernetes.io/hostname': 'new-protected-value',
      'non-protected':          'value'
    };

    await wrapper.vm.labels.update(newLabels, () => {});
    await wrapper.vm.$nextTick();

    // Expect to add protected labels in keyErrors
    expect((wrapper.vm as any).labels.keyErrors).toStrictEqual({ 'kubernetes.io/hostname': 'labels.protectedWarning' });

    // On edit, should key the protected label in the list
    expect((wrapper.vm as any).labels.value).toStrictEqual({
      'my-label':               'my-value',
      'kubernetes.io/hostname': 'new-protected-value',
      'non-protected':          'value'
    });
  });
});
