import { useI18n } from './useI18n';
import { stringFor } from '@shell/plugins/i18n';

jest.mock('@shell/plugins/i18n', () => ({ stringFor: jest.fn() }));
jest.unmock('@shell/composables/useI18n');

const mockStringFor = stringFor as jest.Mock;

describe('useI18n', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    delete process.env.dev;
  });

  describe('useI18n()', () => {
    it('returns an object with a t function when given a valid store', () => {
      const result = useI18n({} as any);

      expect(typeof result.t).toStrictEqual('function');
    });

    it('throws when called with null', () => {
      expect(() => useI18n(null as any)).toThrow('usI18n() must be called from setup()');
    });

    it('throws when called with undefined', () => {
      expect(() => useI18n(undefined as any)).toThrow('usI18n() must be called from setup()');
    });

    it('uses the latest provided store when called multiple times', () => {
      const storeA = { id: 'a' } as any;
      const storeB = { id: 'b' } as any;

      mockStringFor.mockReturnValue('translated');
      useI18n(storeA);
      const { t } = useI18n(storeB);

      t('key');
      expect(mockStringFor).toHaveBeenCalledWith(storeB, 'key', undefined, undefined);
    });
  });

  describe('t()', () => {
    it.each([
      {
        desc:       'key only',
        key:        'nav.home',
        args:       undefined as unknown,
        raw:        undefined as boolean | undefined,
        mockReturn: 'Home',
      },
      {
        desc:       'key with args',
        key:        'items.count',
        args:       { count: 5 } as unknown,
        raw:        undefined as boolean | undefined,
        mockReturn: '5 items',
      },
      {
        desc:       'key with args and raw enabled',
        key:        'html.template',
        args:       { value: 'test' } as unknown,
        raw:        true as boolean | undefined,
        mockReturn: '<b>test</b>',
      },
    ])('calls stringFor for $desc', ({
      key, args, raw, mockReturn
    }) => {
      const store = {} as any;

      mockStringFor.mockReturnValue(mockReturn);
      const { t } = useI18n(store);
      const result = t(key, args, raw);

      expect(mockStringFor).toHaveBeenCalledWith(store, key, args, raw);
      expect(result).toStrictEqual(mockReturn);
    });

    it('returns the key when store is not set', () => {
      const { t } = useI18n({} as any);

      // Reset store to null: useI18n(null) sets store=null before throwing
      try {
        useI18n(null as any);
      } catch { /* expected */ }

      expect(t('fallback.key')).toStrictEqual('fallback.key');
    });

    it('logs a console.warn when store is not set and process.env.dev is truthy', () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      process.env.dev = 'true';
      const { t } = useI18n({} as any);

      try {
        useI18n(null as any);
      } catch { /* expected */ }

      t('warn.key');
      expect(warnSpy).toHaveBeenCalledWith('useI18n: store not available');
    });

    it('does not log console.warn when store is not set and process.env.dev is falsy', () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      const { t } = useI18n({} as any);

      try {
        useI18n(null as any);
      } catch { /* expected */ }

      t('quiet.key');
      expect(warnSpy).not.toHaveBeenCalled();
    });
  });
});
