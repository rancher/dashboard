import day from 'dayjs';
import { DATE_FORMAT, TIME_FORMAT } from '@shell/store/prefs';
import {
  dateTimeFormat, diffFrom, elapsedTime, getSecondsDiff, isMissingDate, safeSetTimeout
} from '@shell/utils/time';
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

describe('function: elapsedTime', () => {
  it.each([
    {
      desc:     'returns empty object for 0',
      seconds:  0,
      expected: {},
    },
    {
      desc:     'returns empty object for null',
      seconds:  null,
      expected: {},
    },
    {
      desc:     'returns empty object for undefined',
      seconds:  undefined,
      expected: {},
    },
    {
      desc:     'returns seconds label for 1 second',
      seconds:  1,
      expected: { diff: 1, label: '1s' },
    },
    {
      desc:     'returns seconds label for 60 seconds',
      seconds:  60,
      expected: { diff: 1, label: '60s' },
    },
    {
      desc:     'returns seconds label for 119 seconds (upper bound)',
      seconds:  119,
      expected: { diff: 1, label: '119s' },
    },
    {
      desc:     'returns minutes+seconds label for 120 seconds',
      seconds:  120,
      expected: { diff: 1, label: '2m0s' },
    },
    {
      desc:     'returns minutes+seconds label for 599 seconds',
      seconds:  599,
      expected: { diff: 1, label: '9m59s' },
    },
    {
      desc:     'returns minutes-only label for 600 seconds',
      seconds:  600,
      expected: { diff: 60, label: '10m' },
    },
    {
      desc:     'returns minutes-only label for 10799 seconds (under 3 hours)',
      seconds:  10799,
      expected: { diff: 60, label: '179m' },
    },
    {
      desc:     'returns hours+minutes label for 10800 seconds (3 hours)',
      seconds:  10800,
      expected: { diff: 60, label: '3h0m' },
    },
    {
      desc:     'returns hours+minutes label for 25200 seconds (7 hours)',
      seconds:  25200,
      expected: { diff: 60, label: '7h0m' },
    },
    {
      desc:     'returns hours-only label for 28800 seconds (8 hours)',
      seconds:  28800,
      expected: { diff: 60, label: '8h' },
    },
    {
      desc:     'returns hours-only label for 86400 seconds (1 day as hours)',
      seconds:  86400,
      expected: { diff: 60, label: '24h' },
    },
    {
      desc:     'returns days+hours label for 172800 seconds (2 days)',
      seconds:  172800,
      expected: { diff: 60, label: '2d0h' },
    },
    {
      desc:     'returns days+hours label for 176400 seconds (2 days 1 hour)',
      seconds:  176400,
      expected: { diff: 60, label: '2d1h' },
    },
  ])('$desc', ({ seconds, expected }) => {
    expect(elapsedTime(seconds)).toStrictEqual(expected);
  });
});

describe('function: safeSetTimeout', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it('invokes the callback after the given delay', () => {
    const callback = jest.fn();

    safeSetTimeout(100, callback, null);
    jest.runAllTimers();

    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('invokes the callback with the provided context object', () => {
    let capturedContext: unknown;

    function cb(this: unknown) {
      capturedContext = this;
    }
    const ctx = { id: 'ctx' };

    safeSetTimeout(100, cb, ctx);
    jest.runAllTimers();

    expect(capturedContext).toStrictEqual(ctx);
  });

  it('does not schedule a timeout when delay exceeds 32-bit maximum', () => {
    const callback = jest.fn();
    const result = safeSetTimeout(2147483648, callback, null);

    jest.runAllTimers();

    expect(result).toBeUndefined();
    expect(callback).not.toHaveBeenCalled();
  });

  it('schedules a timeout for delay equal to 32-bit maximum', () => {
    const callback = jest.fn();

    safeSetTimeout(2147483647, callback, null);
    jest.runAllTimers();

    expect(callback).toHaveBeenCalledTimes(1);
  });
});

describe('function: getSecondsDiff', () => {
  it.each([
    {
      desc:      'returns 0 for identical date strings',
      startDate: '2024-01-01T00:00:00Z',
      endDate:   '2024-01-01T00:00:00Z',
      expected:  0,
    },
    {
      desc:      'returns 60 for dates one minute apart',
      startDate: '2024-01-01T00:00:00Z',
      endDate:   '2024-01-01T00:01:00Z',
      expected:  60,
    },
    {
      desc:      'returns 3600 for dates one hour apart',
      startDate: '2024-01-01T00:00:00Z',
      endDate:   '2024-01-01T01:00:00Z',
      expected:  3600,
    },
    {
      desc:      'returns absolute difference when end is before start',
      startDate: '2024-01-01T01:00:00Z',
      endDate:   '2024-01-01T00:00:00Z',
      expected:  3600,
    },
    {
      desc:      'returns 86400 for dates one day apart',
      startDate: '2024-01-01T00:00:00Z',
      endDate:   '2024-01-02T00:00:00Z',
      expected:  86400,
    },
  ])('$desc', ({ startDate, endDate, expected }) => {
    expect(getSecondsDiff(startDate, endDate)).toStrictEqual(expected);
  });
});

describe('function: diffFrom', () => {
  const from = day('2024-01-01T12:00:00Z');

  it.each([
    {
      desc:     '30 seconds reports seconds unit',
      value:    from.subtract(30, 'second'),
      expected: {
        diff:     -30,
        absDiff:  30,
        label:    30,
        unitsKey: 'unit.sec',
        units:    'sec',
        next:     1,
      },
    },
    {
      desc:     '120 seconds reports minutes unit with small label',
      value:    from.subtract(120, 'second'),
      expected: {
        diff:     -120,
        absDiff:  2,
        label:    2,
        unitsKey: 'unit.min',
        units:    'min',
        next:     6,
      },
    },
    {
      desc:     '600 seconds reports minutes unit with integer label',
      value:    from.subtract(600, 'second'),
      expected: {
        diff:     -600,
        absDiff:  10,
        label:    10,
        unitsKey: 'unit.min',
        units:    'min',
        next:     6,
      },
    },
    {
      desc:     '5400 seconds reports hours unit with fractional label',
      value:    from.subtract(5400, 'second'),
      expected: {
        diff:     -5400,
        absDiff:  1.5,
        label:    1.5,
        unitsKey: 'unit.hour',
        units:    'hour',
        next:     36,
      },
    },
    {
      desc:     '172800 seconds reports days unit',
      value:    from.subtract(172800, 'second'),
      expected: {
        diff:     -172800,
        absDiff:  2,
        label:    2,
        unitsKey: 'unit.day',
        units:    'day',
        next:     72,
      },
    },
  ])('$desc', ({ value, expected }) => {
    expect(diffFrom(value, from, null)).toStrictEqual(expected);
  });

  it('includes string property when t function is provided', () => {
    const value = from.subtract(30, 'second');
    const t = (key: string, args: unknown) => `${ key }:${ JSON.stringify(args) }`;
    const result = diffFrom(value, from, t);

    expect(result.string).toStrictEqual(`30 unit.sec:${ JSON.stringify({ count: 30 }) }`);
  });

  it('omits string property when t function is not provided', () => {
    const value = from.subtract(30, 'second');
    const result = diffFrom(value, from, null);

    expect(result).not.toHaveProperty('string');
  });
});
