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

const metadataToString = (metadata: any) => {
  if (!metadata) {
    return '';
  }

  return JSON.stringify(metadata, (_, value) => {
    return value === undefined ? '' : value;
  });
};

export type BackOffExecuteArgs<MetadataType> = BackOffArgs<MetadataType>

export interface BackOffRecurseArgs<MetadataType> extends BackOffArgs<MetadataType> {
  /**
   * Should we continue to to try even if the previous attempt failed?
   */
  continueOnError: (arg: any) => Promise<boolean>,
}

const logStyle = 'font-weight: bold; font-style: italic;';
const logStyleReset = 'font-weight: normal; font-style: normal;';

enum LOG_TYPE { // eslint-disable-line no-unused-vars
  /** Aligns with `execute` method */
  EXECUTE = 'delay', // eslint-disable-line no-unused-vars
  /** Aligns with `recurse` method */
  RECURSE = 'recurse', // eslint-disable-line no-unused-vars
}
type LogLevel = 'error' | 'info' | 'debug' | 'warn' | undefined;
type LogArgs = { id: string, status: string, description: string, metadata?: any, type: string }

const logInitialBackOffRequest = false;
const calcLogLevel = (iteration: number): LogLevel => {
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

  private getLogTypeFromMap(id: string): string {
    const entry = this.getBackOff(id);

    let safeType = '';

    if (!!entry?.execute) {
      safeType = LOG_TYPE.EXECUTE;
    } else if (!!entry?.recurse) {
      safeType = LOG_TYPE.RECURSE;
    }

    return safeType;
  }

  private log(level: LogLevel, {
    id, status, description, metadata, type
  }: LogArgs, ...args: any[]) {
    if (!level) {
      return;
    }

    let safeType = type || this.getLogTypeFromMap(id);

    safeType = safeType ? ` (${ safeType })` : '';

    // eslint-disable-next-line no-console
    console[level](
      `%cBackOff${ safeType }%c... \n%cId%c:          ${ id }\n%cDescription%c: ${ description }\n%cStatus%c:      ${ status }\n%cMetadata%c:    ${ metadataToString(metadata) }\n%cCache %c:       ${ Object.keys(this.map).map((e) => `"${ e }"`).join(' + ') }`,
      logStyle, logStyleReset,
      logStyle, logStyleReset,
      logStyle, logStyleReset,
      logStyle, logStyleReset,
      logStyle, logStyleReset,
      logStyle, logStyleReset,
      ...args
    );
  }

  private logAndError(level: LogLevel, {
    id, status, description, metadata, type
  }: LogArgs, ...args: any[]): Promise<undefined> {
    this.log(level, {
      id, status, description, metadata, type
    }, ...args);

    return Promise.reject(new Error(status));
  }

  /**
   * Get a specific back off process
   */
  public getBackOff(id: string): BackOffEntry {
    return this.map[id];
  }

  /**
   * Stop ALL back off processes started since the ui was loaded
   */
  public resetAll() {
    Object.keys(this.map).forEach((id) => {
      this.reset(id);
    });
  }

  /**
   * Stop all back off process with a specific prefix
   */
  public resetPrefix(prefix:string) {
    Object.keys(this.map).forEach((id) => {
      if (id.startsWith(prefix)) {
        this.reset(id);
      }
    });
  }

  /**
   * Stop a back off process with a specific id
   */
  public reset(id: string) {
    const backOff: BackOffEntry = this.map[id];

    if (!backOff) {
      return;
    }

    const logType = this.getLogTypeFromMap(id);

    if (backOff?.execute?.timeoutId) {
      this.log('info', {
        id, status: 'Stopping (cancelling active back-off)', description: backOff.description, metadata: backOff.metadata, type: logType
      });

      clearTimeout(backOff.execute.timeoutId);
    }
    const backOffTry = backOff?.try || 0;
    const logLevel = backOffTry <= 1 ? undefined : 'debug';

    delete this.map[id];

    this.log(logLevel, {
      id, status: 'Reset', description: backOff.description, metadata: backOff.metadata, type: logType
    });
  }

  private sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  private calcDelay = (iteration: number) => {
    // First step is immediate (0.001s)
    // Second and others are exponential
    // Iteration: 1,     2,   3,     4,    5,      6,    7,       8,    9
    // Delay:     0.25s, 1s,  2.25s, 4s,   6.25s,  9s,   12.25s,  16s,  20.25s
    return iteration === 0 ? 1 : Math.pow(iteration, 2) * 250;
  }

  private canRecurse = async(backOffEntry: BackOffEntry, {
    id, description, metadata, canFn = async() => true
  }: BackOffRecurseArgs<any>) => {
    if (!this.map[id]) {
      // was reset, don't care now, abort
      // could be a pagination-wrapper request with a stale revision, which can be safely ignored
      return this.logAndError('info', {
        id, status: 'Aborting (backoff was reset, do not continue to process)', description, metadata, type: LOG_TYPE.RECURSE
      });
    }

    if (this.map[id].recurse?.id !== backOffEntry.recurse?.id) {
      return this.logAndError('info', {
        id, status: 'Aborting (stale backoff, a new one exists)', description, metadata, type: LOG_TYPE.RECURSE
      });
    }

    const cont = await canFn();

    if (!cont) {
      return this.logAndError('info', {
        id, status: 'Skipping (canFn test failed)', description, metadata, type: LOG_TYPE.RECURSE
      });
    }
  };

  /**
   * Call a function, if it fails keep trying but with a delay (aka back off)
   *
   * Return the successful result, or error if reached the max number of retries
   *
   * @template MetadataType - Type of configuration that can be internally stored with the backoff record
   */
  public async recurse<MetadataType = any, ResponseType = any>(args: BackOffRecurseArgs<MetadataType>): Promise<ResponseType | undefined> {
    const {
      id, description, retries = 10, delayedFn, continueOnError, metadata
    } = args;

    if (this.map[id]) {
      return this.logAndError('info', {
        id, status: 'Skipping (previous recurse back off process still running)', description, metadata, type: 'recurse',
      });
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
        id, status: `Delaying call (attempt ${ i + 1 }, delayed by ${ delay }ms)`, description, metadata, type: LOG_TYPE.RECURSE
      });

      await this.sleep(delay);

      await this.canRecurse(this.map[id], args); // Check that we can call the function (things could have changed after delay...)

      this.log(logLevel, {
        id, status: `Executing call`, description, metadata, type: LOG_TYPE.RECURSE
      });

      let res: ResponseType | undefined;

      try {
        res = await delayedFn();
      } catch (e) {
        const cont = await continueOnError(e);

        if (!cont) {
          this.reset(id); // Allow future calls to execute

          const errorMessage = 'Failed call';

          return this.logAndError('error', {
            id, status: errorMessage, description, metadata, type: LOG_TYPE.RECURSE
          }, e);
        }
      }

      if (res) {
        await this.canRecurse(this.map[id], args); // Check that we can return a result (things could have changed after delayedFn...)

        this.reset(id); // Allow future calls to execute

        this.log(logLevel, {
          id, status: 'Successful call', description, metadata, type: LOG_TYPE.RECURSE
        });

        return res;
      }
    }
  }

  /**
   * Call a function, but if it's recently been called delay execution (aka back off)
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
   * @template MetadataType - Type of configuration that can be internally stored with the backoff record
   */
  public async execute<MetadataType = any>({
    id, description, retries = 10, delayedFn, canFn = async() => true, metadata
  }: BackOffExecuteArgs<MetadataType>): Promise<NodeJS.Timeout | undefined> {
    const backOff: BackOffEntry = this.map[id];

    const cont = await canFn();

    if (!cont) {
      this.log('info', {
        id, status: 'Skipping (canExecute test failed)', description, metadata, type: LOG_TYPE.EXECUTE
      });

      return undefined;
    } else if (backOff?.execute?.timeoutId) {
      this.log('info', {
        id, status: 'Skipping (previous back off process still running)', description, metadata, type: LOG_TYPE.EXECUTE
      });

      return backOff?.execute?.timeoutId;
    } else {
      const backOffTry = backOff?.try || 0;

      if (backOffTry + 1 > retries) {
        this.log('error', {
          id, status: 'Aborting (too many retries)', description, metadata, type: LOG_TYPE.EXECUTE
        });

        return undefined;
      }

      const delay = this.calcDelay(backOffTry);
      const logLevel = calcLogLevel(backOffTry);

      this.log(logLevel, {
        id, status: `Delaying call (attempt ${ backOffTry + 1 }, delayed by ${ delay }ms)`, description, metadata, type: LOG_TYPE.EXECUTE
      });

      const timeout = setTimeout(async() => {
        try {
          this.log(logLevel, {
            id, status: `Executing call`, description, metadata, type: LOG_TYPE.EXECUTE
          });

          await delayedFn();
        } catch (e) {
          // Error occurred. Don't clear the map. Next time this is called we'll back off before trying ...
          this.log('error', {
            id, status: 'Failed call', description, metadata, type: LOG_TYPE.EXECUTE
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
