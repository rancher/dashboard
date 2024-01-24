import { shallowMount } from '@vue/test-utils';
import { createStore } from 'vuex';
import ChartMixin from '@shell/mixins/chart';
import { OPA_GATE_KEEPER_ID } from '@shell/pages/c/_cluster/gatekeeper/index.vue';

describe('chartMixin', () => {
  const testCases = {
    opa: [
      [null, 0],
      [OPA_GATE_KEEPER_ID, 1],
      ['any_other_id', 0]
    ],
    managedApps: [
      [false, false, 0],
      [true, null, 0],
      [true, true, 0],
      [true, false, 1],
    ],
  };

  it.each(testCases.opa)(
    'should add OPA deprecation warning properly', async(chartId, expected) => {
      const store = createStore({
        getters: {
          currentCluster: () => {},
          isRancher:      () => true,
          'catalog/repo': () => {
            return () => 'repo';
          },
          'catalog/chart': () => {
            return () => ({ id: chartId });
          },
          'i18n/t': () => jest.fn()
        }
      });
      const Component = { render() {} };
      const instance = shallowMount(Component, { global: { plugins: [store], mixins: [ChartMixin] } }) as any;

      instance.$route = { query: { chart: 'chart_name' } };

      await instance.fetchChart();

      const warnings = instance.warnings;

      expect(warnings).toHaveLength(expected);
    }
  );

  it.each(testCases.managedApps)(
    'should add managed apps warning properly', (isEdit, upgradeAvailable, expected) => {
      const id = 'cattle-fleet-local-system/fleet-agent-local';
      const data = isEdit ? { existing: { id, upgradeAvailable } } : undefined;

      const store = createStore({
        getters: {
          currentCluster: () => {},
          isRancher:      () => true,
          'catalog/repo': () => {
            return () => 'repo';
          },
          'catalog/chart': () => {
            return () => ({ id });
          },
          'i18n/t': () => jest.fn()
        }
      });

      const Component = { render() {} };
      const instance = shallowMount(Component, { global: { plugins: [store], mixins: [ChartMixin] } }, data) as any;

      instance.$route = { query: { chart: 'chart_name' } };

      const warnings = instance.warnings;

      expect(warnings).toHaveLength(expected as number);
    }
  );
});
