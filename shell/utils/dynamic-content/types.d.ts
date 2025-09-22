/**
 * Shared types for Dynamic Content
 */

import { SemVer } from 'semver';

/**
 * Loger interface
 */
export interface Logger {
  error: Function,
  info: Function,
  debug: Function,
}

/**
 * Distribution type
 */
export type Distribution = 'community' | 'prime';

/**
 * Dynamic Content configuration
 */
export type Configuration = {
  enabled: boolean;
  debug: boolean;
  log: boolean;
  endpoint: string;
  prime: boolean;
  distribution: Distribution;
};

/**
 * Settings configuration that can be supplied in the dynamic content package
 */
export type SettingsInfo = {
  releaseNotesUrl: string; // URL format to use when generating release note links for new releases
  suseExtensions: string[]; // Names of extra SUSE UI extensions on top of the list built-in
  debugVersion?: string;
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
  settings: SettingsInfo,
};

/**
 * Version information
 */
export type VersionInfo = {
  version: SemVer | null;
  isPrime: boolean;
};

/**
 * Information for a new release
 */
export type ReleaseInfo = {
  name: string;
};

/**
 * Information for an upcoming release
 */
export type UpcomingSupportInfo = {
  version: string, // Version number: semver (e.g. '<= 2.12')
  date: Date, // Date when the eom/eol takes place
  noticeDays?: number, // Number of days in advance to notify the user (if not specified, the default is used)
};

/**
 * Support information covering current EOM/EOL and upcoming EOM/EOL information
 */
export type SupportInfo = {
  status: {
    eom: string,
    eol: string,
  },
  upcoming: {
    eom: UpcomingSupportInfo,
    eol: UpcomingSupportInfo,
  }
};

/**
 * Main type for the metadata that is retrieved from the dynamic content endpoint
 */
export type DynamicContent = {
  version: string;
  releases: ReleaseInfo[],
  support: SupportInfo,
  settings?: Partial<SettingsInfo>,
};
