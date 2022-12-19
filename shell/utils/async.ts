export const waitFor = (testFn: Function, msg = '', timeoutMs = 3000000, intervalMs = 500, log = false) => {
  return new Promise((resolve, reject) => {
    if (testFn()) {
      if (log) {
        console.log('Wait for', msg || 'unknown', 'done immediately'); // eslint-disable-line no-console
      }
      resolve(this);
    }
    const timeout = setTimeout(() => {
      clearInterval(interval);
      clearTimeout(timeout);
      if (msg) {
        reject(new Error(`Failed waiting for: ${ msg }`));
      } else {
        throw new Error(`waitFor timed out after ${ timeoutMs / 1000 } seconds`);
      }
    }, timeoutMs); // timeout set to 5 minutes (!)
    const interval = setInterval(() => {
      if ( testFn() ) {
        clearInterval(interval);
        clearTimeout(timeout);
        resolve(this);
      } else if (msg) {
        console.log('Wait for', msg, 'not done yet'); // eslint-disable-line no-console
      }
    }, intervalMs);
  });
};
