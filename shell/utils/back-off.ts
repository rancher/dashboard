import { randomStr } from '@shell/utils/string';

type BackOffEntry<MetadataType = any> = {
  try: number,
  retries: number,
  description: string,
  metadata: MetadataType,
  execute?: {
    timeoutId?: NodeJS.Timeout,
  },
  recurse?: {
    id: string,
  }
}

interface BackOffArgs<MetadataType = any> {
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
  metadata?: MetadataType,
  /**
   *
   * RESET_ON_SUCCESS
   */
  mode?: ''
}

export type BackOffExecuteArgs<MetadataType> = BackOffArgs<MetadataType>

export interface BackOffRecurseArgs<MetadataType> extends BackOffArgs<MetadataType> {
  continueOnError: (arg: any) => Promise<boolean>,
}

const logStyle = 'font-weight: bold; font-style: italic;';
const logStyleReset = 'font-weight: normal; font-style: normal;';

const logInitialBackOffRequest = true;
const calcLogLevel = (iteration: number) => {
  if (!logInitialBackOffRequest && iteration === 0) {
    return undefined;
  }

  return 'info';
};

/**
 * Helper class which handles backing off making the supplied request
 *
 * see `execute` for more info
 */
class BackOff {
  private map: {
   [id: string]: BackOffEntry
  } = {};

  private log(level: 'error' | 'info' | 'debug' | undefined, {
    id, status, description, metadata
  }: { id: string, status: string, description: string, metadata?: any }, ...args: any[]) {
    if (!level) {
      return;
    }

    // eslint-disable-next-line no-console
    console[level](
      `%cBackOff%c... \n%cId%c:          ${ id }\n%cStatus%c:      ${ status }\n%cDescription%c: ${ description }\n%cMetadata%c:    ${ metadata ? JSON.stringify(metadata) : '' }`,
      logStyle, logStyleReset,
      logStyle, logStyleReset,
      logStyle, logStyleReset,
      logStyle, logStyleReset,
      logStyle, logStyleReset,
      ...args
    );
  }

  /**
   * Get a specific back off process
   */
  getBackOff(id: string): BackOffEntry {
    return this.map[id];
  }

  // getBackOffWithPrefix(prefix: string): String[] {
  //   return Object.keys(this.map).filter((id) => id.startsWith(prefix));
  // }

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
      if (backOff?.execute?.timeoutId) {
        this.log('info', {
          id, status: 'Stopping (cancelling active back-off)', description: backOff.description, metadata: backOff.metadata
        });

        clearTimeout(backOff.execute.timeoutId);
      }
      const backOffTry = backOff?.try || 0;
      const logLevel = backOffTry <= 1 ? undefined : 'debug';

      this.log(logLevel, {
        id, status: 'Reset', description: backOff.description, metadata: backOff.metadata
      });

