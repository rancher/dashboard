import { shallowMount } from '@vue/test-utils';
import SecretIndex from '@shell/edit/secret/index.vue';
import { SECRET_SCOPE, SECRET_QUERY_PARAMS, _CREATE } from '@shell/config/query-params';
import { UI_PROJECT_SECRET } from '@shell/config/labels-annotations';

describe('component: Secret Index', () => {
  const mockStore = {
    getters: {
      currentCluster:                               { id: 'local' },
      'management/all':                             jest.fn(),
      'cluster/all':                                jest.fn(),
      'prefs/get':                                  jest.fn(),
      'i18n/t':                                     (key) => key,
      'i18n/withFallback':                          (key, args, fallback) => fallback,
      'type-map/hasCustomCloudCredentialComponent': jest.fn().mockReturnValue(false),
      'type-map/importCloudCredential':             jest.fn(),
      'management/urlFor':                          jest.fn(),
      'plugins/credentialDriverFor':                jest.fn(),
      allowedNamespaces:                            jest.fn().mockReturnValue({}),
      namespaces:                                   jest.fn().mockReturnValue({}),
      defaultNamespace:                             'default',
      currentStore:                                 () => 'cluster',
      'cluster/schemaFor':                          jest.fn(),
    },
    dispatch: jest.fn(),
  };

  const defaultProps = {
    value: {
      _type:    'Opaque',
      metadata: {
        labels:      {},
        annotations: {},
        name:        '',
        namespace:   '',
      },
    },
    mode: _CREATE,
  };

  const createWrapper = (props = {}, routeQuery = {}, mocks = {}) => {
    return shallowMount(SecretIndex, {
      props: {
        ...defaultProps,
        ...props,
      },
      global: {
        mocks: {
          $store:      mockStore,
          $route:      { query: routeQuery },
          $fetchState: { pending: false },
          ...mocks,
        },
        stubs: {
          CruResource:       { template: '<div><slot/></div>' },
          NameNsDescription: true,
          LabeledSelect:     true,
          LabeledInput:      true,
          Loading:           true,
          Tabbed:            true,
          Tab:               true,
          Labels:            true,
        },
        directives: {
          focus: {
            mounted() {},
            updated() {}
          }
        }
      },
    });
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockStore.getters['management/all'].mockReturnValue([]);
    mockStore.getters['cluster/all'].mockReturnValue([]);
  });

  it('should pick the first project with a backingNamespace on fetch', async() => {
    const projects = [
      {
        metadata: { name: 'p1' },
        spec:     { clusterName: 'local' },
        status:   {}
      },
      {
        metadata: { name: 'p2' },
        spec:     { clusterName: 'local' },
        status:   { backingNamespace: 'ns-p2' }
      }
    ];

    mockStore.getters['management/all'].mockReturnValue(projects);

    const wrapper = createWrapper({}, { [SECRET_SCOPE]: SECRET_QUERY_PARAMS.PROJECT_SCOPED });

    // Trigger fetch
    await SecretIndex.fetch.call(wrapper.vm);

    expect(wrapper.vm.projectName).toBe('p2');
    expect(wrapper.vm.value.metadata.namespace).toBe('ns-p2');
    expect(wrapper.vm.value.metadata.labels[UI_PROJECT_SECRET]).toBe('p2');
  });

  it('should remove namespace validation rule when isProjectScoped is true', async() => {
    const wrapper = createWrapper();

    // Initially has validation rule
    expect(wrapper.vm.fvFormRuleSets).toStrictEqual(expect.arrayContaining([
      expect.objectContaining({ path: 'metadata.namespace' })
    ]));

    // Set isProjectScoped to true
    wrapper.setData({ isProjectScoped: true });
    await wrapper.vm.$nextTick();

    // Validation rule should be removed
    expect(wrapper.vm.fvFormRuleSets).not.toStrictEqual(expect.arrayContaining([
      expect.objectContaining({ path: 'metadata.namespace' })
    ]));
  });

  it('should update namespace when projectName changes', async() => {
    const projects = [
      {
        metadata: { name: 'p1' },
        spec:     { clusterName: 'local' },
        status:   { backingNamespace: 'ns-p1' }
      }
    ];

    mockStore.getters['management/all'].mockReturnValue(projects);

    const wrapper = createWrapper({}, { [SECRET_SCOPE]: SECRET_QUERY_PARAMS.PROJECT_SCOPED });

    wrapper.setData({ isProjectScoped: true }); // Manually set since fetch isn't called automatically in shallowMount without lifecycle hooks sometimes or we want to bypass it

    // Change project name
    wrapper.setData({ projectName: 'p1' });
    await wrapper.vm.$nextTick();

    expect(wrapper.vm.value.metadata.namespace).toBe('ns-p1');
  });

  it('should clear namespace when projectName changes to a project without backingNamespace', async() => {
    const projects = [
      {
        metadata: { name: 'p1' },
        spec:     { clusterName: 'local' },
        status:   {} // No backing namespace
      }
    ];

    mockStore.getters['management/all'].mockReturnValue(projects);

    const wrapper = createWrapper({}, { [SECRET_SCOPE]: SECRET_QUERY_PARAMS.PROJECT_SCOPED });

    // Set initial namespace
    wrapper.vm.value.metadata.namespace = 'initial-ns';
    wrapper.setData({ isProjectScoped: true });

    // Change project name
    wrapper.setData({ projectName: 'p1' });
    await wrapper.vm.$nextTick();

    expect(wrapper.vm.value.metadata.namespace).toBeNull();
  });

  it('should fail validation in saveSecret if namespace is missing when Project Scoped', async() => {
    const wrapper = createWrapper();

    wrapper.setData({ isProjectScoped: true });
    wrapper.vm.value.metadata.namespace = '';

    const btnCb = jest.fn();

    await wrapper.vm.saveSecret(btnCb);

    expect(wrapper.vm.errors).toHaveLength(1);
    expect(wrapper.vm.errors[0]).toBe('%validation.required%');
    expect(btnCb).toHaveBeenCalledWith(false);
  });

  it('should proceed to save in saveSecret if namespace is present when Project Scoped', async() => {
    const wrapper = createWrapper();

    wrapper.setData({ isProjectScoped: true });
    wrapper.vm.value.metadata.namespace = 'valid-ns';

    // Mock the save mixin method
    jest.spyOn(wrapper.vm, 'save').mockImplementation();

    const btnCb = jest.fn();

    await wrapper.vm.saveSecret(btnCb);

    expect(wrapper.vm.errors).toHaveLength(0);
    expect(wrapper.vm.save).toHaveBeenCalledWith(btnCb, undefined);
  });
});
