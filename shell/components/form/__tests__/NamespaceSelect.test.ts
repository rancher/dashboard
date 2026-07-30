import { shallowMount } from '@vue/test-utils';
import { createStore } from 'vuex';
import NamespaceSelect from '../NamespaceSelect.vue';
import LabeledSelectWithCreate from '@shell/components/form/LabeledSelectWithCreate.vue';
import { _CREATE, _EDIT } from '@shell/config/query-params';

const mockSetCreateNamespace = jest.fn();

const requiredSetup = (customGetters = {}) => {
  const store = createStore({
    getters: {
      'i18n/t':            () => (text: string) => text,
      t:                   () => (text: string) => text,
      allowedNamespaces:   () => () => ({ 'ns-1': { id: 'ns-1' } }),
      namespaces:          () => () => ({ 'ns-1': { id: 'ns-1' }, 'ns-2': { id: 'ns-2' } }),
      currentCluster:      () => ({ canUpdate: true }),
      currentStore:        () => () => 'cluster',
      'cluster/schemaFor': () => () => ({ collectionMethods: ['POST'] }),
      defaultNamespace:    () => 'default',
      ...customGetters,
    },
    actions: { 'cru-resource/setCreateNamespace': mockSetCreateNamespace }
  });

  return {
    global: {
      provide:    { store },
      components: { LabeledSelectWithCreate },
    }
  };
};

