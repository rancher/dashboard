import { DATE_FORMAT, TIME_FORMAT } from '@shell/store/prefs';
import { dateTimeFormat } from '@shell/utils/time';
import { type Store } from 'vuex';

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
