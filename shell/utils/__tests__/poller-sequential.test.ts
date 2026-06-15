import PollerSequential from '@shell/utils/poller-sequential';

describe('pollerSequential', () => {
  let fn: jest.Mock;

  beforeEach(() => {
    jest.useFakeTimers();
    fn = jest.fn().mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should store fn, pollRateMs and maxRetries', () => {
      const poller = new PollerSequential(fn, 1000, 5);

      expect(poller.fn).toBe(fn);
      expect(poller.pollRateMs).toBe(1000);
      expect(poller.maxRetries).toBe(5);
    });

    it('should default maxRetries to POSITIVE_INFINITY', () => {
      const poller = new PollerSequential(fn, 500);

      expect(poller.maxRetries).toBe(Number.POSITIVE_INFINITY);
    });

    it('should substitute a no-op when fn is falsy', () => {
      const poller = new PollerSequential(null as any, 500);

      expect(typeof poller.fn).toBe('function');
    });

    it('should initialise tryCount to 0', () => {
      const poller = new PollerSequential(fn, 1000);

      expect(poller.tryCount).toBe(0);
    });

    it('should initialise timeoutId to undefined', () => {
      const poller = new PollerSequential(fn, 1000);

      expect(poller.timeoutId).toBeUndefined();
    });
  });

  describe('start', () => {
    it('should set timeoutId after start', () => {
      const poller = new PollerSequential(fn, 1000);

      poller.start();

      expect(poller.timeoutId).toBeDefined();

      poller.stop();
    });

    it('should not call fn immediately (delayed unlike Poller)', () => {
      const poller = new PollerSequential(fn, 1000);

      poller.start();

      expect(fn).not.toHaveBeenCalled();

      poller.stop();
    });

    it('should stop and restart when start is called while already running', () => {
      const poller = new PollerSequential(fn, 1000);
      const stopSpy = jest.spyOn(poller, 'stop');

      poller.start();
      poller.start();

      expect(stopSpy).toHaveBeenCalledWith();

      poller.stop();
    });
  });

  describe('stop', () => {
    it('should clear timeoutId after stop', () => {
      const poller = new PollerSequential(fn, 1000);

      poller.start();
      poller.stop();

      expect(poller.timeoutId).toBeUndefined();
    });

    it('should not call fn after stop', async() => {
      const poller = new PollerSequential(fn, 1000);

      poller.start();
      poller.stop();
      jest.advanceTimersByTime(10000);

      expect(fn).not.toHaveBeenCalled();
    });

    it('should be safe to call stop when not running', () => {
      const poller = new PollerSequential(fn, 1000);

      expect(() => poller.stop()).not.toThrow();
    });
  });

  describe('_poll', () => {
    it('should not continue polling if timeoutId has been cleared', async() => {
      const poller = new PollerSequential(fn, 1000);

      poller.timeoutId = undefined;
      poller._poll();

      jest.advanceTimersByTime(5000);

      expect(fn).not.toHaveBeenCalled();
    });

    it('should clear timeoutId and schedule next poll', () => {
      const poller = new PollerSequential(fn, 1000);

      poller.start();
      expect(poller.timeoutId).toBeDefined();

      const firstId = poller.timeoutId;

      // Advance past the initial delay to trigger _poll
      jest.advanceTimersByTime(1000);

      // _poll should have set a new timeout (different from the first)
      expect(poller.timeoutId).toBeDefined();
      // timeoutId should have changed since _poll calls stop then sets a new one
      expect(poller.timeoutId).not.toBe(firstId);

      poller.stop();
    });
  });

  describe('_intervalMethod', () => {
    it('should reset tryCount to 0 after a successful call', async() => {
      const poller = new PollerSequential(fn, 1000);

      poller.tryCount = 3;
      await poller._intervalMethod();

      expect(poller.tryCount).toBe(0);
    });

    it('should increment tryCount on each error', async() => {
      fn.mockRejectedValue(new Error('fail'));
      const poller = new PollerSequential(fn, 1000, 5);

      await poller._intervalMethod();
      expect(poller.tryCount).toBe(1);

      await poller._intervalMethod();
      expect(poller.tryCount).toBe(2);
    });

    it('should stop when tryCount reaches maxRetries', async() => {
      fn.mockRejectedValue(new Error('fail'));
      const poller = new PollerSequential(fn, 1000, 3);
      const stopSpy = jest.spyOn(poller, 'stop');

      await poller._intervalMethod();
      await poller._intervalMethod();
      expect(stopSpy).not.toHaveBeenCalled();

      await poller._intervalMethod();
      expect(stopSpy).toHaveBeenCalledTimes(1);
    });
  });
});
