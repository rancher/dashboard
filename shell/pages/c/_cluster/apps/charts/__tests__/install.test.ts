
import { mount } from '@vue/test-utils';
import Install from '@shell/pages/c/_cluster/apps/charts/install.vue';
import { CATALOG as CATALOG_ANNOTATIONS } from '@shell/config/labels-annotations';

describe('page: Install', () => {
  it('should use version annotations for target namespace and name', async() => {
    const mockStore = {
      dispatch: jest.fn((action) => {
        if (action === 'cluster/create') {
          return Promise.resolve({ metadata: { namespace: '', name: '' } });
        }

        return Promise.resolve();
      }),
      getters: {
        'catalog/inStore':         'cluster',
        'features/get':            () => false,
        defaultNamespace:          'default',
        'i18n/withFallback':       (key: string) => key,
        'type-map/hasCustomChart': () => false,
        'cluster/all':             () => [],
        'cluster/byId':            () => null,
        'management/all':          () => [],
        'prefs/get':               () => {},
        'catalog/charts':          [],
        'wm/byId':                 () => null,
        'i18n/t':                  (key: string) => key,
      }
    };

    const wrapper = mount(Install, {
      global: {
        mocks: {
          $store:      mockStore,
          $route:      { query: {} },
          $fetchState: { pending: false },
          t:           (key: string) => key,
        },
        stubs: {
          Loading:             true,
          Wizard:              true,
          Banner:              true,
          Checkbox:            true,
          LabeledInput:        true,
          LabeledSelect:       true,
          NameNsDescription:   true,
          Tabbed:              true,
          Questions:           true,
          YamlEditor:          true,
          ResourceCancelModal: true,
          UnitInput:           true,
          TypeDescription:     true,
          LazyImage:           true,
          ChartReadme:         true,
          ButtonGroup:         true,
        }
      },
      data() {
        return {
          version: {
            annotations: {
              [CATALOG_ANNOTATIONS.NAMESPACE]:    'custom-ns',
              [CATALOG_ANNOTATIONS.RELEASE_NAME]: 'custom-name',
            }
          },
          chart: {
            targetNamespace: 'wrong-ns',
            targetName:      'wrong-name',
            versions:        []
          },
          query: { versionName: '1.0.0' }
        };
      }
    });

    // Mock methods from mixins
    jest.spyOn((wrapper.vm as any), 'fetchChart').mockImplementation().mockResolvedValue(undefined);
    jest.spyOn((wrapper.vm as any), 'fetchAutoInstallInfo').mockImplementation().mockResolvedValue(undefined);
    jest.spyOn((wrapper.vm as any), 'getClusterRegistry').mockImplementation().mockResolvedValue(undefined);
    jest.spyOn((wrapper.vm as any), 'getGlobalRegistry').mockImplementation().mockResolvedValue(undefined);
    jest.spyOn((wrapper.vm as any), 'loadValuesComponent').mockImplementation().mockResolvedValue(undefined);
    jest.spyOn((wrapper.vm as any), 'updateStepOneReady').mockImplementation();

    // Trigger fetch
    await Install.fetch.call(wrapper.vm);

    expect(wrapper.vm.forceNamespace).toBe('custom-ns');
    expect(wrapper.vm.value.metadata.name).toBe('custom-name');
  });
});
