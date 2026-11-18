import HelmOpComponent from '@shell/edit/fleet.cattle.io.helmop.vue';

/**
 * Unit tests for the App Collection deprecated-chart handling in `fetchAppCoCharts`.
 *
 * The method is exercised in isolation (invoked with a mocked `this`) rather than by mounting the
 * whole Options-API component, to keep the test focused on the two-call `catalog/chart` fallback and
 * the `appCoChartDeprecated` sourcing.
 */
describe('fleet.cattle.io.helmop: fetchAppCoCharts', () => {
  const REPO_NAME = 'fleet-appco-repo-2n9px';
  const fetchAppCoCharts = (HelmOpComponent as any).methods.fetchAppCoCharts;

  const makeContext = (catalogChartGetter: jest.Mock, chart = 'apache-apisix-dashboard') => ({
    appCoChartsLoading:   false,
    appCoChartEntries:    {},
    appCoChartDeprecated: false,
    value:                { spec: { helm: { chart } } },
    $store:               {
      dispatch: jest.fn().mockResolvedValue(undefined),
      getters:  { 'catalog/chart': catalogChartGetter },
    },
  });

  it('should fall back to including deprecated charts and flag the chart as deprecated', async() => {
    const catalogChartGetter = jest.fn()
      .mockReturnValueOnce(undefined)
      .mockReturnValueOnce({ versions: [{ version: '0.8.3' }], deprecated: true });
    const ctx = makeContext(catalogChartGetter);

    await fetchAppCoCharts.call(ctx, REPO_NAME);

    expect(catalogChartGetter).toHaveBeenNthCalledWith(1, {
      repoType: 'cluster', repoName: REPO_NAME, chartName: 'apache-apisix-dashboard', includeHidden: true
    });
    expect(catalogChartGetter).toHaveBeenNthCalledWith(2, {
      repoType: 'cluster', repoName: REPO_NAME, chartName: 'apache-apisix-dashboard', includeHidden: true, showDeprecated: true
    });
    expect(ctx.appCoChartDeprecated).toBe(true);
    expect(ctx.appCoChartEntries).toStrictEqual({ 'apache-apisix-dashboard': [{ version: '0.8.3' }] });
  });

  it('should resolve a non-deprecated chart on the first call without the fallback', async() => {
    const catalogChartGetter = jest.fn()
      .mockReturnValueOnce({ versions: [{ version: '1.41.0' }], deprecated: false });
    const ctx = makeContext(catalogChartGetter, 'alertmanager');

    await fetchAppCoCharts.call(ctx, REPO_NAME);

    expect(catalogChartGetter).toHaveBeenCalledTimes(1);
    expect(catalogChartGetter).toHaveBeenCalledWith({
      repoType: 'cluster', repoName: REPO_NAME, chartName: 'alertmanager', includeHidden: true
    });
    expect(ctx.appCoChartDeprecated).toBe(false);
    expect(ctx.appCoChartEntries).toStrictEqual({ alertmanager: [{ version: '1.41.0' }] });
  });

  it('should leave state unchanged when the chart is not found in either lookup', async() => {
    const catalogChartGetter = jest.fn().mockReturnValue(undefined);
    const ctx = makeContext(catalogChartGetter);

    await fetchAppCoCharts.call(ctx, REPO_NAME);

    expect(catalogChartGetter).toHaveBeenCalledTimes(2);
    expect(ctx.appCoChartEntries).toStrictEqual({});
    expect(ctx.appCoChartDeprecated).toBe(false);
  });

  it('should do nothing when no repo name is provided', async() => {
    const catalogChartGetter = jest.fn();
    const ctx = makeContext(catalogChartGetter);

    await fetchAppCoCharts.call(ctx, '');

    expect(ctx.$store.dispatch).not.toHaveBeenCalled();
    expect(catalogChartGetter).not.toHaveBeenCalled();
  });
});
