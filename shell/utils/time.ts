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
 * Converts seconds to the largest unit that applies evenly, otherwise keeps seconds
 * @param seconds
 * returns { units: string, value: number }
 */
export function secondsToLargestUnit(seconds: number) {
  for (const x of [
    { units: 'day', multiplier: 86400 },
    { units: 'hour', multiplier: 3600 },
    { units: 'min', multiplier: 60 },
  ]) {
    if (seconds % x.multiplier === 0) {
      return { units: x.units, value: seconds / x.multiplier };
    }
  }

  return { units: 'sec', value: seconds };
}

/**
 * Formats duration into days, hours, minutes and seconds components
 * @param seconds Date string to format
 * @returns Formatted duration string
 */
export function formatDuration(seconds: number): string {
  const d = Math.trunc(seconds / 86400);
  const h = Math.trunc((seconds % 86400) / 3600);
  const m = Math.trunc((seconds % 3600) / 60);
  const s = seconds % 60;

  return [
    { unit: 'd', value: d },
    { unit: 'h', value: h },
    { unit: 'm', value: m },
    { unit: 's', value: s },
  ].filter((e) => !!e.value)
    .map((e) => `${ e.value }${ e.unit }`).join(' ');
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
