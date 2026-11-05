import { flushPromises, shallowMount } from '@vue/test-utils';
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

  it('renders LabeledSelectWithCreate disabled, showing the forced namespace, when forceNamespace is provided', () => {
    const wrapper = shallowMount(NamespaceSelect, {
      ...requiredSetup(),
      props: { forceNamespace: 'forced-ns' },
    });

    const labeledSelect = wrapper.findComponent(LabeledSelectWithCreate);

    expect(labeledSelect.exists()).toStrictEqual(true);
    expect(labeledSelect.props('disabled')).toStrictEqual(true);
    expect(labeledSelect.props('value')).toStrictEqual('forced-ns');
  });

  it.each<{ desc: string, props: { mode?: string, disabled?: boolean, forceNamespace?: string }, expected: boolean }>([
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

  describe('namespaces offered when creating a resource', () => {
    const NS_COLLECTION = '/v1/namespaces';

    const schemas: Record<string, object> = {
      namespace:          { links: { collection: NS_COLLECTION }, collectionMethods: ['POST'] },
      secret:             { attributes: { namespaced: true } },
      chartInstallAction: { attributes: {} },
    };

    const EXISTING = ['can-create', 'also-can-create', 'read-only'];

    const permissionsSetup = (request: jest.Mock, schemaOverrides: Record<string, object> = {}) => {
      const store = createStore({
        getters: {
          'i18n/t':            () => (text: string) => text,
          t:                   () => (text: string) => text,
          namespaces:          () => () => Object.fromEntries(EXISTING.map((id) => [id, { id }])),
          allowedNamespaces:   () => () => ({}),
          currentCluster:      () => ({ canUpdate: true }),
          currentStore:        () => () => 'cluster',
          'cluster/schemaFor': () => (type: string) => ({ ...schemas, ...schemaOverrides })[type],
          'cluster/byId':      () => (_: string, id: string) => (EXISTING.includes(id) ? { id } : undefined),
          defaultNamespace:    () => 'default',
        },
        actions: {
          'cru-resource/setCreateNamespace': mockSetCreateNamespace,
          'cluster/request':                 (_: unknown, opt: unknown) => request(opt),
        }
      });

      return { global: { provide: { store }, components: { LabeledSelectWithCreate } } };
    };

    const mountCreate = (request: jest.Mock, props: object = { resourceType: 'secret' }, schemaOverrides = {}) => shallowMount(NamespaceSelect, {
      ...permissionsSetup(request, schemaOverrides),
      props: {
        mode: _CREATE, noDefaultNamespace: true, ...props
      },
    });

    const optionValues = (wrapper: any) => wrapper.findComponent(LabeledSelectWithCreate).props('options').map((o: any) => o.value);

    const requestAllowingCreateIn = (...allowed: string[]) => jest.fn().mockResolvedValue({ data: EXISTING.map((id) => ({ id, resourcePermissions: { secret: allowed.includes(id) ? { create: 'url' } : {} } })) });
    const failingRequest = () => jest.fn().mockRejectedValue(new Error('boom'));
    const requestIgnoringCheckPermissions = () => jest.fn().mockResolvedValue({ data: EXISTING.map((id) => ({ id })) });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('lists the namespaces the user may create the resource in, even though it cannot update any of them', async() => {
      const request = jest.fn().mockResolvedValue({
        data: [
          { id: 'can-create', resourcePermissions: { secret: { create: 'url' } } },
          { id: 'also-can-create', resourcePermissions: { secret: { create: 'url', get: 'url' } } },
          { id: 'read-only', resourcePermissions: { secret: { get: 'url' } } },
        ]
      });

      const wrapper = mountCreate(request);

      await flushPromises();

      expect(optionValues(wrapper)).toStrictEqual(['also-can-create', 'can-create']);
      expect(request).toHaveBeenCalledWith({ url: `${ NS_COLLECTION }?checkPermissions=secret&include=metadata.name` });
    });

    it('shows the select as loading until the permissions are known', async() => {
      let resolveRequest: (value: unknown) => void = () => {};
      const request = jest.fn().mockReturnValue(new Promise((resolve) => {
        resolveRequest = resolve;
      }));

      const select = mountCreate(request).findComponent(LabeledSelectWithCreate);

      expect(select.props('loading')).toStrictEqual(true);

      resolveRequest({ data: [] });
      await flushPromises();

      expect(select.props('loading')).toStrictEqual(false);
    });

    it.each([
      ['the request fails', failingRequest],
      ['the API does not support checkPermissions', requestIgnoringCheckPermissions],
    ])('lists every namespace when %s', async(_, createRequest) => {
      jest.spyOn(console, 'warn').mockImplementation(() => {});

      const wrapper = mountCreate(createRequest());

      await flushPromises();

      expect(optionValues(wrapper)).toStrictEqual(['also-can-create', 'can-create', 'read-only']);
      expect(wrapper.findComponent(LabeledSelectWithCreate).props('loading')).toStrictEqual(false);
    });

    it.each<{ desc: string, props: object }>([
      { desc: 'editing', props: { mode: _EDIT, resourceType: 'secret' } },
      { desc: 'no resource type is given', props: {} },
      { desc: 'the type is not a namespaced resource', props: { resourceType: 'chartInstallAction' } },
      { desc: 'the type has no schema', props: { resourceType: 'unknown' } },
    ])('does not check permissions and lists every namespace when $desc', async({ props }) => {
      const request = jest.fn();

      const wrapper = mountCreate(request, props);

      await flushPromises();

      expect(request).not.toHaveBeenCalled();
      expect(optionValues(wrapper)).toStrictEqual(['also-can-create', 'can-create', 'read-only']);
    });

    it('does not check permissions and lists every namespace when the namespace schema has no collection link', async() => {
      const request = jest.fn();

      const wrapper = mountCreate(request, { resourceType: 'secret' }, { namespace: { links: {} } });

      await flushPromises();

      expect(request).not.toHaveBeenCalled();
      expect(optionValues(wrapper)).toStrictEqual(['also-can-create', 'can-create', 'read-only']);
    });

    it('moves a pre-selected namespace the user may not create in to the first one it may', async() => {
      const wrapper = mountCreate(requestAllowingCreateIn('can-create', 'also-can-create'), { resourceType: 'secret', value: 'read-only' });

      await flushPromises();

      expect(wrapper.emitted('update:value')).toStrictEqual([['also-can-create']]);
      expect(wrapper.findComponent(LabeledSelectWithCreate).props('value')).toStrictEqual('also-can-create');
    });

    it('clears a pre-selected namespace when the user may not create in any namespace', async() => {
      const wrapper = mountCreate(requestAllowingCreateIn(), { resourceType: 'secret', value: 'read-only' });

      await flushPromises();

      expect(wrapper.emitted('update:value')).toStrictEqual([[null]]);
      expect(wrapper.findComponent(LabeledSelectWithCreate).props('value')).toBeNull();
    });

    it.each([
      ['the user may create in it', 'can-create', () => requestAllowingCreateIn('can-create')],
      ['it does not exist yet', 'brand-new-ns', () => requestAllowingCreateIn('can-create')],
      ['the permissions cannot be checked', 'read-only', failingRequest],
    ])('keeps the pre-selected namespace when %s', async(_, value, createRequest) => {
      jest.spyOn(console, 'warn').mockImplementation(() => {});

      const wrapper = mountCreate(createRequest(), { resourceType: 'secret', value });

      await flushPromises();

      expect(wrapper.emitted('update:value')).toBeUndefined();
      expect(wrapper.findComponent(LabeledSelectWithCreate).props('value')).toStrictEqual(value);
    });

    it.each<{ desc: string, props: object }>([
      { desc: 'override', props: { override: ['given-ns'] } },
      { desc: 'options', props: { options: ['given-ns'] } },
      { desc: 'forceNamespace', props: { forceNamespace: 'given-ns' } },
    ])('does not check permissions when the namespaces come from $desc', async({ props }) => {
      const request = jest.fn();

      mountCreate(request, { resourceType: 'secret', ...props });

      await flushPromises();

      expect(request).not.toHaveBeenCalled();
    });
  });

  describe('create option', () => {
    it.each<{ desc: string, props: { createAllowed?: boolean, createNamespaceOverride?: boolean }, getters: object, expected: boolean }>([
      {
        desc: 'the user can create namespaces', props: {}, getters: {}, expected: true
      },
      {
        desc: 'createAllowed is false', props: { createAllowed: false }, getters: {}, expected: false
      },
      {
        desc: 'createAllowed is false despite createNamespaceOverride', props: { createAllowed: false, createNamespaceOverride: true }, getters: {}, expected: false
      },
      {
        desc: 'the user cannot create namespaces', props: {}, getters: { currentCluster: () => ({ canUpdate: false }) }, expected: false
      },
    ])('is offered ($expected) when $desc', ({ props, getters, expected }) => {
      const wrapper = shallowMount(NamespaceSelect, {
        ...requiredSetup(getters),
        props,
      });

      expect(wrapper.findComponent(LabeledSelectWithCreate).props('createAllowed')).toStrictEqual(expected);
    });

    it.each([
      ['the user can create namespaces', {}, {}, true],
      ['createAllowed is false', { createAllowed: false }, {}, false],
      ['the user cannot create namespaces', {}, { currentCluster: () => ({ canUpdate: false }) }, false],
    ])('can be cleared only when a namespace can be created: %s', (_, props, getters, expected) => {
      const wrapper = shallowMount(NamespaceSelect, {
        ...requiredSetup(getters),
        props,
      });

      expect(wrapper.findComponent(LabeledSelectWithCreate).props('clearable')).toStrictEqual(expected);
    });
  });
});
