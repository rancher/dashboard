import { DATE_FORMAT, TIME_FORMAT } from '@shell/store/prefs';
import { dateTimeFormat, isMissingDate, secondsToLargestUnit, formatDuration } from '@shell/utils/time';
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

describe('function: secondsToLargestUnit', () => {
  it.each([
    [86400, { value: 1, unit: 86400 }],
    [172800, { value: 2, unit: 86400 }],
    [3600, { value: 1, unit: 3600 }],
    [7200, { value: 2, unit: 3600 }],
    [120, { value: 2, unit: 60 }],
    [300, { value: 5, unit: 60 }],
    [45, { value: 45, unit: 1 }],
    [90, { value: 90, unit: 1 }],
    [1, { value: 1, unit: 1 }],
  ])('given %p seconds, returns %p', (seconds, expected) => {
    expect(secondsToLargestUnit(seconds)).toStrictEqual(expected);
  });
});

describe('function: formatDuration', () => {
  it.each([
    [0, '0s'],
    [-1, '0s'],
    [1, '1s'],
    [60, '1m'],
    [61, '1m 1s'],
    [3600, '1h'],
    [3661, '1h 1m 1s'],
    [86400, '1d'],
    [90061, '1d 1h 1m 1s'],
    [100000, '1d 3h 46m 40s'],
  ])('given %p seconds, returns %p', (seconds, expected) => {
    expect(formatDuration(seconds)).toStrictEqual(expected);
  });
});
