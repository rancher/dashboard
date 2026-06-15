import { logdna } from '@shell/utils/validators/logging-outputs';

const mockGetters = {
  'i18n/t':      (key: string, args?: object) => (args ? `${ key }:${ JSON.stringify(args) }` : key),
  'i18n/exists': () => false,
};

describe('validators/logging-outputs', () => {
  describe('logdna', () => {
    it('adds no error when value is empty object', () => {
      const errors: string[] = [];

      logdna({}, mockGetters, errors, []);

      expect(errors).toStrictEqual([]);
    });

    it('adds no error when value is null', () => {
      const errors: string[] = [];

      logdna(null, mockGetters, errors, []);

      expect(errors).toStrictEqual([]);
    });

    it('adds no error when value is undefined', () => {
      const errors: string[] = [];

      logdna(undefined, mockGetters, errors, []);

      expect(errors).toStrictEqual([]);
    });

    it('adds no error when api_key is present', () => {
      const errors: string[] = [];

      logdna({ api_key: 'my-secret-key' }, mockGetters, errors, []);

      expect(errors).toStrictEqual([]);
    });

    it('adds apiKey error when api_key is missing', () => {
      const errors: string[] = [];

      logdna({ host: 'logs.example.com' }, mockGetters, errors, []);

      expect(errors).toStrictEqual(['validation.output.logdna.apiKey']);
    });

    it('adds apiKey error when api_key is empty string', () => {
      const errors: string[] = [];

      logdna({ api_key: '' }, mockGetters, errors, []);

      expect(errors).toStrictEqual(['validation.output.logdna.apiKey']);
    });
  });
});
