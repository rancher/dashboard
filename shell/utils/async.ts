export const waitFor = (testFn: Function, msg = '', timeoutMs = 300000, intervalMs = 500, log = false): Promise<unknown> => {
  const gatedLog = (...args: any[]) => {
    if (log) {
      console.log(args.join(' ... ')); // eslint-disable-line no-console
    }
  }

  gatedLog('Starting wait for', msg);

  return new Promise((resolve, reject) => {
    let timeout: any;
    let interval: any;

    const wrappedTestFunction = () => {
      try {
        return testFn();
      } catch (e) {
        gatedLog('Wait for', msg || 'unknown', 'testFn threw an exception', e);
        clearInterval(interval);
        clearTimeout(timeout);
        reject(new Error(msg ? `Failed test for: ${ msg }` : `waitFor test failed`, { cause: e }));
        throw e;
      }
    };

    try {
      if (wrappedTestFunction()) {
        gatedLog('Wait for', msg || 'unknown', 'done immediately');
        resolve(true);
        return;
      }
    } catch (e) {
      return;
    }

    timeout = setTimeout(function waitForTimeout() {
      gatedLog('Wait for', msg, 'timed out');
      clearInterval(interval);
      clearTimeout(timeout);
      reject(new Error(msg ? `Failed waiting for: ${ msg }` : `waitFor timed out after ${ timeoutMs / 1000 } seconds`));
    }, timeoutMs);

    interval = setInterval(function waitForInterval() {
      try {
        if ( wrappedTestFunction() ) {
          gatedLog('Wait for', msg, 'done');
          clearInterval(interval);
          clearTimeout(timeout);
          resolve(true);
        } else if (msg) {
          gatedLog('Wait for', msg, 'not done yet');
        }
      } catch (e) {
      }
    }, intervalMs);
  });

};

export const wait = (milliseconds: number): Promise<unknown> => new Promise((resolve) => setTimeout(resolve, milliseconds));
