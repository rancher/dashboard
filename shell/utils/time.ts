import day from 'dayjs';
import { escapeHtml } from '@shell/utils/string';
import { DATE_FORMAT, TIME_FORMAT } from '@shell/store/prefs';
import { type Store } from 'vuex';
import { ZERO_TIME } from '@shell/config/types';

export function isMissingDate(date: string | undefined | null): boolean {
  return !date || date === ZERO_TIME;
}

const FACTORS = [60, 60, 24];
const LABELS = ['sec', 'min', 'hour', 'day'];

// Diff two dates and return an object with values for presentation
// If 't' is also passed, 'string' property is set on the return object with the diff formatted as a string
// e.g. formats a date difference to return '1 day', '20 hours' etc
export function diffFrom(value: any, from: any, t: any) {
  const now = day();

  from = from || now;
  const diff = value.diff(from, 'seconds');

  let absDiff = Math.abs(diff);

  let next = 1;
  let label: any = '?';

  let i = 0;

  while ( absDiff >= FACTORS[i] && i < FACTORS.length ) {
    absDiff /= FACTORS[i];
    next *= Math.floor(FACTORS[i] / 10);
    i++;
  }

  if ( absDiff < 5 ) {
    label = Math.floor(absDiff * 10) / 10;
  } else {
    label = Math.floor(absDiff);
  }
  const ret: any = {
    diff,
    absDiff,
    label,
    // i18n-uses unit.day, unit.hour, unit.min, unit.sec
    unitsKey: `unit.${ LABELS[i] }`,
    units:    LABELS[i],
    next,
  };

  if (!!t) {
    ret.string = `${ ret.label } ${ t(ret.unitsKey, { count: ret.label }) }`;
  }

  return ret;
}

export function safeSetTimeout(timeout: any, callback: any, that: any) {
  if (timeout <= 2147483647) {
    // Max value setTimeout can take is max 32 bit int (about 24.9 days)
    return setTimeout(() => {
      callback.apply(that);
    }, timeout);
  }
}

export function getSecondsDiff(startDate: any, endDate: any) {
  return Math.round(
    Math.abs(Date.parse(endDate) - Date.parse(startDate)) / 1000
  );
}

/**
 * return { diff: number; label: string }
 *
 * diff:  update frequency in seconds
 * label: content of the cell's column
 */
export function elapsedTime(seconds: any) {
  if (!seconds) {
    return {};
  }

  if (seconds < 120) {
    return {
      diff:  1,
      label: `${ seconds }s`
    };
  }

  const minutes = Math.floor(seconds / 60);

  if (minutes < 10) {
    return {
      diff:  1,
      label: `${ minutes }m${ seconds - (minutes * 60) }s`
    };
  }

  const hours = Math.floor(seconds / 3600);

  if (hours < 3) {
    return {
      diff:  60,
      label: `${ minutes }m`,
    };
  }

  const days = Math.floor(seconds / (3600 * 24));

  if (days > 1) {
    return {
      diff:  60,
      label: `${ days }d${ hours - (days * 24) }h`,
    };
  }

  if (hours > 7) {
    return {
      diff:  60,
      label: `${ hours }h`,
    };
  }

  return {
    diff:  60,
    label: `${ hours }h${ minutes - (hours * 60) }m`,
  };
}

/**
   * Format date and time using user preferences
   * @param value Date string to format
   * @returns Formatted date string
   */
export const dateTimeFormat = (value: string | undefined, store: Store<any>): string => {
  if (!value) return '';

  const dateFormat = escapeHtml( store.getters['prefs/get'](DATE_FORMAT));
  const timeFormat = escapeHtml( store.getters['prefs/get'](TIME_FORMAT));

  const format = `${ dateFormat } ${ timeFormat }`;

  return day(value).format(format);
};

const DURATION_UNITS = [
  { divisor: 86400, suffix: 'd' },
  { divisor: 3600, suffix: 'h' },
  { divisor: 60, suffix: 'm' },
  { divisor: 1, suffix: 's' },
];

/**
 * Decomposes a total number of seconds into the largest whole time unit.
 * For example, 7200 returns { value: 2, unit: 3600 } (2 hours).
 * @param seconds - Total seconds to decompose
 * @returns An object with `value` (the count) and `unit` (the multiplier in seconds: 86400, 3600, 60, or 1)
 */
export function secondsToLargestUnit(seconds: number): { value: number, unit: number } {
  if (seconds % 86400 === 0) {
    return { value: seconds / 86400, unit: 86400 };
  }
  if (seconds % 3600 === 0) {
    return { value: seconds / 3600, unit: 3600 };
  }
  if (seconds % 60 === 0) {
    return { value: seconds / 60, unit: 60 };
  }

  return { value: seconds, unit: 1 };
}

/**
 * Formats a duration in seconds into a human-readable string (e.g. "1d 3h 46m 40s").
 * Zero-value components are omitted. Returns "0s" for non-positive values.
 * @param seconds - Duration in seconds
 */
export function formatDuration(seconds: number): string {
  if (seconds <= 0) {
    return '0s';
  }

  let remaining = seconds;

  return DURATION_UNITS
    .map(({ divisor, suffix }) => {
      const count = Math.floor(remaining / divisor);

      remaining %= divisor;

      return count > 0 ? `${ count }${ suffix }` : '';
    })
    .filter(Boolean)
    .join(' ');
}
