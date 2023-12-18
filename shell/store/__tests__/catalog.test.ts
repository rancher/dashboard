import { getters } from '../catalog';

describe('getters', () => {
  describe('chart', () => {
    describe('should return nothing and avoid mismatches', () => {
      it('if no parameter is passed', () => {
        const result = (getters.chart as any)({}, {})({});

        expect(result).toBeUndefined();
      });

      it.each([
        {
          repoType:  'repoType',
          repoName:  'repoName',
          chartName: undefined,
        },
        {
          repoType:  undefined,
          repoName:  'repoName',
          chartName: 'chartName',
        },
        {
          repoType:  'repoType',
          repoName:  undefined,
          chartName: 'chartName',
        },
      ])('if missing arguments for filtering %p', (options) => {
        const result = (getters.chart as any)({}, {})({
          key: undefined,
          ...options
        });

        expect(result).toBeUndefined();
      });
    });

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

      it.each([
        {
          chartName: 'rancher-alerting-drivers',
          repoType:  'cluster',
          repoName:  'rancher-charts',
        },
        { chartName: 'rancher-alerting-drivers' },
        { repoType: 'cluster' },
        { repoName: 'rancher-charts' },
      ])('given any matching parameter %p', (options) => {
        const chart1 = {
          chartName:  'rancher-alerting-drivers',
          repoType:   'cluster',
          repoName:   'rancher-charts',
          deprecated: false
        };
        const state = {};
        const stateGetters = { charts: [chart1] };

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
          metadata: { name: 'chartName' },
          repoType: 'repoType',
          repoName: 'repoName',
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

      it('given only all matching parameters if provided', () => {
        const options = {
          chartName: 'epinio',
          repoType:  'cluster',
          repoName:  'rancher-charts',
        };
        const common = {
          chartName:  'epinio',
          repoType:   'cluster',
          deprecated: false
        };
        const chart1 = {
          repoName: 'rancher-charts',
          ...common
        };
        const chart2 = {
          repoName: 'epinio-repo',
          ...common,
        };
        const chart3 = {
          repoName: 'epinio-extension',
          ...common,
        };
        const state = {};
        const stateGetters = { charts: [chart2, chart3, chart1] };

        // NOTE: Getters arguments are actually optional
        const result = (getters.chart as any)(state, stateGetters)(options);

        expect(result).toStrictEqual(chart1);
      });
    });
  });
});
