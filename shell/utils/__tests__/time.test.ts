import { DATE_FORMAT, TIME_FORMAT } from '@shell/store/prefs';
import { dateTimeFormat, isMissingDate, formatDuration, secondsToLargestUnit } from '@shell/utils/time';
import { type Store } from 'vuex';
import { ZERO_TIME } from '@shell/config/types';

describe('function: isMissingDate', () => {
  it.each([
    [undefined, true],
    [null, true],
    ['', true],
    [ZERO_TIME, true],
    ['2010-10-21T04:29:00Z', false],
  ])('given %p, returns %p', (date, expected) => {
    expect(isMissingDate(date)).toBe(expected);
  });
});

describe('function: dateTimeFormat', () => {
  jest.useFakeTimers()
    .setSystemTime(new Date('21-10-2010 4:29:00'));
  const store = {
    getters: {
      'prefs/get': (key: string) => {
        return {
          [DATE_FORMAT]: 'ddd, MMM D YYYY',
          [TIME_FORMAT]: 'h:mm:ss a',
        }[key];
      },
    },
  } as Store<any>;

  it('should format date and time correctly', () => {
    const date = new Date('2010-10-21T04:29:00Z');
    const formattedDate = dateTimeFormat(date.toISOString(), store);

    expect(formattedDate).toBe('Thu, Oct 21 2010 4:29:00 am');
  });

  it('should return empty string for undefined value', () => {
    const formattedDate = dateTimeFormat(undefined, store);

    expect(formattedDate).toBe('');
  });
});

describe('function: formatDuration', () => {
  it('should format durations correctly', () => {
    expect(formatDuration(30)).toBe('30s');
    expect(formatDuration(126)).toBe('2m 6s');
    expect(formatDuration(3610)).toBe('1h 10s');
    expect(formatDuration(86520)).toBe('1d 2m');
    expect(formatDuration(100000)).toBe('1d 3h 46m 40s');
  });
});

describe('function: secondsToLargestUnit', () => {
  it.each([
    [1, { units: 'sec', value: 1 }],
    [59, { units: 'sec', value: 59 }],
    [60, { units: 'min', value: 1 }],
    [61, { units: 'sec', value: 61 }],
    [3600, { units: 'hour', value: 1 }],
    [3660, { units: 'min', value: 61 }],
    [3661, { units: 'sec', value: 3661 }],
    [86400, { units: 'day', value: 1 }],
    [90000, { units: 'hour', value: 25 }],
  ])('given %p seconds, returns %p', (seconds, expected) => {
    expect(secondsToLargestUnit(seconds)).toStrictEqual(expected);
  });

  it('prefers the largest unit when multiple are evenly divisible', () => {
    // 172800 divisible by day/hour/min: should choose day
    expect(secondsToLargestUnit(172800)).toStrictEqual({ units: 'day', value: 2 });
  });

  it('handles 0 seconds', () => {
    expect(secondsToLargestUnit(0)).toStrictEqual({ units: 'sec', value: 0 });
  });
});
