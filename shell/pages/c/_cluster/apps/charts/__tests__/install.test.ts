
import { mount } from '@vue/test-utils';
import Install from '@shell/pages/c/_cluster/apps/charts/install.vue';
import { CATALOG as CATALOG_ANNOTATIONS } from '@shell/config/labels-annotations';

const defaultStubs = {
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
  PrivateRegistry:     true,
};

const defaultGetters = {
  'catalog/inStore':         'cluster',
  'catalog/repo':            () => ({ metadata: { name: 'test-repo' } }),
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
};

const mountInstall = (options: {
  data?: () => Record<string, any>;
  getters?: Record<string, any>;
  mocks?: Record<string, any>;
} = {}) => {
  const mockStore = {
    dispatch: jest.fn((action) => {
      if (action === 'cluster/create') {
        return Promise.resolve({ metadata: { namespace: '', name: '' } });
      }

      return Promise.resolve();
    }),
    getters: {
      ...defaultGetters,
      ...options.getters
    }
  };

  return mount(Install, {
    global: {
      mocks: {
        $store:      mockStore,
        $route:      { query: {} },
        $fetchState: { pending: false },
        t:           (key: string) => key,
        ...options.mocks
      },
      stubs: defaultStubs
    },
    data: options.data
  });
};

describe('page: Install', () => {
  it('should use version annotations for target namespace and name', async() => {
    const wrapper = mountInstall({
      data: () => ({
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
        query:       { versionName: '1.0.0' },
        chartValues: { global: { imagePullSecrets: [] } },
        repo:        { spec: { clientSecret: { name: 'test-secret' } } }
      })
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

  describe('cancel()', () => {
    it('should route to appLocation if chart is not defined and specific query flags are absent', () => {
      const mockReplace = jest.fn();
      const expectedLocation = { name: 'app-location' };

      const wrapper = mountInstall({
        data: () => ({
          existing: false,
          chart:    null,
        }),
        mocks: { $router: { replace: mockReplace } }
      });

      jest.spyOn((wrapper.vm as any), 'appLocation').mockReturnValue(expectedLocation);

      (wrapper.vm as any).cancel();

      expect(mockReplace).toHaveBeenCalledWith(expectedLocation);
    });
  });

  describe('showRegistryPullSecrets', () => {
    it('should return true when repo has defaultImagePullSecrets', () => {
      const wrapper = mountInstall({ data: () => ({ repo: { spec: { defaultImagePullSecrets: [{ name: 'my-secret' }] } } }) });

      expect(wrapper.vm.showRegistryPullSecrets).toBe(true);
    });

    it('should return false when repo has no defaultImagePullSecrets', () => {
      const wrapper = mountInstall({ data: () => ({ repo: { spec: {} } }) });

      expect(wrapper.vm.showRegistryPullSecrets).toBe(false);
    });

    it('should return false when defaultImagePullSecrets is empty', () => {
      const wrapper = mountInstall({ data: () => ({ repo: { spec: { defaultImagePullSecrets: [] } } }) });

      expect(wrapper.vm.showRegistryPullSecrets).toBe(false);
    });
  });

  describe('repoDefaultPullSecretNames', () => {
    it('should map defaultImagePullSecrets to names', () => {
      const wrapper = mountInstall({
        data: () => ({
          repo: {
            spec: {
              defaultImagePullSecrets: [
                { name: 'secret-a' },
                { name: 'secret-b' }
              ]
            }
          }
        })
      });

      expect(wrapper.vm.repoDefaultPullSecretNames).toStrictEqual(['secret-a', 'secret-b']);
    });

    it('should filter out entries without a name', () => {
      const wrapper = mountInstall({
        data: () => ({
          repo: {
            spec: {
              defaultImagePullSecrets: [
                { name: 'valid' },
                { name: '' },
                {}
              ]
            }
          }
        })
      });

      expect(wrapper.vm.repoDefaultPullSecretNames).toStrictEqual(['valid']);
    });

    it('should return empty array when no defaultImagePullSecrets', () => {
      const wrapper = mountInstall({ data: () => ({ repo: { spec: {} } }) });

      expect(wrapper.vm.repoDefaultPullSecretNames).toStrictEqual([]);
    });
  });

  describe('existingValuesPullSecrets', () => {
    it('should return empty array on fresh install', () => {
      const wrapper = mountInstall({
        data: () => ({
          existing:    false,
          chartValues: { global: { imagePullSecrets: ['secret-1', 'secret-2'] } }
        })
      });

      expect(wrapper.vm.existingValuesPullSecrets).toStrictEqual([]);
    });

    it('should return imagePullSecrets from chart values on upgrade', () => {
      const wrapper = mountInstall({
        data: () => ({
          existing:    { metadata: { name: 'existing-release' } },
          chartValues: { global: { imagePullSecrets: ['secret-1', 'secret-2'] } }
        })
      });

      expect(wrapper.vm.existingValuesPullSecrets).toStrictEqual(['secret-1', 'secret-2']);
    });

    it('should filter out falsy entries', () => {
      const wrapper = mountInstall({
        data: () => ({
          existing:    { metadata: { name: 'existing-release' } },
          chartValues: { global: { imagePullSecrets: ['secret-1', null, '', 'secret-2'] } }
        })
      });

      expect(wrapper.vm.existingValuesPullSecrets).toStrictEqual(['secret-1', 'secret-2']);
    });

    it('should return empty array when imagePullSecrets is not an array', () => {
      const wrapper = mountInstall({
        data: () => ({
          existing:    { metadata: { name: 'existing-release' } },
          chartValues: { global: { imagePullSecrets: 'not-an-array' } }
        })
      });

      expect(wrapper.vm.existingValuesPullSecrets).toStrictEqual([]);
    });

    it('should return empty array when global has no imagePullSecrets', () => {
      const wrapper = mountInstall({
        data: () => ({
          existing:    { metadata: { name: 'existing-release' } },
          chartValues: { global: {} }
        })
      });

      expect(wrapper.vm.existingValuesPullSecrets).toStrictEqual([]);
    });
  });

  describe('addGlobalValuesTo', () => {
    it('should set imagePullSecrets when registryPullSecret is selected', () => {
      const wrapper = mountInstall({
        data: () => ({
          repo:                  { spec: { defaultImagePullSecrets: [{ name: 'default-secret' }] } },
          registryPullSecret:    'my-selected-secret',
          customRegistrySetting: null,
          currentCluster:        null,
          serverUrlSetting:      { value: '' },
        })
      });

      const values = { global: {} };

      wrapper.vm.addGlobalValuesTo(values);

      expect(values.global.imagePullSecrets).toStrictEqual(['my-selected-secret']);
    });

    it('should delete imagePullSecrets when showRegistryPullSecrets is true but no pullSecret selected', () => {
      const wrapper = mountInstall({
        data: () => ({
          repo:                  { spec: { defaultImagePullSecrets: [{ name: 'default-secret' }] } },
          registryPullSecret:    null,
          customRegistrySetting: null,
          currentCluster:        null,
          serverUrlSetting:      { value: '' },
        })
      });

      const values = { global: { imagePullSecrets: ['old-secret'] } };

      wrapper.vm.addGlobalValuesTo(values);

      expect(values.global.imagePullSecrets).toBeUndefined();
    });

    it('should not modify imagePullSecrets when showRegistryPullSecrets is false', () => {
      const wrapper = mountInstall({
        data: () => ({
          repo:                  { spec: {} },
          registryPullSecret:    null,
          customRegistrySetting: null,
          currentCluster:        null,
          serverUrlSetting:      { value: '' },
        })
      });

      const values = { global: { imagePullSecrets: ['existing-secret'] } };

      wrapper.vm.addGlobalValuesTo(values);

      expect(values.global.imagePullSecrets).toStrictEqual(['existing-secret']);
    });
  });

  describe('finish()', () => {
    const createFinishWrapper = (overrides: Record<string, any> = {}) => {
      const mockDoAction = jest.fn().mockResolvedValue({
        operationNamespace: 'ns',
        operationName:      'op'
      });
      const mockActionLinkFor = jest.fn().mockReturnValue('https://rancher/v1/catalog.cattle.io.clusterrepos/rancher-charts?action=install');

      const wrapper = mountInstall({
        data: () => ({
          repo: {
            spec:             { defaultImagePullSecrets: overrides.defaultImagePullSecrets || [] },
            doAction:         mockDoAction,
            actionLinkFor:    mockActionLinkFor,
            waitForOperation: jest.fn().mockResolvedValue(undefined),
          },
          existing:              overrides.existing || null,
          skipPullSecrets:       overrides.skipPullSecrets ?? false,
          registryPullSecret:    overrides.registryPullSecret ?? null,
          customRegistrySetting: null,
          currentCluster:        null,
          serverUrlSetting:      { value: '' },
          errors:                [],
          chart:                 { versions: [] },
          version:               { annotations: {} },
          chartValues:           overrides.chartValues || { global: {} },
          value:                 { metadata: { namespace: 'default', name: 'test' } },
          ...overrides
        })
      });

      // Mock mixin methods
      jest.spyOn(wrapper.vm as any, 'createNamespaceIfNeeded').mockResolvedValue(undefined);
      jest.spyOn(wrapper.vm as any, 'applyHooks').mockResolvedValue(overrides.hookResults || {});
      jest.spyOn(wrapper.vm as any, 'actionInput').mockReturnValue({ errors: [], input: {} });
      jest.spyOn(wrapper.vm as any, 'done').mockImplementation();

      // Mock store dispatch for operation find
      const store = (wrapper.vm as any).$store;

      store.dispatch = jest.fn().mockResolvedValue({
        waitForLink: jest.fn().mockResolvedValue(undefined),
        openLogs:    jest.fn(),
      });

      return {
        wrapper, mockDoAction, mockActionLinkFor
      };
    };

    it('should read created secret name from hookResults when registryPullSecret is null', async() => {
      const { wrapper } = createFinishWrapper({
        defaultImagePullSecrets: [{ name: 'repo-default' }],
        hookResults:             { registerAuthSecret: { metadata: { name: 'hook-created-secret' } } },
      });
      const btnCb = jest.fn();

      await wrapper.vm.finish(btnCb);

      expect(wrapper.vm.registryPullSecret).toBe('hook-created-secret');
    });

    it('should not overwrite registryPullSecret from hookResults when already set', async() => {
      const { wrapper } = createFinishWrapper({
        defaultImagePullSecrets: [{ name: 'repo-default' }],
        registryPullSecret:      'already-selected',
        hookResults:             { registerAuthSecret: { metadata: { name: 'hook-created-secret' } } },
      });
      const btnCb = jest.fn();

      await wrapper.vm.finish(btnCb);

      expect(wrapper.vm.registryPullSecret).toBe('already-selected');
    });

    it('should not read hookResults when skipPullSecrets is true', async() => {
      const { wrapper } = createFinishWrapper({
        defaultImagePullSecrets: [{ name: 'repo-default' }],
        skipPullSecrets:         true,
        hookResults:             { registerAuthSecret: { metadata: { name: 'hook-created-secret' } } },
      });
      const btnCb = jest.fn();

      await wrapper.vm.finish(btnCb);

      expect(wrapper.vm.registryPullSecret).toBeNull();
    });

    it('should add skipPullSecrets query param when skipPullSecrets is true', async() => {
      const { wrapper, mockDoAction } = createFinishWrapper({ skipPullSecrets: true });
      const btnCb = jest.fn();

      await wrapper.vm.finish(btnCb);

      expect(mockDoAction).toHaveBeenCalledWith(
        'install',
        expect.anything(),
        expect.objectContaining({ url: expect.stringContaining('skipPullSecrets=true') })
      );
    });

    it('should not add skipPullSecrets query param when skipPullSecrets is false', async() => {
      const { wrapper, mockDoAction } = createFinishWrapper({ skipPullSecrets: false });
      const btnCb = jest.fn();

      await wrapper.vm.finish(btnCb);

      expect(mockDoAction).toHaveBeenCalledWith(
        'install',
        expect.anything(),
        {}
      );
    });

    it('should use upgrade action name when existing release is present', async() => {
      const { wrapper, mockDoAction } = createFinishWrapper({
        existing:        { metadata: { name: 'existing-release' } },
        skipPullSecrets: true,
      });
      const btnCb = jest.fn();

      await wrapper.vm.finish(btnCb);

      expect(mockDoAction).toHaveBeenCalledWith(
        'upgrade',
        expect.anything(),
        expect.objectContaining({ url: expect.stringContaining('skipPullSecrets=true') })
      );
    });
  });

  describe('fetch() pull secret pre-selection', () => {
    const createFetchWrapper = (overrides: Record<string, any> = {}) => {
      const existingMock = overrides.existing ? {
        metadata:               overrides.existing.metadata || { namespace: 'default', name: 'release' },
        fetchValues:            jest.fn().mockResolvedValue(undefined),
        deployedAsLegacy:       jest.fn().mockResolvedValue(false),
        deployedAsMultiCluster: jest.fn().mockResolvedValue(false),
        values:                 overrides.chartValues?.global ? overrides.chartValues : {},
      } : null;

      const wrapper = mountInstall({
        data: () => ({
          repo: {
            spec: {
              defaultImagePullSecrets: overrides.defaultImagePullSecrets || [],
              clientSecret:            { name: 'test-secret' }
            }
          },
          existing:    existingMock,
          chartValues: overrides.chartValues || { global: {} },
          chart:       { versions: [] },
          version:     { annotations: {} },
          query:       { versionName: '1.0.0' },
        })
      });

      // Mock mixin methods used during fetch
      jest.spyOn(wrapper.vm as any, 'fetchChart').mockResolvedValue(undefined);
      jest.spyOn(wrapper.vm as any, 'fetchAutoInstallInfo').mockResolvedValue(undefined);
      jest.spyOn(wrapper.vm as any, 'getClusterRegistry').mockResolvedValue(undefined);
      jest.spyOn(wrapper.vm as any, 'getGlobalRegistry').mockResolvedValue(undefined);
      jest.spyOn(wrapper.vm as any, 'loadValuesComponent').mockResolvedValue(undefined);
      jest.spyOn(wrapper.vm as any, 'updateStepOneReady').mockImplementation();

      return wrapper;
    };

    it('should pre-select single existing pull secret on upgrade', async() => {
      const wrapper = createFetchWrapper({
        existing:                { metadata: { namespace: 'default', name: 'release' } },
        defaultImagePullSecrets: [{ name: 'repo-default' }],
        chartValues:             { global: { imagePullSecrets: ['existing-secret'] } },
      });

      await Install.fetch.call(wrapper.vm);

      expect(wrapper.vm.registryPullSecret).toBe('existing-secret');
    });

    it('should not pre-select when multiple existing pull secrets exist', async() => {
      const wrapper = createFetchWrapper({
        existing:                { metadata: { namespace: 'default', name: 'release' } },
        defaultImagePullSecrets: [{ name: 'repo-default' }],
        chartValues:             { global: { imagePullSecrets: ['secret-1', 'secret-2'] } },
      });

      await Install.fetch.call(wrapper.vm);

      expect(wrapper.vm.registryPullSecret).toBeNull();
    });

    it('should not pre-select on fresh install', async() => {
      const wrapper = createFetchWrapper({
        existing:                null,
        defaultImagePullSecrets: [{ name: 'repo-default' }],
        chartValues:             { global: { imagePullSecrets: ['existing-secret'] } },
      });

      await Install.fetch.call(wrapper.vm);

      expect(wrapper.vm.registryPullSecret).toBeNull();
    });

    it('should not pre-select when no imagePullSecrets in chart values', async() => {
      const wrapper = createFetchWrapper({
        existing:                { metadata: { namespace: 'default', name: 'release' } },
        defaultImagePullSecrets: [{ name: 'repo-default' }],
        chartValues:             { global: {} },
      });

      await Install.fetch.call(wrapper.vm);

      expect(wrapper.vm.registryPullSecret).toBeNull();
    });
  });

  describe('computed properties: monitoring banners', () => {
    const setupComponent = (existing: any, releaseName: string, componentName: string, chartName: string, installedApps: any[] = [], certified = 'rancher') => {
      const mockStore = {
        getters: {
          'i18n/withFallback':       () => '',
          'catalog/inStore':         'cluster',
          'features/get':            () => false,
          'type-map/hasCustomChart': () => false,
          'wm/byId':                 () => null,
          'i18n/t':                  (k: string) => k,
          'prefs/get':               () => {},
          'management/all':          () => [],
          'cluster/all':             () => [],
          'cluster/byId':            (type: string, id: string) => {
            if (type === 'catalog.cattle.io.app') {
              return installedApps.find((app) => app.id === id);
            }

            return null;
          },
          'catalog/charts': [],
        }
      };

      return mount(Install as any, {
        global: {
          mocks: {
            $store:      mockStore,
            $route:      { query: {} },
            $fetchState: { pending: false },
            t:           (k: string) => k,
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
            existing,
            version: {
              annotations: {
                [CATALOG_ANNOTATIONS.RELEASE_NAME]: releaseName,
                [CATALOG_ANNOTATIONS.COMPONENT]:    componentName,
                [CATALOG_ANNOTATIONS.CERTIFIED]:    certified,
              }
            },
            chart: {
              chartName,
              versions: []
            },
            query: { versionName: '1.0.0' }
          };
        }
      });
    };

    it('showMonitoringBanner should return translation key if releaseName matches rancher-monitoring (install or edit)', () => {
      const wrapper1 = setupComponent(true, 'rancher-monitoring', '', '');

      expect((wrapper1.vm as any).showMonitoringBanner).toBe('catalog.install.steps.basics.oldMonitoringChartWarning');

      const wrapper2 = setupComponent(true, '', 'rancher-monitoring', 'rancher-monitoring');

      expect((wrapper2.vm as any).showMonitoringBanner).toBeNull();

      const wrapper3 = setupComponent(false, 'rancher-monitoring', '', '');

      expect((wrapper3.vm as any).showMonitoringBanner).toBe('catalog.install.steps.basics.oldMonitoringChartWarning');
    });

    it('showMonitoringBanner should return translation key if existing is false and releaseName matches rancher-monitoring-dashboards', () => {
      const wrapper1 = setupComponent(false, 'rancher-monitoring-dashboards', '', '');

      expect((wrapper1.vm as any).showMonitoringBanner).toBe('catalog.install.steps.basics.newMonitoringChartWarning');

      const wrapper2 = setupComponent(false, '', 'rancher-monitoring-dashboards', 'rancher-monitoring-dashboards');

      expect((wrapper2.vm as any).showMonitoringBanner).toBeNull();

      const wrapper3 = setupComponent(true, 'rancher-monitoring-dashboards', '', '');

      expect((wrapper3.vm as any).showMonitoringBanner).toBeNull();
    });

    it('showMonitoringBanner should return null when the chart is not Rancher-certified, even if the release name matches', () => {
      const oldChartThirdParty = setupComponent(false, 'rancher-monitoring', '', '', [], 'partner');

      expect((oldChartThirdParty.vm as any).showMonitoringBanner).toBeNull();

      const newChartThirdParty = setupComponent(false, 'rancher-monitoring-dashboards', '', '', [], '');

      expect((newChartThirdParty.vm as any).showMonitoringBanner).toBeNull();
    });
  });
});