describe('namespaceSelect', () => {
  beforeEach(() => {
    mockSetCreateNamespace.mockClear();
  });

  it('mounts properly with default props', () => {
    const wrapper = shallowMount(NamespaceSelect, { ...requiredSetup() });

    expect(wrapper.exists()).toStrictEqual(true);
    expect(wrapper.findComponent(LabeledSelectWithCreate).exists()).toStrictEqual(true);
  });

  it('does not render LabeledSelectWithCreate when forceNamespace is provided', () => {
    const wrapper = shallowMount(NamespaceSelect, {
      ...requiredSetup(),
      props: { forceNamespace: 'forced-ns' },
    });

    expect(wrapper.findComponent(LabeledSelectWithCreate).exists()).toStrictEqual(false);
  });

  it.each([
    {
      desc:     'is in edit mode',
      props:    { mode: _EDIT },
      expected: true,
    },
    {
      desc:     'disabled prop is passed as true',
      props:    { disabled: true },
      expected: true,
    },
    {
      desc:     'forceNamespace is provided',
      props:    { forceNamespace: 'test-ns' },
      expected: true,
    },
    {
      desc:     'is in create mode and not disabled',
      props:    { mode: _CREATE, disabled: false },
      expected: false,
    },
  ])('calculates isReallyDisabled correctly when $desc', ({ props, expected }) => {
    const wrapper = shallowMount(NamespaceSelect, {
      ...requiredSetup(),
      props,
    });

    // We check the vm to access the computed property directly or through component binding
    const isReallyDisabled = (wrapper.vm as any).isReallyDisabled;

    expect(isReallyDisabled).toStrictEqual(expected);
  });

  it('uses overridden options if override prop is provided', () => {
    const wrapper = shallowMount(NamespaceSelect, {
      ...requiredSetup(),
      props: { override: ['override-ns-1', 'override-ns-2'] },
    });

    const selectOptions = (wrapper.vm as any).realNamespaceOptions;

    expect(selectOptions).toHaveLength(2);
    expect(selectOptions[0].value).toStrictEqual('override-ns-1');
  });

  it('uses options prop if provided instead of store', () => {
    const wrapper = shallowMount(NamespaceSelect, {
      ...requiredSetup(),
      props: { options: ['prop-ns-1', 'prop-ns-2'] },
    });

    const selectOptions = (wrapper.vm as any).realNamespaceOptions;

    expect(selectOptions).toHaveLength(2);
    expect(selectOptions[0].value).toStrictEqual('prop-ns-1');
  });

  it('pads namespaceSelectOptions with the current value when creating a namespace that does not exist yet', () => {
    const wrapper = shallowMount(NamespaceSelect, {
      ...requiredSetup(),
      props: { override: ['override-ns-1'], value: 'brand-new-ns' },
    });

    const selectOptions = (wrapper.vm as any).namespaceSelectOptions;

    expect(selectOptions).toContainEqual({ label: 'brand-new-ns', value: 'brand-new-ns' });
  });

  it('updates selected namespace externally when value prop changes', async() => {
    const wrapper = shallowMount(NamespaceSelect, {
      ...requiredSetup(),
      props: { value: 'initial-ns' },
    });

    expect((wrapper.vm as any).namespace).toStrictEqual('initial-ns');

    await wrapper.setProps({ value: 'updated-ns' });

    expect((wrapper.vm as any).namespace).toStrictEqual('updated-ns');
  });

  describe('labeledSelectWithCreate event delegations', () => {
    it('dispatches creation state correctly and emits on update', () => {
      const wrapper = shallowMount(NamespaceSelect, { ...requiredSetup() });

      const labeledSelect = wrapper.findComponent(LabeledSelectWithCreate);

      labeledSelect.vm.$emit('update:value', 'existing-ns');

      expect(mockSetCreateNamespace).toHaveBeenCalledWith(expect.anything(), false);
      expect(wrapper.emitted('update:value')).toBeTruthy();
      const emittedUpdate = wrapper.emitted('update:value') || [];

      expect(emittedUpdate[emittedUpdate.length - 1]).toStrictEqual(['existing-ns']);
    });

    it('dispatches creation true and emits isNamespaceNew on creating', () => {
      const wrapper = shallowMount(NamespaceSelect, { ...requiredSetup() });

      const labeledSelect = wrapper.findComponent(LabeledSelectWithCreate);

      labeledSelect.vm.$emit('creating');

      expect(mockSetCreateNamespace).toHaveBeenCalledWith(expect.anything(), true);
      expect(wrapper.emitted('isNamespaceNew')).toBeTruthy();
      const emittedNew = wrapper.emitted('isNamespaceNew') || [];

      expect(emittedNew[emittedNew.length - 1]).toStrictEqual([true]);
    });

    it('keeps the create-namespace flag true through live typing, with no separate confirm step', () => {
      const wrapper = shallowMount(NamespaceSelect, { ...requiredSetup() });

      const labeledSelect = wrapper.findComponent(LabeledSelectWithCreate);

      labeledSelect.vm.$emit('creating');
      mockSetCreateNamespace.mockClear();

      labeledSelect.vm.$emit('update:value', 'n');
      labeledSelect.vm.$emit('update:value', 'ne');
      labeledSelect.vm.$emit('update:value', 'new-ns');

      expect(mockSetCreateNamespace).not.toHaveBeenCalledWith(expect.anything(), false);
      expect(wrapper.emitted('update:value')).toStrictEqual([['n'], ['ne'], ['new-ns']]);
    });

    it('dispatches creation false again once cancelled and an existing namespace is subsequently picked', () => {
      const wrapper = shallowMount(NamespaceSelect, { ...requiredSetup() });

      const labeledSelect = wrapper.findComponent(LabeledSelectWithCreate);

      labeledSelect.vm.$emit('creating');
      labeledSelect.vm.$emit('update:value', 'partial-typed-name');
      labeledSelect.vm.$emit('cancel');
      mockSetCreateNamespace.mockClear();

      labeledSelect.vm.$emit('update:value', 'ns-1');

      expect(mockSetCreateNamespace).toHaveBeenCalledWith(expect.anything(), false);
    });

    it('resets to default namespace and dispatches creation false on cancel', () => {
      const wrapper = shallowMount(NamespaceSelect, { ...requiredSetup() });

      const labeledSelect = wrapper.findComponent(LabeledSelectWithCreate);

      labeledSelect.vm.$emit('cancel');

      expect(mockSetCreateNamespace).toHaveBeenCalledWith(expect.anything(), false);
      expect(wrapper.emitted('update:value')).toBeTruthy();
      const emittedUpdate = wrapper.emitted('update:value') || [];

      expect(emittedUpdate[emittedUpdate.length - 1]).toStrictEqual(['default']);
    });
  });
});
