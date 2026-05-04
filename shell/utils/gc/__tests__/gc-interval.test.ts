describe('gc-interval', () => {
  let gci: any;
  let mockGc: any;

  beforeEach(() => {
    jest.useFakeTimers();

    mockGc = {
      gcEnabledSetting:  jest.fn(),
      gcEnabledInterval: jest.fn(),
    };

    jest.resetModules();
    jest.mock('../gc', () => ({ default: mockGc, __esModule: true }));

    gci = require('../gc-interval').default;
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  describe('gcStartIntervals', () => {
    it('does not start interval when gcEnabledSetting returns false', () => {
      mockGc.gcEnabledSetting.mockReturnValue(false);
      mockGc.gcEnabledInterval.mockReturnValue({ enabled: true, interval: 60 });

      const ctx = { dispatch: jest.fn() };

      gci.gcStartIntervals(ctx);

      jest.advanceTimersByTime(120_000);
      expect(ctx.dispatch).not.toHaveBeenCalled();
    });

    it('does not start interval when gcEnabledInterval returns enabled=false', () => {
      mockGc.gcEnabledSetting.mockReturnValue(true);
      mockGc.gcEnabledInterval.mockReturnValue({ enabled: false, interval: 60 });

      const ctx = { dispatch: jest.fn() };

      gci.gcStartIntervals(ctx);

      jest.advanceTimersByTime(120_000);
      expect(ctx.dispatch).not.toHaveBeenCalled();
    });

    it('starts interval and dispatches garbageCollect when gc is enabled', () => {
      mockGc.gcEnabledSetting.mockReturnValue(true);
      mockGc.gcEnabledInterval.mockReturnValue({ enabled: true, interval: 60 });

      const ctx = { dispatch: jest.fn() };

      gci.gcStartIntervals(ctx);

      jest.advanceTimersByTime(60_000);
      expect(ctx.dispatch).toHaveBeenCalledWith('garbageCollect');
    });

    it('dispatches garbageCollect repeatedly according to interval', () => {
      mockGc.gcEnabledSetting.mockReturnValue(true);
      mockGc.gcEnabledInterval.mockReturnValue({ enabled: true, interval: 30 });

      const ctx = { dispatch: jest.fn() };

      gci.gcStartIntervals(ctx);

      jest.advanceTimersByTime(90_000);
      expect(ctx.dispatch).toHaveBeenCalledTimes(3);
      expect(ctx.dispatch).toHaveBeenCalledWith('garbageCollect');
    });

    it('does not start a second interval if already running', () => {
      mockGc.gcEnabledSetting.mockReturnValue(true);
      mockGc.gcEnabledInterval.mockReturnValue({ enabled: true, interval: 60 });

      const ctx = { dispatch: jest.fn() };

      gci.gcStartIntervals(ctx);
      gci.gcStartIntervals(ctx); // second call should be a no-op

      jest.advanceTimersByTime(60_000);
      expect(ctx.dispatch).toHaveBeenCalledTimes(1);
    });
  });

  describe('gcStopIntervals', () => {
    it('clears the running interval', () => {
      mockGc.gcEnabledSetting.mockReturnValue(true);
      mockGc.gcEnabledInterval.mockReturnValue({ enabled: true, interval: 60 });

      const ctx = { dispatch: jest.fn() };

      gci.gcStartIntervals(ctx);
      gci.gcStopIntervals();

      jest.advanceTimersByTime(120_000);
      expect(ctx.dispatch).not.toHaveBeenCalled();
    });

    it('is safe to call when no interval is running', () => {
      expect(() => gci.gcStopIntervals()).not.toThrow();
    });

    it('allows a new interval to be started after stopping', () => {
      mockGc.gcEnabledSetting.mockReturnValue(true);
      mockGc.gcEnabledInterval.mockReturnValue({ enabled: true, interval: 60 });

      const ctx = { dispatch: jest.fn() };

      gci.gcStartIntervals(ctx);
      gci.gcStopIntervals();
      gci.gcStartIntervals(ctx);

      jest.advanceTimersByTime(60_000);
      expect(ctx.dispatch).toHaveBeenCalledTimes(1);
    });
  });
});
