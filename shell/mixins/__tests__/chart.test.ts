import { createLocalVue } from '@vue/test-utils';
import Vuex from 'vuex';
import ChartMixin from '@shell/mixins/chart';
import { OPA_GATE_KEEPER_ID } from '@shell/pages/c/_cluster/gatekeeper/index.vue';

describe('chartMixin', () => {
  const testCases = [[null, 0], [OPA_GATE_KEEPER_ID, 1], ['any_other_id', 0]];

  it.each(testCases)(
    'should add OPA deprecation warning properly', (chartId, expected) => {
      const localVue = createLocalVue();

      localVue.use(Vuex);
      localVue.mixin(ChartMixin);

      const store = new Vuex.Store({
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

      const vm = localVue.extend({});
      const instance = new vm({ store });

      instance.$route = { query: { chart: 'chart_name' } };

      const warnings = instance.warnings;

      expect(warnings).toHaveLength(expected);
    }
  );
});
