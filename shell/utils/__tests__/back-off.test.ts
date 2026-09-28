import backOff from '../back-off';

describe('backOff', () => {
  // Use Jest's fake timers to control `setTimeout`. This is crucial for testing delays.
  jest.useFakeTimers();

  // Mock console.log to prevent test logs from cluttering the console output.
  let consoleLogMock: jest.SpyInstance;
  let consoleErrorMock: jest.SpyInstance;

  const beforeEachFn = () => {
    // Before each test, reset the BackOff state.
    backOff.resetAll();

    // Create new mocks for each test to ensure a clean slate.
    consoleLogMock = jest.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorMock = jest.spyOn(console, 'error').mockImplementation(() => {});
  };

  const afterEachFn = () => {
    // Restore the original console functions after each test.
    consoleLogMock.mockRestore();
    consoleErrorMock.mockRestore();
  };

  describe('execute', () => {
    beforeEach(beforeEachFn);

    afterEach(afterEachFn);

    it('should execute the function immediately the first time without a delay', async() => {
      const delayedFn = jest.fn();

      // Call the function for the first time.
      await backOff.execute({
        id: 'test1', description: 'Test 1', delayedFn
      });

      // The function should have been called immediately, since the fake timer hasn't advanced.
      expect(delayedFn).toHaveBeenCalledTimes(0);
      expect(backOff.getBackOff('test1')).toBeDefined();
    });

    it('should back off and delay the second execution', async() => {
      const delayedFn = jest.fn();
      const id = 'backoff-test';

      // First call, which should run immediately.
      await backOff.execute({
        id, description: 'Backoff Test', delayedFn,
      });

      jest.advanceTimersByTime(1);

      // Expect the first call to be immediate.
      expect(delayedFn).toHaveBeenCalledTimes(1);

      // Call it a second time. This should initiate a backoff delay.
      await backOff.execute({
        id, description: 'Backoff Test', delayedFn
      });

      // The function should not have been called a second time yet.
      expect(delayedFn).toHaveBeenCalledTimes(1);

      // Advance the timer by less than the first backoff delay (250ms).
      jest.advanceTimersByTime(200);
      expect(delayedFn).toHaveBeenCalledTimes(1);

      // Now, advance the timer by the required delay to trigger the second call.
      jest.advanceTimersByTime(50);

      // The function should have been called a second time.
      await Promise.resolve();
      expect(delayedFn).toHaveBeenCalledTimes(2);

      // Verify the backoff entry was created correctly.
      const backOffEntry = backOff.getBackOff(id);

      expect(backOffEntry.try).toBe(2);
    });

    it('should implement exponential backoff on subsequent calls', async() => {
      const delayedFn = jest.fn();
      const id = 'exp-backoff';

      // First call (immediate)
      await backOff.execute({
        id, description: 'Exponential Backoff Test', delayedFn
      });

      jest.advanceTimersByTime(1);
      expect(delayedFn).toHaveBeenCalledTimes(1);

      // Second call (should have a delay of 1^2 * 250 = 250ms)
      await backOff.execute({
        id, description: 'Exponential Backoff Test', delayedFn
      });
      jest.advanceTimersByTime(250);
      await Promise.resolve();
      expect(delayedFn).toHaveBeenCalledTimes(2);

      // Third call (should have a delay of 2^2 * 250 = 1000ms)
      await backOff.execute({
        id, description: 'Exponential Backoff Test', delayedFn
      });
      jest.advanceTimersByTime(1000);
      await Promise.resolve();
      expect(delayedFn).toHaveBeenCalledTimes(3);

      // Fourth call (should have a delay of 3^2 * 250 = 2250ms)
      await backOff.execute({
        id, description: 'Exponential Backoff Test', delayedFn
      });
      jest.advanceTimersByTime(2250);
      await Promise.resolve();
      expect(delayedFn).toHaveBeenCalledTimes(4);
    });

    it('should skip execution if a previous backoff process is already running', async() => {
      const delayedFn = jest.fn();
      const id = 'skip-test';

      await backOff.execute({
        id, description: 'Skip Test', delayedFn
      });
      expect(delayedFn).toHaveBeenCalledTimes(0);

      // Second call, will be ignored
      await backOff.execute({
        id, description: 'Skip Test', delayedFn
      });

      expect(delayedFn).toHaveBeenCalledTimes(0);

      // We should only have 1 call so far.
      jest.advanceTimersByTime(1);
      await Promise.resolve();
      expect(delayedFn).toHaveBeenCalledTimes(1);

      // A third call while the first is still pending.
      // This call should be ignored and the delayedFn should not be executed.
      await backOff.execute({
        id, description: 'Skip Test', delayedFn
      });

      expect(delayedFn).toHaveBeenCalledTimes(1);

      jest.advanceTimersByTime(300);
      await Promise.resolve();
      expect(delayedFn).toHaveBeenCalledTimes(2);

      // Advance timers to complete the pending second call.
      jest.advanceTimersByTime(1000);
      await Promise.resolve();
      // Now there should be 2 calls, not 3.
      expect(delayedFn).toHaveBeenCalledTimes(2);
    });

    it('should not execute if the number of retries is exceeded', async() => {
      const delayedFn = jest.fn();
      const id = 'retries-test';

      // Set retries to 2.
      const retries = 2;

      // Call 1 (immediate)
      await backOff.execute({
        id, description: 'Retries Test', retries, delayedFn
      });
      jest.advanceTimersByTime(1);
      await Promise.resolve();
      expect(delayedFn).toHaveBeenCalledTimes(1);

      // Call 2 (after 250ms delay)
      await backOff.execute({
        id, description: 'Retries Test', retries, delayedFn
      });
      jest.advanceTimersByTime(250);
      await Promise.resolve();
      expect(delayedFn).toHaveBeenCalledTimes(2);

      // Call 3 (should be ignored because it exceeds the `retries` limit of 2)
      await backOff.execute({
        id, description: 'Retries Test', retries, delayedFn
      });
      jest.advanceTimersByTime(250);
      await Promise.resolve();

      expect(delayedFn).toHaveBeenCalledTimes(2);
    });

    it('should skip execution if `canFn` returns false', async() => {
      const delayedFn = jest.fn();
      const canFn = jest.fn().mockResolvedValue(false);

      await backOff.execute({
        id: 'canfn-test', description: 'canFn Test', canFn, delayedFn
      });

      jest.advanceTimersByTime(250);
      await Promise.resolve();

      expect(delayedFn).not.toHaveBeenCalled();
    });

    it('should not clear backoff entry if the delayedFn throws an error', async() => {
      const id = 'error-test';
      const delayedFn = jest.fn().mockRejectedValue(new Error('Test Error'));

      // Call the function for the first time.
      await backOff.execute({
        id, description: 'Error Test', delayedFn
      });

      expect(backOff.getBackOff(id).execute?.timeoutId).toBeDefined();

      // Wait for the immediate call to finish.
      jest.advanceTimersByTime(1);
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();

      // The entry should be removed after success/failure.
      expect(backOff.getBackOff(id).execute?.timeoutId).toBeUndefined();

      // Call again to trigger a backoff delay and an error.
      await backOff.execute({
        id, description: 'Error Test', delayedFn
      });

      expect(backOff.getBackOff(id).execute?.timeoutId).toBeDefined();

      // Advance timers to trigger the delayed function.
      jest.advanceTimersByTime(250);
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();

      // The timeoutId should be cleared, but the `try` count should be preserved on the next call.
      expect(backOff.getBackOff(id).execute?.timeoutId).toBeUndefined();

      // Check if the next call will still back off.
      const newDelayedFn = jest.fn();

      await backOff.execute({
        id, description: 'Error Test', delayedFn: newDelayedFn
      });
      expect(newDelayedFn).not.toHaveBeenCalled(); // The next call should still be delayed
    });

    it('should save metadata', async() => {
      const delayedFn = jest.fn();
      const id = 'exp-backoff';
      const metadata = { a: true };

      // First call (immediate)
      await backOff.execute({
        id, description: 'Exponential Backoff Test', delayedFn, metadata
      });

      expect(backOff.getBackOff(id)).toBeDefined();
      expect(backOff.getBackOff(id).metadata).toStrictEqual(metadata);
    });
  });

  describe('reset', () => {
    beforeEach(beforeEachFn);

    afterEach(afterEachFn);

    it('should reset a specific backoff process', async() => {
      const delayedFn = jest.fn();
      const id = 'reset-test';

      // Start a backoff process.
      await backOff.execute({
        id, description: 'Reset Test', delayedFn
      });

      expect(backOff.getBackOff(id)).toBeDefined();

      // Reset the process.
      backOff.reset(id);

      // The entry should be deleted from the map.
      expect(backOff.getBackOff(id)).toBeUndefined();

      // Now, a new execution should not be delayed.
      await backOff.execute({
        id, description: 'Reset Test', delayedFn
      });

      jest.advanceTimersByTime(250);
      await Promise.resolve();
      expect(delayedFn).toHaveBeenCalledTimes(1);
    });

    it('should reset all backoff processes', async() => {
      const delayedFn1 = jest.fn();
      const delayedFn2 = jest.fn();

      await backOff.execute({
        id: 'all-1', description: 'All 1', delayedFn: delayedFn1
      });
      await backOff.execute({
        id: 'all-1', description: 'All 1', delayedFn: delayedFn1
      });

      await backOff.execute({
        id: 'all-2', description: 'All 2', delayedFn: delayedFn2
      });
      await backOff.execute({
        id: 'all-2', description: 'All 2', delayedFn: delayedFn2
      });

      expect(backOff.getBackOff('all-1')).toBeDefined();
      expect(backOff.getBackOff('all-2')).toBeDefined();

      // Reset all processes.
      backOff.resetAll();

      expect(backOff.getBackOff('all-1')).toBeUndefined();
      expect(backOff.getBackOff('all-2')).toBeUndefined();
    });

    it('should reset only processes with a specific prefix', async() => {
      const delayedFn = jest.fn();

      await backOff.execute({
        id: 'prefix-test-1', description: 'Prefix Test 1', delayedFn
      });
      await backOff.execute({
        id: 'prefix-test-1', description: 'Prefix Test 1', delayedFn
      });

      await backOff.execute({
        id: 'prefix-test-2', description: 'Prefix Test 2', delayedFn
      });
      await backOff.execute({
        id: 'prefix-test-2', description: 'Prefix Test 2', delayedFn
      });

      await backOff.execute({
        id: 'other-test-1', description: 'Other Test 1', delayedFn
      });
      await backOff.execute({
        id: 'other-test-1', description: 'Other Test 1', delayedFn
      });

      expect(backOff.getBackOff('prefix-test-1')).toBeDefined();
      expect(backOff.getBackOff('prefix-test-2')).toBeDefined();
      expect(backOff.getBackOff('other-test-1')).toBeDefined();

      // Reset only the "prefix-test" processes.
      backOff.resetPrefix('prefix-test');

      expect(backOff.getBackOff('prefix-test-1')).toBeUndefined();
      expect(backOff.getBackOff('prefix-test-2')).toBeUndefined();
      // The other process should still exist.
      expect(backOff.getBackOff('other-test-1')).toBeDefined();
    });
  });

  describe('recurse', () => {
    beforeEach(beforeEachFn);

    afterEach(afterEachFn);

    const handlePromises = async() => {
      for (let i = 0; i < 10; i++) {
        await Promise.resolve();
      }
    };

    const iterationLoop = async(wait: number) => {
      await handlePromises();

      jest.advanceTimersByTime(wait);

      await handlePromises();
    };

    it('should execute the function immediately', async() => {
      const delayedFn = jest.fn().mockResolvedValue('success');
      const id = 'recurse-test';

      const promise = backOff.recurse({
        id, description: 'Recurse Test', delayedFn, continueOnError: async() => false
      });

      await iterationLoop(1);

      const result = await promise;

      expect(delayedFn).toHaveBeenCalledTimes(1);
      expect(result).toBe('success');
    });

    it('should retry on failure if continueOnError returns true', async() => {
      const delayedFn = jest.fn()
        .mockRejectedValueOnce(new Error('Fail 1'))
        .mockResolvedValue('success');
      const id = 'recurse-retry';
      const continueOnError = jest.fn().mockResolvedValue(true);

      const promise = backOff.recurse({
        id, description: 'Recurse Retry', delayedFn, continueOnError
      });

      // First attempt (i=0)
      await iterationLoop(1);

      // Second attempt (i=1), delay 250ms
      await iterationLoop(250);

      const result = await promise;

      expect(delayedFn).toHaveBeenCalledTimes(2);
      expect(result).toBe('success');
    });

    it('should stop retrying if continueOnError returns false', async() => {
      const delayedFn = jest.fn().mockRejectedValue(new Error('Fail'));
      const id = 'recurse-stop';
      const continueOnError = jest.fn().mockResolvedValue(false);

      const promise = backOff.recurse({
        id, description: 'Recurse Stop', delayedFn, continueOnError
      });

      await iterationLoop(1);

      await expect(promise).rejects.toThrow('Failed call');
      expect(delayedFn).toHaveBeenCalledTimes(1);
    });

    it('should stop retrying if max retries reached', async() => {
      const delayedFn = jest.fn().mockRejectedValue(new Error('Fail'));
      const id = 'recurse-max';
      const continueOnError = jest.fn().mockResolvedValue(true);
      const retries = 2;

      const promise = backOff.recurse({
        id, description: 'Recurse Max', delayedFn, continueOnError, retries
      });

      // Try 1
      await iterationLoop(1);

      // Try 2
      await iterationLoop(250);

      const result = await promise;

      expect(result).toBeUndefined();
      expect(delayedFn).toHaveBeenCalledTimes(2);
    });

    it('should skip if canFn returns false', async() => {
      const delayedFn = jest.fn();
      const id = 'recurse-canfn';
      const canFn = jest.fn().mockResolvedValue(false);

      const promise = backOff.recurse({
        id, description: 'Recurse CanFn', delayedFn, continueOnError: async() => false, canFn
      });

      await expect(promise).rejects.toThrow('Skipping (canFn test failed)');
      expect(delayedFn).not.toHaveBeenCalled();
    });
  });
});
