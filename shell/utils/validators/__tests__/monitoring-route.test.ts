import { matching, interval } from '@shell/utils/validators/monitoring-route';

const mockGetters = {
  'i18n/t':      (key: string, args?: object) => (args ? `${ key }:${ JSON.stringify(args) }` : key),
  'i18n/exists': () => false,
};

describe('validators/monitoring-route', () => {
  describe('matching', () => {
    it('adds error when both match and match_re are empty', () => {
      const errors: string[] = [];

      matching({ match: {}, match_re: {} }, mockGetters, errors, []);

      expect(errors).toStrictEqual(['validation.monitoring.route.match']);
    });

    it('adds error when spec is empty object', () => {
      const errors: string[] = [];

      matching({}, mockGetters, errors, []);

      expect(errors).toStrictEqual(['validation.monitoring.route.match']);
    });

    it('adds error when spec is null or undefined', () => {
      const errors: string[] = [];

      matching(null, mockGetters, errors, []);

      expect(errors).toStrictEqual(['validation.monitoring.route.match']);
    });

    it('adds no error when match has entries', () => {
      const errors: string[] = [];

      matching({ match: { severity: 'critical' } }, mockGetters, errors, []);

      expect(errors).toStrictEqual([]);
    });

    it('adds no error when match_re has entries', () => {
      const errors: string[] = [];

      matching({ match_re: { alertname: '.*' } }, mockGetters, errors, []);

      expect(errors).toStrictEqual([]);
    });

    it('adds no error when both match and match_re have entries', () => {
      const errors: string[] = [];

      matching(
        { match: { severity: 'warning' }, match_re: { alertname: '.*' } },
        mockGetters,
        errors,
        []
      );

      expect(errors).toStrictEqual([]);
    });
  });

  describe('interval', () => {
    it.each([
      {
        desc:  'seconds unit',
        value: '30s',
      },
      {
        desc:  'minutes unit',
        value: '5m',
      },
      {
        desc:  'hours unit',
        value: '2h',
      },
      {
        desc:  'multi-digit seconds',
        value: '120s',
      },
    ])('adds no error for valid interval: $desc', ({ value }) => {
      const errors: string[] = [];

      interval(value, mockGetters, errors, [], 'Interval');

      expect(errors).toStrictEqual([]);
    });

    it.each([
      {
        desc:  'no unit',
        value: '30',
      },
      {
        desc:  'unknown unit',
        value: '5d',
      },
      {
        desc:  'empty string',
        value: '',
      },
      {
        desc:  'fractional value',
        value: '1.5s',
      },
      {
        desc:  'letters only',
        value: 'abc',
      },
    ])('adds error for invalid interval: $desc', ({ value }) => {
      const errors: string[] = [];

      interval(value, mockGetters, errors, [], 'Interval');

      expect(errors).toStrictEqual(['validation.monitoring.route.interval:{"key":"Interval"}']);
    });
  });
});
