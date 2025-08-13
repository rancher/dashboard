type BackOffEntry = {
  timeoutId?: NodeJS.Timeout,
  try: number,
  retries: number,
  description: string,
  metadata: any,
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

  private log(level: 'error' | 'info' | 'debug', id: string, classDescription: string, description: string, ...args: any[]) {
    console[level](`BackOff... Id: "${ id }". Description: "${ description }"\nStatus: ${ classDescription }\n`, ...args); // eslint-disable-line no-console
  }

  /**
   * Get a specific back off process
   */
  getBackOff(id: string): BackOffEntry {
    return this.map[id];
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
        this.log('info', id, 'Stopping (cancelling active back-off)', backOff.description);

        clearTimeout(backOff.timeoutId);
      }
      this.log('debug', id, 'Reset', backOff.description);

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
   */
  async execute<T = any>({
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
  }): Promise<NodeJS.Timeout | undefined> {
    const backOff: BackOffEntry = this.map[id];

    const cont = await canFn();

    if (!cont) {
      this.log('info', id, 'Skipping (can execute fn test failed)', description);

      return undefined;
    } else if (backOff?.timeoutId) {
      this.log('info', id, 'Skipping (previous back off process still running)', description);

      return backOff.timeoutId;
    } else {
      const backOffTry = backOff?.try || 0;

      if (backOffTry + 1 > retries) {
        this.log('error', id, 'Aborting (too many retries)', description);

        return undefined;
      }

      // First step is immediate (0.001s)
      // Second and others are exponential
      // 1,      2,     3,  4,     5,  6,      7,   8,      9
      // 1,      4,     9, 16,    25, 36,     49,  64,     81
      // 0.25s, 1s, 2.25s, 4s, 6.25s, 9s, 12.25s, 16s, 20.25s
      const delay = backOffTry === 0 ? 1 : Math.pow(backOffTry, 2) * 250;

      this.log('info', id, `Delaying call (attempt ${ backOffTry + 1 }, delayed by ${ delay }ms)`, description);

      const timeout = setTimeout(async() => {
        try {
          this.log('info', id, `Executing call`, description);

          await delayedFn();
        } catch (e) {
          // Error occurred. Don't clear the map. Next time this is called we'll back off before trying ...
          this.log('error', id, 'Failed call', description, e);
        }

        // Unblock future calls
        delete this.map[id]?.timeoutId;
      }, delay);

      this.map[id] = {
        timeoutId: timeout,
        try:       backOff?.try ? backOff.try + 1 : 1,
        retries,
        description,
        metadata
      };

      return timeout;
    }
  }
}

const backOff = new BackOff();

export default backOff;
