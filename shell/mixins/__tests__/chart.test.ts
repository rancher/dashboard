import ChartMixin from '@shell/mixins/chart';
import { OPA_GATE_KEEPER_ID } from '@shell/pages/c/_cluster/gatekeeper/index.vue';
import { mount } from '@vue/test-utils';
import { APP_UPGRADE_STATUS } from '@shell/store/catalog';

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
            return { id: chartId };
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
});
