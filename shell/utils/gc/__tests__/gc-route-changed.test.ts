describe('gc-route-changed', () => {
  let gcrc: any;
  let mockGc: any;

  beforeEach(() => {
    mockGc = {
      gcUpdateRouteChanged: jest.fn(),
      gcEnabledSetting:     jest.fn(),
      gcEnabledRoute:       jest.fn(),
    };

    jest.resetModules();
    jest.mock('../gc', () => ({ default: mockGc, __esModule: true }));

    gcrc = require('../gc-route-changed').default;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('gcRouteChanged', () => {
    it('always calls gcUpdateRouteChanged', () => {
      mockGc.gcEnabledSetting.mockReturnValue(false);
      mockGc.gcEnabledRoute.mockReturnValue(false);

      const ctx = { dispatch: jest.fn() };

      gcrc.gcRouteChanged(ctx, { name: 'some-route', params: {} });

      expect(mockGc.gcUpdateRouteChanged).toHaveBeenCalledWith();
    });

    it.each([
      {
        desc:           'gcEnabledSetting is false',
        enabledSetting: false,
        enabledRoute:   true,
        route:          { name: 'c-cluster-explorer', params: { resource: 'pods' } },
      },
      {
        desc:           'gcEnabledRoute is false',
        enabledSetting: true,
        enabledRoute:   false,
        route:          { name: 'c-cluster-explorer', params: { resource: 'pods' } },
      },
      {
        desc:           'route is auth-logout',
        enabledSetting: true,
        enabledRoute:   true,
        route:          { name: 'auth-logout', params: {} },
      },
    ])('returns early without dispatch when $desc', ({ enabledSetting, enabledRoute, route }) => {
      mockGc.gcEnabledSetting.mockReturnValue(enabledSetting);
      mockGc.gcEnabledRoute.mockReturnValue(enabledRoute);

      const ctx = { dispatch: jest.fn() };

      gcrc.gcRouteChanged(ctx, route);

      expect(ctx.dispatch).not.toHaveBeenCalled();
    });

    it.each([
      {
        desc:     'resource from to.params.resource as ignoreTypes',
        route:    { name: 'c-cluster-explorer', params: { resource: 'pods' } },
        expected: { pods: true },
      },
      {
        desc:     'empty ignoreTypes when no resource in params',
        route:    { name: 'some-route', params: {} },
        expected: {},
      },
      {
        desc:     'empty ignoreTypes when params is undefined',
        route:    { name: 'some-route' },
        expected: {},
      },
      {
        desc:     'empty ignoreTypes when route name matches c-cluster pattern (match[2] is undefined)',
        route:    { name: 'c-cluster-explorer', params: {} },
        expected: {},
      },
    ])('dispatches garbageCollect with $desc', ({ route, expected }) => {
      mockGc.gcEnabledSetting.mockReturnValue(true);
      mockGc.gcEnabledRoute.mockReturnValue(true);

      const ctx = { dispatch: jest.fn() };

      gcrc.gcRouteChanged(ctx, route);

      expect(ctx.dispatch).toHaveBeenCalledWith('garbageCollect', expected);
    });
  });
});
