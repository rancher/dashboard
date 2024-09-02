export const waitFor = (testFn: Function, msg = '', timeoutMs = 3000000, intervalMs = 500, log = false): Promise<unknown> => {
  gatedLog('Starting wait for', msg);

  return new Promise((resolve, reject) => {
    if (testFn()) {
      gatedLog('Wait for', msg || 'unknown', 'done immediately');
      resolve(this);
    }
    const timeout = setTimeout(() => {
      gatedLog('Wait for', msg, 'timed out');
      clearInterval(interval);
      clearTimeout(timeout);
      if (msg) {
        reject(new Error(`Failed waiting for: ${ msg }`));
      } else {
        throw new Error(`waitFor timed out after ${ timeoutMs / 1000 } seconds`);
      }
    }, timeoutMs);
    const interval = setInterval(() => {
      if ( testFn() ) {
        gatedLog('Wait for', msg, 'done');
        clearInterval(interval);
        clearTimeout(timeout);
        resolve(this);
      } else if (msg) {
        gatedLog('Wait for', msg, 'not done yet');
      }
    }, intervalMs);
  });

  function gatedLog(...args: any[]) {
    if (log) {
      console.log(...args); // eslint-disable-line no-console
    }
  }
};

export const wait = (milliseconds: number): Promise<unknown> => new Promise((resolve) => setTimeout(resolve, milliseconds));
