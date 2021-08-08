const DEFAULT_WAIT_INTERVAL = 1000;
const DEFAULT_WAIT_TIMEOUT = 30000;

export default {
  testFn(fn, msg, timeoutMs, intervalMs) {
    console.log('Starting wait for', msg); // eslint-disable-line no-console

    if ( !timeoutMs ) {
      timeoutMs = DEFAULT_WAIT_TIMEOUT;
    }

    if ( !intervalMs ) {
      intervalMs = DEFAULT_WAIT_INTERVAL;
    }

    return new Promise((resolve, reject) => {
      // Do a first check immediately
      if ( fn.apply(this) ) {
        console.log('Wait for', msg, 'done immediately'); // eslint-disable-line no-console
        resolve(this);
      }

      const timeout = setTimeout(() => {
        console.log('Wait for', msg, 'timed out'); // eslint-disable-line no-console
        clearInterval(interval);
        clearTimeout(timeout);
        reject(new Error(`Failed while: ${ msg }`));
      }, timeoutMs);

      const interval = setInterval(() => {
        if ( fn.apply(this) ) {
          console.log('Wait for', msg, 'done'); // eslint-disable-line no-console
          clearInterval(interval);
          clearTimeout(timeout);
          resolve(this);
        } else {
          console.log('Wait for', msg, 'not done yet'); // eslint-disable-line no-console
        }
      }, intervalMs);
    });
  },

  async waitFor(getterFn, testFn, fetchFn, msg, errorMsg) {
    try {
      await this.testFn(() => {
        if (testFn(getterFn())) {
          return true;
        }
        fetchFn();
      }, msg, undefined, 2000);
    } catch (e) {
      console.warn(errorMsg, e); // eslint-disable-line no-console
      throw new Error(errorMsg);
    }
  },
};
