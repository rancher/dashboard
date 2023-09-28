import { getters } from '../catalog';

describe('getters', () => {
  describe('chart', () => {
    describe('should return latest version of matching chart for', () => {
      it('given parameters', () => {
        const options = {
          chartName: 'chartName',
          repoType:  'repoType',
          repoName:  'repoName',
        };
        const common = { deprecated: false };
        const chart1 = {
          ...options,
          ...common
        };
        const chart2 = {
          ...options,
          ...common,
          repoName: 'somethingElse'
        };
        const state = {};
        const stateGetters = { charts: [chart2, chart1] };

        // NOTE: Getters arguments are actually optional
        const result = (getters.chart as any)(state, stateGetters)(options);

        expect(result).toStrictEqual(chart1);
      });

      it('given key', () => {
        const key = 'repoType/repoName/chartName';
        const chart1 = {
          chartName:  'chartName',
          repoType:   'repoType',
          repoName:   'repoName',
          deprecated: false
        };
        const chart2 = {
          ...chart1,
          repoName: 'somethingElse'
        };
        const state = {};
        const stateGetters = { charts: [chart2, chart1] };

        // NOTE: Getters arguments are actually optional
        const result = (getters.chart as any)(state, stateGetters)({ key });

        expect(result).toStrictEqual(chart1);
      });

      it.each([
        {
          metadata: {
            name:        'chartName',
            annotations: {
              'catalog.cattle.io/ui-source-repo-type': 'repoType',
              'catalog.cattle.io/ui-source-repo':      'repoName'
            }
          }
        }
      ])('given chart with same name %p', (chart) => {
        const chart1 = {
          chartName:  'chartName',
          repoType:   'repoType',
          repoName:   'repoName',
          deprecated: false
        };
        const chart2 = {
          ...chart1,
          repoName: 'somethingElse'
        };
        const state = {};
        const stateGetters = { charts: [chart2, chart1] };

        // NOTE: Getters arguments are actually optional
        const result = (getters.chart as any)(state, stateGetters)({ chart });

        expect(result).toStrictEqual(chart1);
      });
    });
  });
});
