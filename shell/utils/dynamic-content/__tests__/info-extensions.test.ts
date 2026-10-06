import { SystemInfoProvider } from '../info';
import { MANAGEMENT, COUNT } from '@shell/config/types';
import { SETTING } from '@shell/config/settings';
import * as version from '@shell/config/version';

jest.mock('@shell/config/version', () => ({ getVersionData: jest.fn(), isRancherPrime: jest.fn() }));

jest.mock('@shell/utils/crypto', () => ({ sha256: jest.fn((val: string) => `hashed_${ val }`) }));

/**
 * Create a mock extension that has registered the given telemetry functions
 */
const ext = (name: string, telemetry?: { [name: string]: any }, builtin = false) => ({
  name,
  builtin,
  types: telemetry ? { telemetry } : {},
});

/**
 * Parse a query string into a list of [key, value] pairs (decoded)
 */
const parse = (qs: string): [string, string][] => qs.split('&').map((p) => {
  const [k, v] = p.split('=');

  return [decodeURIComponent(k), decodeURIComponent(v)];
});

/**
 * Get all values for a given param from the query string
 */
const valuesOf = (qs: string, key: string): string[] => parse(qs).filter(([k]) => k === key).map(([, v]) => v);

describe('systemInfoProvider telemetry', () => {
  let mockGetters: any;
  let mockPlugins: any[];

  beforeEach(() => {
    Object.defineProperty(window, 'screen', { value: { width: 1920, height: 1080 }, writable: true });
    Object.defineProperty(window, 'innerWidth', { value: 1024, writable: true });
    Object.defineProperty(window, 'innerHeight', { value: 768, writable: true });

    const mockSettings = [
      { id: SETTING.SERVER_URL, value: 'https://rancher.test' },
      { id: 'install-uuid', value: 'test-uuid' },
    ];

    mockPlugins = [];

    mockGetters = {
      'management/typeRegistered': jest.fn().mockReturnValue(true),
      'management/all':            jest.fn((type: string) => {
        if (type === COUNT) {
          return [{ counts: { [MANAGEMENT.CLUSTER]: { summary: { count: 2 } } } }];
        }

        return [];
      }),
      'management/byId':  jest.fn((type: string, id: string) => mockSettings.find((s) => s.id === id) || null),
      'auth/principalId': 'user-123',
      'features/get':     jest.fn(),
      localCluster:       null,
      get 'uiplugins/plugins'() {
        return mockPlugins;
      },
    };

    (version.getVersionData as jest.Mock).mockReturnValue({ Version: '2.13.0', RancherPrime: 'false' });
  });

  describe('collecting telemetry', () => {
    it('should include telemetry from a known SUSE extension', () => {
      mockPlugins = [ext('harvester', { harvester: () => ({ hv: 'yes' }) })];

      const qs = new SystemInfoProvider(mockGetters, {}).buildQueryString();

      expect(valuesOf(qs, 'hv')).toStrictEqual(['yes']);
    });

    it('should include telemetry from a built-in extension', () => {
      mockPlugins = [ext('rancher-prime', { prime: () => ({ rp: 'a' }) }, true)];

      const qs = new SystemInfoProvider(mockGetters, {}).buildQueryString();

      expect(valuesOf(qs, 'rp')).toStrictEqual(['a']);
    });

    it('should include telemetry from an extension listed in the dynamic content settings', () => {
      mockPlugins = [ext('new-suse-ext', { t: () => ({ nse: 1 }) })];

      const qs = new SystemInfoProvider(mockGetters, { suseExtensions: ['new-suse-ext'] }).buildQueryString();

      expect(valuesOf(qs, 'nse')).toStrictEqual(['1']);
    });

    it('should ignore telemetry from a non-SUSE extension', () => {
      const fn = jest.fn(() => ({ custom: 'value' }));

      mockPlugins = [ext('some-custom-ext', { t: fn })];

      const qs = new SystemInfoProvider(mockGetters, {}).buildQueryString();

      expect(valuesOf(qs, 'custom')).toStrictEqual([]);
      expect(fn).not.toHaveBeenCalled();
    });

    it('should pass the store getters to the telemetry function', () => {
      const fn = jest.fn(() => ({}));

      mockPlugins = [ext('harvester', { t: fn })];

      new SystemInfoProvider(mockGetters, {}); // eslint-disable-line no-new

      expect(fn).toHaveBeenCalledWith(mockGetters);
    });

    it('should collect telemetry from multiple functions and extensions', () => {
      mockPlugins = [
        ext('harvester', { a: () => ({ ta: 'a' }), b: () => ({ tb: 'b' }) }),
        ext('elemental', { c: () => ({ tc: 'c' }) }),
      ];

      const qs = new SystemInfoProvider(mockGetters, {}).buildQueryString();

      expect([valuesOf(qs, 'ta'), valuesOf(qs, 'tb'), valuesOf(qs, 'tc')]).toStrictEqual([['a'], ['b'], ['c']]);
    });

    it('should use the first value when two extensions provide the same param', () => {
      mockPlugins = [
        ext('harvester', { t: () => ({ dup: 'first' }) }),
        ext('elemental', { t: () => ({ dup: 'second' }) }),
      ];

      const qs = new SystemInfoProvider(mockGetters, {}).buildQueryString();

      expect(valuesOf(qs, 'dup')).toStrictEqual(['first']);
    });

    it('should ignore a telemetry function that throws and still collect others', () => {
      const debug = jest.spyOn(console, 'debug').mockImplementation(() => {});

      mockPlugins = [ext('harvester', {
        bad: () => {
          throw new Error('boom');
        },
        good: () => ({ ok: 'yes' })
      })];

      const qs = new SystemInfoProvider(mockGetters, {}).buildQueryString();

      expect(valuesOf(qs, 'ok')).toStrictEqual(['yes']);
      expect(debug).toHaveBeenCalledWith(expect.stringContaining('"bad"'), expect.any(Error));

      debug.mockRestore();
    });

    it.each([
      ['undefined', undefined],
      ['null', null],
      ['a string', 'x=1'],
      ['a number', 42],
    ])('should ignore a telemetry function that returns %s', (_, result) => {
      mockPlugins = [ext('harvester', { t: () => result })];

      const qs = new SystemInfoProvider(mockGetters, {}).buildQueryString();
      const baseline = (() => {
        mockPlugins = [ext('harvester')];

        return new SystemInfoProvider(mockGetters, {}).buildQueryString();
      })();

      expect(qs).toStrictEqual(baseline);
    });

    it('should ignore a registered value that is not a function', () => {
      mockPlugins = [ext('harvester', { t: 'not-a-function' })];

      const qs = new SystemInfoProvider(mockGetters, {}).buildQueryString();

      expect(qs).not.toContain('not-a-function');
    });

    it.each([
      ['object', { a: 1 }],
      ['array', [1, 2]],
      ['function', () => 1],
      ['null', null],
      ['undefined', undefined],
    ])('should drop a param whose value is of type %s', (_, value) => {
      mockPlugins = [ext('harvester', { t: () => ({ bad: value, good: 'yes' }) })];

      const qs = new SystemInfoProvider(mockGetters, {}).buildQueryString();

      expect([valuesOf(qs, 'bad'), valuesOf(qs, 'good')]).toStrictEqual([[], ['yes']]);
    });

    it.each([
      ['string', 'abc', 'abc'],
      ['number', 123, '123'],
      ['zero', 0, '0'],
      ['boolean true', true, 'true'],
      ['boolean false', false, 'false'],
      ['empty string', '', ''],
    ])('should include a %s value', (_, value, expected) => {
      mockPlugins = [ext('harvester', { t: () => ({ val: value }) })];

      const qs = new SystemInfoProvider(mockGetters, {}).buildQueryString();

      expect(valuesOf(qs, 'val')).toStrictEqual([expected]);
    });

    it('should handle no extensions being loaded', () => {
      mockPlugins = undefined as any;

      const qs = new SystemInfoProvider(mockGetters, {}).buildQueryString();

      expect(qs).toContain('dcv=v1');
    });
  });

  describe('building the query string', () => {
    it.each([
      ['dcv', 'v1'],
      ['s', 'hashed_https://rancher.test'],
      ['u', 'hashed_user-123'],
      ['uuid', 'test-uuid'],
      ['v', '2.13.0'],
      ['p', 'false'],
      ['cc', '2'],
      ['bl', window.navigator.language],
    ])('should not allow an extension to overwrite the existing "%s" param', (param, expected) => {
      mockPlugins = [ext('harvester', { t: () => ({ [param]: 'overwritten' }) })];

      const qs = new SystemInfoProvider(mockGetters, {}).buildQueryString();

      expect(valuesOf(qs, param)).toStrictEqual([expected]);
    });

    it('should add telemetry params after the existing params', () => {
      mockPlugins = [ext('harvester', { t: () => ({ zz: 'last' }) })];

      const qs = new SystemInfoProvider(mockGetters, {}).buildQueryString();

      expect(qs.endsWith('&zz=last')).toBe(true);
    });

    it('should URL encode telemetry param names and values', () => {
      mockPlugins = [ext('harvester', { t: () => ({ 'a&b': 'x=y&z' }) })];

      const qs = new SystemInfoProvider(mockGetters, {}).buildQueryString();

      expect(qs).toContain('a%26b=x%3Dy%26z');
    });

    it('should not allow an encoded param name to inject extra params', () => {
      mockPlugins = [ext('harvester', { t: () => ({ 'x&dcv': 'v9' }) })];

      const qs = new SystemInfoProvider(mockGetters, {}).buildQueryString();

      expect(valuesOf(qs, 'dcv')).toStrictEqual(['v1']);
    });

    it('should ignore an empty param name', () => {
      mockPlugins = [ext('harvester', { t: () => ({ '': 'empty' }) })];

      const qs = new SystemInfoProvider(mockGetters, {}).buildQueryString();

      expect(qs).not.toContain('=empty');
    });
  });
});