      delete this.map[id];
    } else {
      debugger;
    }
  }

  private sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  private calcDelay = (iteration: number) => {
    // First step is immediate (0.001s)
    // Second and others are exponential
    // Iteration: 1,     2,   3,     4,    5,      6,    7,       8,    9
    // Delay:     0.25s, 1s,  2.25s, 4s,   6.25s,  9s,   12.25s,  16s,  20.25s
    return iteration === 0 ? 1 : Math.pow(iteration, 2) * 250;
  }

  // private checkReset = async({ id, description, metadata }: BackOffArgs<any>) => {
  //   if (!this.map[id]) {
  //     // some reset, don't care now, abort
  //     const errorMessage = 'Aborting (backoff was reset, do not continue to process)';

  //     this.log('error', {
  //       id, status: errorMessage, description, metadata
  //     });

  //     return Promise.reject(new Error(errorMessage));
  //   }
  // };

  private canRecurse = async(backOffEntry: BackOffEntry, {
    id, description, metadata, canFn = async() => true
  }: BackOffRecurseArgs<any>) => {
    if (!this.map[id]) {
      // some reset, don't care now, abort
      const errorMessage = 'Aborting (backoff was reset, do not continue to process)';

      this.log('error', {
        id, status: errorMessage, description, metadata
      });

      return Promise.reject(new Error(errorMessage));
    }

    if (this.map[id].recurse?.id !== backOffEntry.recurse?.id) {
      const errorMessage = 'Aborting (stale backoff, a new one exists)';

      this.log('error', {
        id, status: errorMessage, description, metadata
      });

      return Promise.reject(new Error(errorMessage));
    }

    const cont = await canFn();

    if (!cont) {
      this.log('info', {
        id, status: 'Skipping (canFn test failed)', description, metadata
      });

      return Promise.reject(new Error('Skipping (canFn test failed)'));
    }
  };

  // TODO: RC use this for scenario 2 + 3
  /**
   * Keep trying until successful
   *
   * Return result
   *
   * TODO: RC
   * @param args
   * @returns
   */
  async recurse<MetadataType = any, ResponseType = any>(args: BackOffRecurseArgs<MetadataType>): Promise<ResponseType | undefined> {
    const {
      id, description, retries = 10, delayedFn, continueOnError, metadata
    } = args;

    if (this.map[id]) {
      this.log('info', {
        id, status: 'Skipping (previous back off process still running)', description, metadata
      });

      return Promise.reject(new Error('Skipping (previous back off process still running)')); // TODO: RC resolve?
    }

    this.map[id] = {
      try:     1,
      retries,
      description,
      metadata,
      recurse: { id: randomStr() }
    };

    for (let i = 0; i < retries; i++) {
      await this.canRecurse(this.map[id], args); // Check that we can start the process

      this.map[id].try = i + 1;

      const delay = this.calcDelay(i);
      const logLevel = calcLogLevel(i);

      this.log(logLevel, {
        id, status: `Delaying call (attempt ${ i + 1 }, delayed by ${ delay }ms)`, description, metadata
      });

      await this.sleep(delay);

      await this.canRecurse(this.map[id], args); // Check that we can call the function (things could have changed after delay...)

      this.log(logLevel, {
        id, status: `Executing call`, description, metadata
      });

      let res: ResponseType | undefined;

      try {
        res = await delayedFn();
      } catch (e) {
        const cont = await continueOnError(e);

        if (!cont) {
          // Error occurred. Don't clear the map. Next time this is called we'll back off before trying ...
          this.log('error', {
            id, status: 'Failed call', description, metadata
          }, e);

          this.reset(id); // Allow future calls to execute

          return Promise.reject(new Error('asdsad')); // TODO: RC
        }
      }

      if (res) {
        await this.canRecurse(this.map[id], args); // Check that we can return a result (things could have changed after delayedFn...)

        this.reset(id); // Allow future calls to execute

        this.log(logLevel, {
          id, status: 'Successful call', description, metadata
        });

        return res;
      }
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
   */
  async execute<MetadataType = any>({
    id, description, retries = 10, delayedFn, canFn = async() => true, metadata
  }: BackOffExecuteArgs<MetadataType>): Promise<NodeJS.Timeout | undefined> {
    const backOff: BackOffEntry = this.map[id];

    const cont = await canFn();

    if (!cont) {
      this.log('info', {
        id, status: 'Skipping (canExecute test failed)', description, metadata
      });

      return undefined;
    } else if (backOff?.execute?.timeoutId) {
      this.log('info', {
        id, status: 'Skipping (previous back off process still running)', description, metadata
      });

      return backOff?.execute?.timeoutId;
    } else {
      const backOffTry = backOff?.try || 0;

      if (backOffTry + 1 > retries) {
        this.log('error', {
          id, status: 'Aborting (too many retries)', description, metadata
        });

        return undefined;
      }

      const delay = this.calcDelay(backOffTry);
      const logLevel = calcLogLevel(backOffTry);

      this.log(logLevel, {
        id, status: `Delaying call (attempt ${ backOffTry + 1 }, delayed by ${ delay }ms)`, description, metadata
      });

      const timeout = setTimeout(async() => {
        try {
          this.log(logLevel, {
            id, status: `Executing call`, description, metadata
          });

          await delayedFn();
        } catch (e) {
          // Error occurred. Don't clear the map. Next time this is called we'll back off before trying ...
          this.log('error', {
            id, status: 'Failed call', description, metadata
          });
        }

        // Unblock future calls
        delete this.map[id]?.execute?.timeoutId;
      }, delay);

      this.map[id] = {
        execute: { timeoutId: timeout },
        try:     backOff?.try ? backOff.try + 1 : 1,
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
