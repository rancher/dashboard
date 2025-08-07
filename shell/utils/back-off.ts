type BackOffEntry = {
  timeoutId?: NodeJS.Timeout,
  try: number,
  retries: number,
  description: string,
  metadata: any,
}

// TODO: RC review
// 1) make sure if is solid for the happy case... no way to fail
// TODO: RC Test
// 1) Succeeds first time
// 2) Succeeds after a while
// 2) Succeeds after a while... user returns and it works without delay
// 3) Never succeeds (no new cycles)
// 4) User leaves context (no new cycles)
// 5) extensions/harvester?
// 6) delay happening ... resource.changes received
// 7) socket disconnect... reconnect

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
        this.log('info', id, 'Stopping (timeout cleared)', backOff.description);

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
  execute({
    id, description, retries = 10, delayedFn, metadata
  }: {
    id: string,
    description: string,
    retries: number,
    delayedFn: () => Promise<any>,
    metadata: any,
  }): NodeJS.Timeout | undefined {
    const backOff: BackOffEntry = this.map[id];

    if (backOff?.timeoutId) {
      this.log('info', id, 'Skipping (previous back off process still running)', backOff.description);

      return backOff?.timeoutId;
    } else {
      const backOffTry = backOff?.try || 0;

      if (backOffTry + 1 > retries) {
        this.log('error', id, 'Aborting (too many retries)', description);

        return undefined;
      }

      // Steps... 0.001s, 0.25s, 1s, 2.25s, 4s, 6.25s, 9s, 12.25s, 16s, 20.25s
      const delay = backOffTry === 0 ? 1 : Math.pow(backOffTry, 2) * 250;

      this.log('debug', id, `Delaying call (for ${ delay }ms)`, description);

      const timeout = setTimeout(async() => {
        try {
          this.log('info', id, `Executing call`, description);

          await delayedFn();

          delete this.map[id].timeoutId;
        } catch (e) {
          // Error occurred. Don't clear the map. Next time this is called we'll back off before trying ...
          this.log('error', id, 'Failed call', description, e);
        }
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
