import ChartMixin from '@shell/mixins/chart';
import { OPA_GATE_KEEPER_ID } from '@shell/pages/c/_cluster/gatekeeper/index.vue';
import { mount } from '@vue/test-utils';
import { APP_UPGRADE_STATUS } from '@shell/store/catalog';
import { CATALOG as CATALOG_ANNOTATIONS } from '@shell/config/labels-annotations';
import { CATALOG } from '@shell/config/types';

describe('chartMixin', () => {
  const testCases = {
    opa: [
      [null, 0],
      [OPA_GATE_KEEPER_ID, 1],
      ['any_other_id', 0]
    ],
    managedApps: [
      [false, APP_UPGRADE_STATUS.NOT_APPLICABLE, 0],
      [true, APP_UPGRADE_STATUS.NO_UPGRADE, 0],
      [true, 'some-version', 0],
      [true, APP_UPGRADE_STATUS.NOT_APPLICABLE, 1],
    ],
  };

  it.each(testCases.opa)(
    'should add OPA deprecation warning properly', async(chartId, expected) => {
      const mockStore = {
        dispatch: jest.fn(() => Promise.resolve()),
        getters:  {
          currentCluster: () => {},
          isRancher:      () => true,
          'catalog/repo': () => {
            return () => 'repo';
          },
          'catalog/chart': () => {
            return {
              id:                    chartId,
              matchingInstalledApps: []
            };
          },
          'i18n/t': () => jest.fn()
        }
      };

      const DummyComponent = {
        mixins:   [ChartMixin],
        template: '<div></div>',
      };

      const instance = mount(
        DummyComponent,
        {
          global: {
            mocks: {
              $store: mockStore,
              $route: { query: { chart: 'chart_name' } }
            }
          }
        });

      await instance.vm.fetchChart();

      const warnings = instance.vm.warnings;

      expect(warnings).toHaveLength(expected);
    }
  );

  it.each(testCases.managedApps)(
    'should add managed apps warning properly', (isEdit, upgradeAvailable, expected) => {
      const id = 'cattle-fleet-local-system/fleet-agent-local';
      const data = isEdit ? { existing: { id, upgradeAvailable } } : undefined;

      const mockStore = {
        dispatch: jest.fn(() => Promise.resolve()),
        getters:  {
          currentCluster: () => {},
          isRancher:      () => true,
          'catalog/repo': () => {
            return () => 'repo';
          },
          'catalog/chart': () => {
            return { id };
          },
          'i18n/t': () => jest.fn()
        }
      };

      const DummyComponent = {
        mixins:   [ChartMixin],
        template: '<div></div>',
      };

      const instance = mount(
        DummyComponent,
        {
          data:   () => data,
          global: {
            mocks: {
              $store: mockStore,
              $route: { query: { chart: 'chart_name' } }
            }
          }
        });

      const warnings = instance.vm.warnings;

      expect(warnings).toHaveLength(expected as number);
    }
  );

  describe('fetchChart', () => {
    it('should call catalog/version with showDeprecated', async() => {
      const mockStore = {
        dispatch: jest.fn(() => Promise.resolve()),
        getters:  {
          currentCluster: () => {},
          isRancher:      () => true,
          'catalog/repo': () => {
            return () => 'repo';
          },
          'catalog/chart': () => {
            return {
              id: 'chart-id', versions: [{ version: '1.0.0' }], matchingInstalledApps: []
            };
          },
          'catalog/version': jest.fn(),
          'prefs/get':       () => {},
          'i18n/t':          () => jest.fn()
        }
      };

      const DummyComponent = {
        mixins:   [ChartMixin],
        template: '<div></div>',
      };

      const wrapper = mount(
        DummyComponent,
        {
          global: {
            mocks: {
              $store: mockStore,
              $route: {
                query: {
                  chart:      'chart_name',
                  deprecated: 'true'
                }
              }
            }
          }
        });

      await wrapper.vm.fetchChart();

      expect(mockStore.getters['catalog/version']).toHaveBeenCalledWith(expect.objectContaining({ showDeprecated: true }));
    });

    it('should find existing app using version annotations', async() => {
      const mockStore = {
        dispatch: jest.fn((action, payload) => {
          if (action === 'cluster/find') {
            return Promise.resolve({ id: payload.id, fetchValues: jest.fn() });
          }

          return Promise.resolve();
        }),
        getters: {
          currentCluster: () => {},
          isRancher:      () => true,
          'catalog/repo': () => {
            return () => 'repo';
          },
          'catalog/chart': () => {
            return {
              id: 'chart-id', versions: [{ version: '1.0.0' }], matchingInstalledApps: []
            };
          },
          'catalog/version': () => ({
            version:     '1.0.0',
            annotations: {
              [CATALOG_ANNOTATIONS.NAMESPACE]:    'custom-ns',
              [CATALOG_ANNOTATIONS.RELEASE_NAME]: 'custom-name',
            }
          }),
          'prefs/get': () => {},
          'i18n/t':    () => jest.fn()
        }
      };

      const DummyComponent = {
        mixins:   [ChartMixin],
        template: '<div></div>',
      };

      const wrapper = mount(
        DummyComponent,
        {
          global: {
            mocks: {
              $store: mockStore,
              $route: {
                query: {
                  chart:       'chart_name',
                  versionName: '1.0.0'
                }
              }
            }
          }
        });

      await wrapper.vm.fetchChart();

      expect(mockStore.dispatch).toHaveBeenCalledWith('cluster/find', {
        type: CATALOG.APP,
        id:   'custom-ns/custom-name'
      });
    });
  });

  describe('action', () => {
    const DummyComponent = {
      mixins:   [ChartMixin],
      template: '<div></div>',
    };

    const mockStore = {
      dispatch: jest.fn(() => Promise.resolve()),
      getters:  { 'i18n/t': (key: string) => key }
    };

    it('should return "install" action when not installed', () => {
      const wrapper = mount(DummyComponent, {
        data:   () => ({ existing: null }),
        global: { mocks: { $store: mockStore } }
      });

      expect(wrapper.vm.action).toStrictEqual({
        name: 'install',
        tKey: 'install',
        icon: 'icon-plus',
      });
    });

    it('should return "editVersion" action when installed and on same version', () => {
      const wrapper = mount(DummyComponent, {
        data: () => ({
          existing: { spec: { chart: { metadata: { version: '1.0.0' } } } },
          version:  { version: '1.0.0' }
        }),
        global: {
          mocks: {
            $store: mockStore,
            $route: { query: {} }
          }
        }
      });

      expect(wrapper.vm.action).toStrictEqual({
        name: 'editVersion',
        tKey: 'edit',
        icon: 'icon-edit',
      });
    });

    it('should return "upgrade" action when installed and on a newer version', () => {
      const wrapper = mount(DummyComponent, {
        data: () => ({
          existing: { spec: { chart: { metadata: { version: '1.0.0' } } } },
          version:  { version: '1.0.1' }
        }),
        global: {
          mocks: {
            $store: mockStore,
            $route: { query: {} }
          }
        }
      });

      expect(wrapper.vm.action).toStrictEqual({
        name: 'upgrade',
        tKey: 'upgrade',
        icon: 'icon-upgrade-alt',
      });
    });
    it('should return "downgrade" action when installed and on an older version', () => {
      const wrapper = mount(DummyComponent, {
        data: () => ({
          existing: { spec: { chart: { metadata: { version: '1.0.1' } } } },
          version:  { version: '1.0.0' }
        }),
        global: {
          mocks: {
            $store: mockStore,
            $route: { query: {} }
          }
        }
      });

      expect(wrapper.vm.action).toStrictEqual({
        name: 'downgrade',
        tKey: 'downgrade',
        icon: 'icon-downgrade-alt',
      });
    });

    it('should return "upgrade" action when upgrading from a pre-release to a stable version', () => {
      const wrapper = mount(DummyComponent, {
        data: () => ({
          existing: { spec: { chart: { metadata: { version: '1.0.0-rc1' } } } },
          version:  { version: '1.0.0' }
        }),
        global: {
          mocks: {
            $store: mockStore,
            $route: { query: {} }
          }
        }
      });

      expect(wrapper.vm.action).toStrictEqual({
        name: 'upgrade',
        tKey: 'upgrade',
        icon: 'icon-upgrade-alt',
      });
    });

    it('should return "upgrade" action when upgrading from a pre-release to a stable version with "up" build metadata', () => {
      const wrapper = mount(DummyComponent, {
        data: () => ({
          existing: { spec: { chart: { metadata: { version: '108.0.0+up0.25.0-rc.4' } } } },
          version:  { version: '108.0.0+up0.25.0' }
        }),
        global: {
          mocks: {
            $store: mockStore,
            $route: { query: {} }
          }
        }
      });

      expect(wrapper.vm.action).toStrictEqual({
        name: 'upgrade',
        tKey: 'upgrade',
        icon: 'icon-upgrade-alt',
      });
    });

    it('should return "upgrade" action when upgrading with build metadata change', () => {
      const wrapper = mount(DummyComponent, {
        data: () => ({
          existing: { spec: { chart: { metadata: { version: '1.0.0+1' } } } },
          version:  { version: '1.0.0+2' }
        }),
        global: {
          mocks: {
            $store: mockStore,
            $route: { query: {} }
          }
        }
      });

      expect(wrapper.vm.action).toStrictEqual({
        name: 'upgrade',
        tKey: 'upgrade',
        icon: 'icon-upgrade-alt',
      });
    });
  });

  describe('mappedVersions', () => {
    it('should return versions sorted by semver (descending)', () => {
      const versions = [
        { version: '0.1.0', created: '2026-01-01' },
        { version: '0.2.0-rc1', created: '2026-01-01' },
        { version: '0.2.0', created: '2026-01-01' },
        { version: '1.2.3', created: '2026-01-01' },
        { version: '1.2.3-dev', created: '2026-01-01' },
        { version: '10.0.0', created: '2026-01-01' },
        { version: '2.0.0', created: '2026-01-01' },
        { version: '2.0.0-rc2', created: '2026-01-01' },
        { version: '2.0.0-rc1', created: '2026-01-01' },
        { version: '2.0.0-beta.1', created: '2026-01-01' },
        { version: '2.0.0-alpha', created: '2026-01-01' },
        { version: '3.0.0-rc.3', created: '2026-01-01' },
        { version: '3.0.0-rc.2', created: '2026-01-01' },
        { version: '3.0.0-rc.10', created: '2026-01-01' },
        { version: '108.0.0+up0.25.0-rc.4', created: '2026-01-01' },
        { version: '108.0.0+up0.25.0', created: '2026-01-01' },
        { version: '1.0.0-alpha.beta', created: '2026-01-01' },
        { version: '1.0.0-alpha.1', created: '2026-01-01' },
        { version: '1.0.0-alpha.2', created: '2026-01-01' },
        { version: '1.0.0-alpha', created: '2026-01-01' },
        { version: '1.0.0-beta.11', created: '2026-01-01' },
        { version: '1.0.0-beta.2', created: '2026-01-01' },
        { version: '1.0.0-beta', created: '2026-01-01' },
        { version: '1.0.0+build.1', created: '2026-01-01' },
        { version: '1.0.0+build.2', created: '2026-01-01' },
        { version: '1.0.0+up1.0.0', created: '2026-01-01' },
        { version: '1.0.0+upFoo', created: '2026-01-01' },
        { version: '108.0.0+up0.25.0-rc.5', created: '2026-01-01' },
        { version: '108.0.0+up0.25.1', created: '2026-01-01' },
        { version: '0.0.1', created: '2026-01-01' }
      ];

      const mockStore = {
        dispatch: jest.fn(() => Promise.resolve()),
        getters:  {
          currentCluster:  () => {},
          isRancher:       () => true,
          'catalog/repo':  () => () => 'repo',
          'catalog/chart': () => ({ versions }),
          'prefs/get':     () => (key: string) => true,
          'i18n/t':        () => jest.fn()
        }
      };

      const DummyComponent = {
        mixins:   [ChartMixin],
        template: '<div></div>',
      };

      const wrapper = mount(
        DummyComponent,
        {
          data() {
            return { chart: { versions } };
          },
          global: {
            mocks: {
              $store: mockStore,
              $route: { query: { version: '10.0.0' } }
            }
          }
        });

      // mappedVersions is a computed property, so we access it directly
      const result = wrapper.vm.mappedVersions;
      const resultVersions = result.map((v: any) => v.version);

      expect(resultVersions).toStrictEqual([
        '108.0.0+up0.25.1',
        '108.0.0+up0.25.0',
        '108.0.0+up0.25.0-rc.5',
        '108.0.0+up0.25.0-rc.4',
        '10.0.0',
        '3.0.0-rc.10',
        '3.0.0-rc.3',
        '3.0.0-rc.2',
        '2.0.0',
        '2.0.0-rc2',
        '2.0.0-rc1',
        '2.0.0-beta.1',
        '2.0.0-alpha',
        '1.2.3',
        '1.2.3-dev',
        '1.0.0+up1.0.0',
        '1.0.0+upFoo',
        '1.0.0+build.2',
        '1.0.0+build.1',
        '1.0.0-beta.11',
        '1.0.0-beta.2',
        '1.0.0-beta',
        '1.0.0-alpha.beta',
        '1.0.0-alpha.2',
        '1.0.0-alpha.1',
        '1.0.0-alpha',
        '0.2.0',
        '0.2.0-rc1',
        '0.1.0',
        '0.0.1'
      ]);
    });
  });
});
