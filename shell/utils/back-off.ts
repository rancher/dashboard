type BackOffEntry<T = any> = {
  timeoutId?: NodeJS.Timeout,
  try: number,
  retries: number,
  description: string,
  metadata: any,
  result?: Promise<T>,
  resultReject?: (reason?: any) => void
}

/**
 * Helper class which handles backing off making the supplied request
 *
 * see `execute` for more info
 */
class BackOff {
  private map: {
   [id: string]: BackOffEntry
  } = {};

  private log(level: 'error' | 'info' | 'debug', {
    id, status, description, metadata
  }: { id: string, status: string, description: string, metadata?: any }, ...args: any[]) {
    console[level](`BackOff... \nId: "${ id }". Description: "${ description }". Metadata: "${ JSON.stringify(metadata) }"\nStatus: ${ status }\n`, ...args); // eslint-disable-line no-console
  }

  /**
   * Get a specific back off process
   */
  getBackOff(id: string): BackOffEntry {
    return this.map[id];
  }

  getBackOffWithPrefix(prefix: string): String[] {
    return Object.keys(this.map).filter((id) => id.startsWith(prefix));
  }

  /**
   * Stop ALL back off processes started since the ui was loaded
   */
  resetAll() {
    Object.keys(this.map).forEach((id) => {
      this.reset(id);
    });
  }

  /**
   * Stop all back off process with a specific prefix
   */
  resetPrefix(prefix:string) {
    Object.keys(this.map).forEach((id) => {
      if (id.startsWith(prefix)) {
        this.reset(id);
      }
    });
  }

  /**
   * Stop a back off process with a specific id
   */
  reset(id: string) {
    const backOff: BackOffEntry = this.map[id];

    if (backOff) {
      if (backOff?.timeoutId) {
        this.log('info', {
          id, status: 'Stopping (cancelling active back-off)', description: backOff.description, metadata: backOff.metadata
        });

        clearTimeout(backOff.timeoutId);
      }
      this.log('debug', {
        id, status: 'Reset', description: backOff.description, metadata: backOff.metadata
      });

      delete this.map[id];
    }
  }

  /**
   * Call a function, but if it's recently been called delay execution aka back off
   *
   * This can be used in a totally disjoined asynchronous way
   *
   * 1. Request function A to be run
   * 2. Entirely separate process requests function A to be run again
   * 3. Back off process waits Xms and then runs function A again
   * 4. Repeat steps 2 and 3, with an exponential increasing delay
   *
   * This can be called repeatedly, if the previous delay is still running new requests will be ignored
   *
   * @template T - Type of configuration that can be stored with the backoff record
   * @template Y - Type of result returned
   */
  async execute<T = any, Y= any>({
    id, description, retries = 10, delayedFn, canFn = async() => true, metadata
  }: {
    /**
     * Unique id for the execution of this function.
     *
     * This will be used to delay further executions, and also to cancel it
     */
    id: string,
    /**
     * Basic text description to use in logging
     */
    description: string,
    /**
     * Number of executions allowed before flatly refusing to call more. Defaults to 10
     */
    retries?: number,
    /**
     * Before calling delayedFn check if it can still run
     *
     * Useful for checking state after a looong delay
     */
    canFn?: () => Promise<boolean>,
    /**
     * Call this function
     * - if it's not already waiting to run
     * - if it's passed canFn
     * - if it hasn't been tried over `retries` amount
     *
     * The function will be increasingly (exponentially) delayed if it has previously been called
     */
    delayedFn: () => Promise<any>,
    /**
     * Anything that might be important outside of this file (used with `getBackOff`)
     */
    metadata?: T,
  }): Promise<Y | undefined> {
    const backOff: BackOffEntry = this.map[id];

    const cont = await canFn();

    if (!cont) {
      this.log('info', {
        id, status: 'Skipping (canExecute test failed)', description, metadata
      });

      return Promise.reject(new Error('dsfdsf')); // TODO: RC
    } else if (backOff?.timeoutId) {
      this.log('info', {
        id, status: 'Skipping (previous back off process still running)', description, metadata
      });

      return backOff?.result;
    } else {
      const backOffTry = backOff?.try || 0;

      if (backOffTry + 1 > retries) {
        this.log('error', {
          id, status: 'Aborting (too many retries)', description, metadata
        });

        backOff?.resultReject?.('Aborting (too many retries)');

        return backOff?.result;
      }

      // First step is immediate (0.001s)
      // Second and others are exponential
      // Iteration: 1,     2,   3,     4,    5,      6,    7,       8,    9
      // Multiple:  1,     4,   9,     16,   25,     36,   49,      64,   81
      // Delay:     0.25s, 1s,  2.25s, 4s,   6.25s,  9s,   12.25s,  16s,  20.25s
      const delay = backOffTry === 0 ? 1 : Math.pow(backOffTry, 2) * 250;

      const logLevel = backOffTry === 0 ? 'debug' : 'info';

      this.log(logLevel, {
        id, status: `Delaying call (attempt ${ backOffTry + 1 }, delayed by ${ delay }ms)`, description, metadata
      });

      this.map[id] = {
        timeoutId:    undefined,
        try:          backOff?.try ? backOff.try + 1 : 1,
        retries,
        description,
        metadata,
        result:       undefined,
        resultReject: undefined,
      };
      this.map[id].result = new Promise((resolve, reject) => {
        this.map[id].resultReject = reject;

        const timeout = setTimeout(async() => {
          try {
            this.log(logLevel, {
              id, status: `Executing call`, description, metadata
            });

            const res = await delayedFn();

            resolve(res);
          } catch (e) {
            // Error occurred. Don't clear the map. Next time this is called we'll back off before trying ...
            this.log('error', {
              id, status: 'Failed call', description, metadata
            }, e);
          }

          // Unblock future calls
          delete this.map[id];

          // delete this.map[id]?.timeoutId; // avoids some scary log files in reset()
          // this.reset(id); // Reset the try counter so next requests with same id don't act same as failed requests

          // this.map[id].result = undefined;
        }, delay);

        this.map[id].timeoutId = timeout;
      });

      return this.map[id].result;
    }
  }
}

const backOff = new BackOff();

export default backOff;
