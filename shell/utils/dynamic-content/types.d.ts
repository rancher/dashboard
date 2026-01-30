/**
 * Shared types for Dynamic Content
 */

import { SemVer } from 'semver';

/**
 * Logger interface for dynamic content
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
  version: SemVer;
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
  date: Date, // Date when the eom/eol takes place (note, only the day part is used, time is ignored)
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
 * Call to action for an announcement
 */
export type CallToAction = {
  action: string;
  link: string;
};

/**
 * Announcements to be shown in the notification center or on the home page
 *
 * Target determines where the notification will be shown, supported values:
 *
 * - `notification/announcement` - Shown with `Announcement` level in the Notification Center
 * - `notification/info` - Shown with `Info` level in the Notification Center
 * - `notification/warning` - Shown with `Warning` level in the Notification Center
 * - `homepage/banner` - Shown on the home page as a banner beneath the main banner
 * - `homepage/rhs` - Shown on the home page as a panel beneath the right-hand side links panel
 *
 */
export type Announcement = {
  id: string; // Unique id for this announcement
  title: string; // Title to be shown
  message: string; // Message/Body for the announcement
  target: string; // Where the announcement should be shown
  version?: string; // Version or semver expression for when to show this announcement
  audience?: 'admin' | 'all'; // Audience - show for just Admins or for all users
  icon?: string;
  cta?: {
    primary: CallToAction, // Must have a primary call to action, if we have a cta field
    secondary?: CallToAction,
  },
  style?: string; // Styling information that will be interpreted by the rendering component
};

/**
 * Icon information
 */
export type AnnouncementNotificationIconData = {
  light: string; // Light mode icon/image
  dark?: string; // Light mode icon/image
};

/**
 * Custom data for announcements stored with the notification
 */
export type AnnouncementNotificationData = {
  icon?: AnnouncementNotificationIconData; // Icon/Image to show
  location: string; // Location of the announcement in the UI
};

/**
 * Main type for the metadata that is retrieved from the dynamic content endpoint
 */
export type DynamicContent = {
  version: string;
  releases: ReleaseInfo[],
  support: SupportInfo,
  announcements: Announcement[],
  settings?: Partial<SettingsInfo>,
};
