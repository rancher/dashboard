import Poller from '@shell/utils/poller';

describe('poller', () => {
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
      const poller = new Poller(fn, 1000, 5);

      expect(poller.fn).toBe(fn);
      expect(poller.pollRateMs).toBe(1000);
      expect(poller.maxRetries).toBe(5);
    });

    it('should default maxRetries to POSITIVE_INFINITY', () => {
      const poller = new Poller(fn, 500);

      expect(poller.maxRetries).toBe(Number.POSITIVE_INFINITY);
    });

    it('should substitute a no-op when fn is falsy', () => {
      const poller = new Poller(null as any, 500);

      expect(typeof poller.fn).toBe('function');
    });

    it('should initialise tryCount to 0', () => {
      const poller = new Poller(fn, 1000);

      expect(poller.tryCount).toBe(0);
    });

    it('should initialise intervalId to undefined', () => {
      const poller = new Poller(fn, 1000);

      expect(poller.intervalId).toBeUndefined();
    });
  });

  describe('start', () => {
    it('should call fn immediately when started', () => {
      const poller = new Poller(fn, 1000);

      poller.start();

      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should set intervalId after start', () => {
      const poller = new Poller(fn, 1000);

      poller.start();

      expect(poller.intervalId).toBeDefined();
    });

    it('should call fn again after each poll interval', async() => {
      const poller = new Poller(fn, 1000);

      poller.start();
      expect(fn).toHaveBeenCalledTimes(1);

      jest.advanceTimersByTime(1000);
      expect(fn).toHaveBeenCalledTimes(2);

      jest.advanceTimersByTime(1000);
      expect(fn).toHaveBeenCalledTimes(3);

      poller.stop();
    });

    it('should stop and restart when start is called while already running', () => {
      const poller = new Poller(fn, 1000);
      const stopSpy = jest.spyOn(poller, 'stop');

      poller.start();
      poller.start();

      expect(stopSpy).toHaveBeenCalledWith();

      poller.stop();
    });
  });

  describe('stop', () => {
    it('should clear intervalId after stop', () => {
      const poller = new Poller(fn, 1000);

      poller.start();
      poller.stop();

      expect(poller.intervalId).toBeUndefined();
    });

    it('should not call fn after stop', () => {
      const poller = new Poller(fn, 1000);

      poller.start();
      expect(fn).toHaveBeenCalledTimes(1);

      poller.stop();
      jest.advanceTimersByTime(5000);

      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should be safe to call stop when not running', () => {
      const poller = new Poller(fn, 1000);

      expect(() => poller.stop()).not.toThrow();
    });
  });

  describe('_intervalMethod', () => {
    it('should reset tryCount to 0 after a successful call', async() => {
      const poller = new Poller(fn, 1000);

      poller.tryCount = 3;
      await poller._intervalMethod();

      expect(poller.tryCount).toBe(0);
    });

    it('should increment tryCount on each error', async() => {
      fn.mockRejectedValue(new Error('fail'));
      const poller = new Poller(fn, 1000, 5);

      await poller._intervalMethod();
      expect(poller.tryCount).toBe(1);

      await poller._intervalMethod();
      expect(poller.tryCount).toBe(2);
    });

    it('should stop when tryCount reaches maxRetries', async() => {
      fn.mockRejectedValue(new Error('fail'));
      const poller = new Poller(fn, 1000, 3);
      const stopSpy = jest.spyOn(poller, 'stop');

      await poller._intervalMethod();
      await poller._intervalMethod();
      expect(stopSpy).not.toHaveBeenCalled();

      await poller._intervalMethod();
      expect(stopSpy).toHaveBeenCalledTimes(1);
    });

    it('should not stop before maxRetries is reached', async() => {
      fn.mockRejectedValue(new Error('fail'));
      const poller = new Poller(fn, 1000, 5);
      const stopSpy = jest.spyOn(poller, 'stop');

      for (let i = 0; i < 4; i++) {
        await poller._intervalMethod();
      }

      expect(stopSpy).not.toHaveBeenCalled();
    });
  });
});
