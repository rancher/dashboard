import { SemVer } from 'semver';

export type Logger = {
  error: Function,
  info: Function,
  debug: Function,
};

export type Distribution = 'community' | 'prime';

export type Configuration = {
  enabled: boolean;
  debug: boolean;
  log: boolean;
  endpoint: string;
  prime: boolean;
  distribution: Distribution;
};

/**
 * Common context passed through various functions
 */
export type Context = {
  dispatch: Function,
  getters: any,
  axios: any,
  logger: Logger,
  isAdmin: boolean,
  config: Configuration,
};

export type VersionInfo = {
  version: SemVer;
  isPrime: boolean;
};

export type ReleaseInfo = any;
export type SupportInfo = any;

export type UpcomingSupportInfo = {
  version: string,
  date: Date,
  noticeDays?: number,
};

export type SettingsInfo = {
  status: {
    eom: string,
    eol: string,
  },
  upcoming: {
    eom: UpcomingSupportInfo,
    eol: UpcomingSupportInfo,
  }
};

export type DynamicContent = {
  version: string;
  releases: ReleaseInfo,
  support: SupportInfo,
  settings: SettingsInfo,
};
