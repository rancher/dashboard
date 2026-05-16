import { waitFor, wait } from '@shell/utils/async';

describe('wait', () => {
  it('resolves after the specified delay', async() => {
    jest.useFakeTimers();

    const p = wait(1000);

    jest.advanceTimersByTime(1000);
    await expect(p).resolves.toBeUndefined();

    jest.useRealTimers();
  });

  it('does not resolve before the delay elapses', async() => {
    jest.useFakeTimers();

    let resolved = false;
    const p = wait(500).then(() => {
      resolved = true;
    });

    jest.advanceTimersByTime(499);
    expect(resolved).toBe(false);

    jest.advanceTimersByTime(1);
    await p;
    expect(resolved).toBe(true);

    jest.useRealTimers();
  });
});

describe('waitFor', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it('resolves immediately when testFn returns true on first call', async() => {
    jest.useFakeTimers();
    const testFn = jest.fn().mockReturnValue(true);

    const p = waitFor(testFn, 'ready');

    await expect(p).resolves.toBeDefined();
    expect(testFn).toHaveBeenCalledTimes(1);
  });

  it('resolves after testFn eventually returns true', async() => {
    jest.useFakeTimers();
    let count = 0;
    const testFn = jest.fn().mockImplementation(() => {
      count++;

      return count >= 3;
    });

    const p = waitFor(testFn, 'ready', 10000, 500);

    // first call returns false (immediate check), then intervals fire
    jest.advanceTimersByTime(500); // interval 1 → count=2, false
    jest.advanceTimersByTime(500); // interval 2 → count=3, true
    await p;

    expect(testFn).toHaveBeenCalledTimes(3);
  });

  it('rejects with msg when timeout elapses', async() => {
    jest.useFakeTimers();
    const testFn = jest.fn().mockReturnValue(false);

    const p = waitFor(testFn, 'some condition', 1000, 500);

    jest.advanceTimersByTime(1001);
    await expect(p).rejects.toThrow('Failed waiting for: some condition');
  });

  it('rejects with generic message when no msg provided and timeout elapses', async() => {
    jest.useFakeTimers();
    const testFn = jest.fn().mockReturnValue(false);

    const p = waitFor(testFn, '', 2000, 500);

    jest.advanceTimersByTime(2001);
    await expect(p).rejects.toThrow('waitFor timed out after 2 seconds');
  });
});
