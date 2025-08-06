type BackOffEntry = {
  timeoutId?: NodeJS.Timeout,
  try: number,
  retries: number,
  description: string,
  metadata: any,
}

/**
 * TODO: RC
 */
class BackOff {
  private map: {
   [id: string]: BackOffEntry
  } = {};

  private log(level: 'error' | 'info' | 'debug', classDescription: string, description: string, ...args: any[]) {
    console[level](`BackOff: Process Description ${ description }\nStatus: ${ classDescription }\n`, ...args); // eslint-disable-line no-console
  }

  known(id: string) {
    return this.map[id];
  }

  /**
 * TODO: RC
 */
  resetPrefix(prefix:string) {
    Object.entries(this.map).forEach(([id, entry]) => {
      if (id.startsWith(prefix)) {
        this.reset(id);
      }
    });
  }

  /**
   * TODO: RC
   */
  reset(id: string) {
    const backOff: BackOffEntry = this.map[id];

    if (backOff) {
      if (backOff?.timeoutId) {
        this.log('info', 'Stopping (timeout cleared)', backOff.description);

        clearTimeout(backOff.timeoutId);
      }
      this.log('debug', 'Reset', backOff.description);

      delete this.map[id];
    }
  }

  /**
   * This function can be called repeatedly but will delay calling the provided function if it previously failed
   */
  execute({
    id, description, retries, fn, metadata
  }: {
    id: string,
    description: string,
    retries: number,
    fn: () => Promise<any>,
    metadata: any,
  }) {
    const backOff: BackOffEntry = this.map[id];

    if (backOff?.timeoutId) {
      this.log('info', 'Skipping (previous back off process still running)', backOff.description);
    } else {
      const backOffTry = backOff?.try || 0;

      if (backOffTry + 1 > retries) {
        this.log('error', 'Aborting (too many retries)', description);

        return;
      }

      // Steps... 0.001s, 0.25s, 1s, 2.25s, 4s, 6.25s, 9s, 12.25s
      const delay = backOffTry === 0 ? 1 : Math.pow(backOffTry, 2) * 250;

      this.log('info', `Executing call (delayed for ${ delay }ms)`, description);

      const timeout = setTimeout(async() => {
        try {
          this.log('info', `Executing call (actual)`, description);

          await fn();

          delete this.map[id].timeoutId;
        } catch (e) {
          // Error occurred. Don't clear the map. Next time this is called we'll back off before trying ...
          this.log('error', 'Failed call', description, e);
        }
      }, delay);

      this.map[id] = {
        timeoutId: timeout,
        try:       backOff?.try ? backOff.try + 1 : 1,
        retries,
        description,
        metadata
      };
    }
  }
}

const backOff = new BackOff();

export default backOff;
