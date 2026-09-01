import { shallowMount } from '@vue/test-utils';
import { createStore } from 'vuex';
import NameNsDescription from '../NameNsDescription.vue';
import { _CREATE, _EDIT } from '@shell/config/query-params';

const requiredSetup = () => {
  const store = createStore({
    getters: { defaultNamespace: () => 'default' },
    modules: {
      'cru-resource': {
        namespaced: true,
        actions:    { setCreateNamespace: jest.fn() }
      }
    }
  });

  return {
    global: {
      plugins: [store],
      mocks:   { t: (text: string) => text },
      stubs:   {
        LabeledInput: {
          name:     'LabeledInput',
          template: '<input />',
          methods:  { focus: jest.fn() },
        },
        NamespaceSelect: {
          name:     'NamespaceSelect',
          template: '<div class="namespace-select" />',
        },
      }
    }
  };
};

describe('nameNsDescription', () => {
  it('mounts and renders correctly with default props', () => {
    const wrapper = shallowMount(NameNsDescription, {
      ...requiredSetup(),
      props: {
        value: { metadata: { name: 'test-name', namespace: 'test-ns' } },
        mode:  _CREATE,
      },
    });

    expect(wrapper.exists()).toStrictEqual(true);
  });

  it.each([
    {
      desc:     'create mode, not disabled',
      props:    { mode: _CREATE },
      expected: false,
    },
    {
      desc:     'edit mode, name not editable',
      props:    { mode: _EDIT },
      expected: true,
    },
    {
      desc:     'edit mode, name editable',
      props:    { mode: _EDIT, nameEditable: true },
      expected: false,
    },
    {
      desc:     'disabled prop is true',
      props:    { mode: _CREATE, nameDisabled: true },
      expected: true,
    },
  ])('calculates nameReallyDisabled correctly when $desc', ({ props, expected }) => {
    const wrapper = shallowMount(NameNsDescription, {
      ...requiredSetup(),
      props: {
        value: { metadata: {} },
        ...props,
      },
    });

    const nameReallyDisabled = (wrapper.vm as any).nameReallyDisabled;

    expect(nameReallyDisabled).toStrictEqual(expected);
  });

  it.each([
    {
      desc:     'create mode, not disabled',
      props:    { mode: _CREATE },
      expected: false,
    },
    {
      desc:     'edit mode',
      props:    { mode: _EDIT },
      expected: true,
    },
    {
      desc:     'disabled prop is true',
      props:    { mode: _CREATE, namespaceDisabled: true },
      expected: true,
    },
    {
      desc:     'forceNamespace is set',
      props:    { mode: _CREATE, forceNamespace: 'custom' },
      expected: true,
    },
  ])('calculates namespaceReallyDisabled correctly when $desc', ({ props, expected }) => {
    const wrapper = shallowMount(NameNsDescription, {
      ...requiredSetup(),
      props: {
        value: { metadata: {} },
        ...props,
      },
    });

    const namespaceReallyDisabled = (wrapper.vm as any).namespaceReallyDisabled;

    expect(namespaceReallyDisabled).toStrictEqual(expected);
  });

  it.each([
    {
      desc:       'nameHidden is true',
      props:      { nameHidden: true },
      nameExists: false,
      nsExists:   true,
      descExists: true,
    },
    {
      desc:       'descriptionHidden is true',
      props:      { descriptionHidden: true },
      nameExists: true,
      nsExists:   true,
      descExists: false,
    },
    {
      desc:       'nameNsHidden is true',
      props:      { nameNsHidden: true },
      nameExists: false,
      nsExists:   false,
      descExists: true,
    },
  ])('hides sections appropriately when $desc', ({
    props, nameExists, nsExists, descExists
  }) => {
    const wrapper = shallowMount(NameNsDescription, {
      ...requiredSetup(),
      props: {
        value: { metadata: {} },
        mode:  _CREATE,
        ...props,
      },
    });

    expect(wrapper.find('[data-testid="name-ns-description-name"]').exists()).toStrictEqual(nameExists);
    expect(wrapper.find('[data-testid="name-ns-description-namespace"]').exists()).toStrictEqual(nsExists);
    expect(wrapper.find('[data-testid="name-ns-description-description"]').isVisible()).toStrictEqual(descExists);
  });

  it('applies custom componentTestid to wrappers', () => {
    const wrapper = shallowMount(NameNsDescription, {
      ...requiredSetup(),
      props: {
        value:           { metadata: {} },
        mode:            _CREATE,
        componentTestid: 'custom-prefix',
      },
    });

    expect(wrapper.find('[data-testid="custom-prefix-name"]').exists()).toStrictEqual(true);
    expect(wrapper.find('[data-testid="custom-prefix-namespace"]').exists()).toStrictEqual(true);
    expect(wrapper.find('[data-testid="custom-prefix-description"]').exists()).toStrictEqual(true);
  });

  it('emits update:value when name is updated', async() => {
    const value = { metadata: { name: 'old', namespace: 'default' } };
    const wrapper = shallowMount(NameNsDescription, {
      ...requiredSetup(),
      props: {
        value,
        mode: _CREATE,
      },
    });

    const nameInput = wrapper.findComponent({ name: 'LabeledInput' });

    nameInput.vm.$emit('update:value', 'new-name');
    await wrapper.vm.$nextTick();

    expect(wrapper.emitted('update:value')).toBeTruthy();

    const emittedEvents = wrapper.emitted('update:value') || [];
    const lastEmittedValue = emittedEvents[emittedEvents.length - 1][0] as any;

    expect(lastEmittedValue.metadata.name).toStrictEqual('new-name');
  });

  it('updates using custom keys when provided', async() => {
    const value = {
      spec: {
        myName: '', myNs: '', myDesc: ''
      }
    };
    const wrapper = shallowMount(NameNsDescription, {
      ...requiredSetup(),
      props: {
        value,
        mode:           _CREATE,
        nameKey:        'spec.myName',
        namespaceKey:   'spec.myNs',
        descriptionKey: 'spec.myDesc',
      },
    });

    const namespaceSelect = wrapper.findComponent({ name: 'NamespaceSelect' });

    namespaceSelect.vm.$emit('update:value', 'new-ns');
    await wrapper.vm.$nextTick();

    expect(wrapper.emitted('update:value')).toBeTruthy();

    const emittedEvents = wrapper.emitted('update:value') || [];
    const lastEmittedValue = emittedEvents[emittedEvents.length - 1][0] as any;

    expect(lastEmittedValue.spec.myNs).toStrictEqual('new-ns');
  });

  it('persists forceNamespace into value.metadata.namespace immediately on mount', () => {
    const value = { metadata: { name: 'test-name', namespace: '' } };
    const wrapper = shallowMount(NameNsDescription, {
      ...requiredSetup(),
      props: {
        value,
        mode:           _CREATE,
        forceNamespace: 'forced-ns',
      },
    });

    expect(value.metadata.namespace).toStrictEqual('forced-ns');
    expect(wrapper.emitted('update:value')).toBeTruthy();
  });

  it('persists forceNamespace via namespaceKey immediately on mount, when provided', () => {
    const value = { metadata: {}, spec: { myNs: '' } };
    const wrapper = shallowMount(NameNsDescription, {
      ...requiredSetup(),
      props: {
        value,
        mode:           _CREATE,
        namespaceKey:   'spec.myNs',
        forceNamespace: 'forced-ns',
      },
    });

    expect(value.spec.myNs).toStrictEqual('forced-ns');
    expect(wrapper.emitted('update:value')).toBeTruthy();
  });
});
