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

    it('returns early without dispatch when gcEnabledSetting is false', () => {
      mockGc.gcEnabledSetting.mockReturnValue(false);
      mockGc.gcEnabledRoute.mockReturnValue(true);

      const ctx = { dispatch: jest.fn() };

      gcrc.gcRouteChanged(ctx, { name: 'c-cluster-explorer', params: { resource: 'pods' } });

      expect(ctx.dispatch).not.toHaveBeenCalled();
    });

    it('returns early without dispatch when gcEnabledRoute is false', () => {
      mockGc.gcEnabledSetting.mockReturnValue(true);
      mockGc.gcEnabledRoute.mockReturnValue(false);

      const ctx = { dispatch: jest.fn() };

      gcrc.gcRouteChanged(ctx, { name: 'c-cluster-explorer', params: { resource: 'pods' } });

      expect(ctx.dispatch).not.toHaveBeenCalled();
    });

    it('returns early without dispatch when route is auth-logout', () => {
      mockGc.gcEnabledSetting.mockReturnValue(true);
      mockGc.gcEnabledRoute.mockReturnValue(true);

      const ctx = { dispatch: jest.fn() };

      gcrc.gcRouteChanged(ctx, { name: 'auth-logout', params: {} });

      expect(ctx.dispatch).not.toHaveBeenCalled();
    });

    it('dispatches garbageCollect with resource from to.params.resource as ignoreTypes', () => {
      mockGc.gcEnabledSetting.mockReturnValue(true);
      mockGc.gcEnabledRoute.mockReturnValue(true);

      const ctx = { dispatch: jest.fn() };

      gcrc.gcRouteChanged(ctx, { name: 'c-cluster-explorer', params: { resource: 'pods' } });

      expect(ctx.dispatch).toHaveBeenCalledWith('garbageCollect', { pods: true });
    });

    it('dispatches garbageCollect with empty ignoreTypes when no resource in params', () => {
      mockGc.gcEnabledSetting.mockReturnValue(true);
      mockGc.gcEnabledRoute.mockReturnValue(true);

      const ctx = { dispatch: jest.fn() };

      gcrc.gcRouteChanged(ctx, { name: 'some-route', params: {} });

      expect(ctx.dispatch).toHaveBeenCalledWith('garbageCollect', {});
    });

    it('dispatches garbageCollect with empty ignoreTypes when params is undefined', () => {
      mockGc.gcEnabledSetting.mockReturnValue(true);
      mockGc.gcEnabledRoute.mockReturnValue(true);

      const ctx = { dispatch: jest.fn() };

      gcrc.gcRouteChanged(ctx, { name: 'some-route' });

      expect(ctx.dispatch).toHaveBeenCalledWith('garbageCollect', {});
    });

    it('dispatches garbageCollect with empty ignoreTypes when route name matches c-cluster pattern (match[2] is undefined)', () => {
      // Note: getResourceFromRoute uses match[2] but the regex only has one capture group,
      // so match[1] contains the resource. match[2] === undefined → ignoreTYpes = {}
      mockGc.gcEnabledSetting.mockReturnValue(true);
      mockGc.gcEnabledRoute.mockReturnValue(true);

      const ctx = { dispatch: jest.fn() };

      gcrc.gcRouteChanged(ctx, { name: 'c-cluster-explorer', params: {} });

      expect(ctx.dispatch).toHaveBeenCalledWith('garbageCollect', {});
    });
  });
});
