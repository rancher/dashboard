
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
          query:       { versionName: '1.0.0' },
          chartValues: { global: { imagePullSecrets: [] } },
          repo:        { spec: { clientSecret: { name: 'test-secret' } } }
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

  describe('cancel()', () => {
    it('should route to appLocation if chart is not defined and specific query flags are absent', () => {
      const mockReplace = jest.fn();
      const expectedLocation = { name: 'app-location' };

      const wrapper = mount(Install, {
        global: {
          mocks: {
            $store: {
              getters: {
                'i18n/t':     (key: string) => key,
                'cluster/id': 'cluster-id',
              }
            },
            $route:      { query: {} },
            $router:     { replace: mockReplace },
            $fetchState: { pending: false },
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
            existing: false,
            chart:    null,
          };
        }
      });

      jest.spyOn((wrapper.vm as any), 'appLocation').mockReturnValue(expectedLocation);

      (wrapper.vm as any).cancel();

      expect(mockReplace).toHaveBeenCalledWith(expectedLocation);
    });
  });

  describe('computed properties: monitoring banners', () => {
    const setupComponent = (existing: any, releaseName: string, componentName: string, chartName: string, installedApps: any[] = []) => {
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

    it('showMonitoringBanner should return translation key if existing is true and releaseName matches rancher-monitoring', () => {
      const wrapper1 = setupComponent(true, 'rancher-monitoring', '', '');

      expect((wrapper1.vm as any).showMonitoringBanner).toBe('catalog.install.steps.basics.oldMonitoringChartWarning');

      const wrapper2 = setupComponent(true, '', 'rancher-monitoring', 'rancher-monitoring');

      expect((wrapper2.vm as any).showMonitoringBanner).toBeNull();

      const wrapper3 = setupComponent(false, 'rancher-monitoring', '', '');

      expect((wrapper3.vm as any).showMonitoringBanner).toBeNull();
    });

    it('showMonitoringBanner should return translation key if existing is false and releaseName matches rancher-monitoring-dashboards', () => {
      const wrapper1 = setupComponent(false, 'rancher-monitoring-dashboards', '', '');

      expect((wrapper1.vm as any).showMonitoringBanner).toBe('catalog.install.steps.basics.newMonitoringChartWarning');

      const wrapper2 = setupComponent(false, '', 'rancher-monitoring-dashboards', 'rancher-monitoring-dashboards');

      expect((wrapper2.vm as any).showMonitoringBanner).toBeNull();

      const wrapper3 = setupComponent(true, 'rancher-monitoring-dashboards', '', '');

      expect((wrapper3.vm as any).showMonitoringBanner).toBeNull();
    });

    it('showUninstallMonitoringBanner should return translation key if releaseName matches rancher-monitoring-dashboards and rancher-monitoring is installed', () => {
      const wrapper1 = setupComponent(false, 'rancher-monitoring-dashboards', '', '', [{ id: 'cattle-monitoring-system/rancher-monitoring' }]);

      expect((wrapper1.vm as any).showUninstallMonitoringBanner).toBe('catalog.install.steps.basics.uninstallMonitoringChartWarning');

      const wrapper2 = setupComponent(false, 'rancher-monitoring-dashboards', '', '', []);

      expect((wrapper2.vm as any).showUninstallMonitoringBanner).toBeNull();

      const wrapper3 = setupComponent(false, 'other-chart', '', '', [{ id: 'cattle-monitoring-system/rancher-monitoring' }]);

      expect((wrapper3.vm as any).showUninstallMonitoringBanner).toBeNull();
    });
  });
});
