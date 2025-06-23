import { DATE_FORMAT, TIME_FORMAT } from '@shell/store/prefs';
import { dateTimeFormat } from '@shell/utils/time';
import { type Store } from 'vuex';

describe('function: dateTimeFormat', () => {
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
    const date = new Date('2023-10-01T12:00:00Z');
    const formattedDate = dateTimeFormat(date.toISOString(), store);

    expect(formattedDate).toBe('Sun, Oct 1 2023 2:00:00 pm');
  });

  it('should return empty string for undefined value', () => {
    const formattedDate = dateTimeFormat(undefined, store);

    expect(formattedDate).toBe('');
  });
});
