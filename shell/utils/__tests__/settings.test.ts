import {
  fetchOrCreateSetting,
  fetchSetting,
  fetchInitialSettings,
  setSetting,
  getPerformanceSetting,
  isProviderEnabled,
} from '../settings';
import { DEFAULT_PERF_SETTING, SETTING } from '@shell/config/settings';
import { MANAGEMENT } from '@shell/config/types';
import { ClusterProvisionerContext } from '@shell/core/types';

const makeMockRootGetters = (settingValue?: string) => {
  return {
    'management/byId': (type: string, id: string) => {
      if (type === MANAGEMENT.SETTING && id === SETTING.UI_PERFORMANCE) {
        return settingValue !== undefined ? { value: settingValue } : undefined;
      }

      return undefined;
    },
  };
};

const makeMockContext = (settingValue?: string): ClusterProvisionerContext => {
  return {
    getters: {
      'management/byId': (type: string, id: string) => {
        if (type === MANAGEMENT.SETTING && id === SETTING.KEV2_OPERATORS) {
          return settingValue !== undefined ? { value: settingValue } : undefined;
        }

        return undefined;
      },
    },
    dispatch:   {},
    axios:      {},
    $plugin:    {},
    $extension: {},
  } as unknown as ClusterProvisionerContext;
};

describe('getPerformanceSetting', () => {
  it('returns DEFAULT_PERF_SETTING when no setting resource exists', () => {
    const rootGetters = makeMockRootGetters();

    const result = getPerformanceSetting(rootGetters);

    expect(result).toStrictEqual(DEFAULT_PERF_SETTING);
  });

  it('returns DEFAULT_PERF_SETTING when setting value is empty string', () => {
    const rootGetters = makeMockRootGetters('');

    const result = getPerformanceSetting(rootGetters);

    expect(result).toStrictEqual(DEFAULT_PERF_SETTING);
  });

  it('merges valid JSON setting value with defaults', () => {
    const customSetting = { inactivity: { enabled: true, threshold: 300 } };
    const rootGetters = makeMockRootGetters(JSON.stringify(customSetting));

    const result = getPerformanceSetting(rootGetters);

    expect(result.inactivity).toStrictEqual({ enabled: true, threshold: 300 });
    // Other defaults are preserved
    expect(result.incrementalLoading).toStrictEqual(DEFAULT_PERF_SETTING.incrementalLoading);
  });

  it('returns DEFAULT_PERF_SETTING when setting value is invalid JSON', () => {
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const rootGetters = makeMockRootGetters('not-valid-json{{{');

    const result = getPerformanceSetting(rootGetters);

    expect(result).toStrictEqual(DEFAULT_PERF_SETTING);
    consoleSpy.mockRestore();
  });

  it('warns when setting value is invalid JSON', () => {
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const rootGetters = makeMockRootGetters('bad json');

    getPerformanceSetting(rootGetters);

    expect(consoleSpy).toHaveBeenCalledWith('ui-performance setting contains invalid data');
    consoleSpy.mockRestore();
  });

  it('applies partial overrides without losing other defaults', () => {
    const customSetting = { manualRefresh: { enabled: true, threshold: 999 } };
    const rootGetters = makeMockRootGetters(JSON.stringify(customSetting));

    const result = getPerformanceSetting(rootGetters);

    expect(result.manualRefresh).toStrictEqual({ enabled: true, threshold: 999 });
    expect(result.inactivity).toStrictEqual(DEFAULT_PERF_SETTING.inactivity);
    expect(result.disableWebsocketNotification).toStrictEqual(DEFAULT_PERF_SETTING.disableWebsocketNotification);
  });
});

describe('isProviderEnabled', () => {
  it('returns true when no providers setting exists (default enabled)', () => {
    const context = makeMockContext();

    expect(isProviderEnabled(context, 'someProvider')).toBe(true);
  });

  it('returns true when providers list is empty', () => {
    const context = makeMockContext(JSON.stringify([]));

    expect(isProviderEnabled(context, 'someProvider')).toBe(true);
  });

  it('returns true when provider is not in the list', () => {
    const providers = [{ name: 'otherProvider', active: false }];
    const context = makeMockContext(JSON.stringify(providers));

    expect(isProviderEnabled(context, 'someProvider')).toBe(true);
  });

  it.each([
    {
      provider: 'eks', providers: [{ name: 'eks', active: true }], expected: true
    },
    {
      provider: 'eks', providers: [{ name: 'eks', active: false }], expected: false
    },
    {
      provider: 'gke', providers: [{ name: 'eks', active: true }, { name: 'gke', active: false }, { name: 'aks', active: true }], expected: false
    },
    {
      provider: 'aks', providers: [{ name: 'eks', active: true }, { name: 'gke', active: false }, { name: 'aks', active: true }], expected: true
    },
  ])('returns $expected for provider "$provider"', ({ provider, providers, expected }) => {
    const context = makeMockContext(JSON.stringify(providers));

    expect(isProviderEnabled(context, provider)).toBe(expected);
  });

  it('throws when setting value is invalid JSON', () => {
    const context = makeMockContext('not-valid-json{{{');

    expect(() => isProviderEnabled(context, 'eks')).toThrow('Unexpected token');
  });
});

describe('fetchOrCreateSetting', () => {
  it('returns existing setting when management/find succeeds', async() => {
    const existingSetting = { id: 'my-setting', value: 'existing-value' };
    const store = {
      dispatch: jest.fn().mockResolvedValue(existingSetting),
      getters:  {},
    };

    const result = await fetchOrCreateSetting(store as any, 'my-setting', 'default-value');

    expect(store.dispatch).toHaveBeenCalledWith('management/find', {
      type: MANAGEMENT.SETTING,
      id:   'my-setting',
    });
    expect(result).toStrictEqual(existingSetting);
  });

  it('creates and saves setting when management/find throws and save is true', async() => {
    const createdSetting = {
      id: 'new-setting', value: 'new-value', save: jest.fn().mockResolvedValue(undefined)
    };
    const schemaUrl = '/v1/management.cattle.io.settings';
    const mockSchema = { linkFor: jest.fn().mockReturnValue(schemaUrl) };
    const store = {
      dispatch: jest.fn()
        .mockRejectedValueOnce(new Error('not found'))
        .mockResolvedValueOnce(createdSetting),
      getters: { 'management/schemaFor': jest.fn().mockReturnValue(mockSchema) },
    };

    const result = await fetchOrCreateSetting(store as any, 'new-setting', 'new-value', true);

    expect(store.dispatch).toHaveBeenNthCalledWith(2, 'management/create', {
      type:     MANAGEMENT.SETTING,
      metadata: { name: 'new-setting' },
      value:    'new-value',
      default:  'new-value',
    });
    expect(createdSetting.save).toHaveBeenCalledWith({ url: schemaUrl });
    expect(result).toStrictEqual(createdSetting);
  });

  it('creates setting but does not save when save is false', async() => {
    const createdSetting = {
      id: 'new-setting', value: 'new-value', save: jest.fn()
    };
    const mockSchema = { linkFor: jest.fn().mockReturnValue('/some/url') };
    const store = {
      dispatch: jest.fn()
        .mockRejectedValueOnce(new Error('not found'))
        .mockResolvedValueOnce(createdSetting),
      getters: { 'management/schemaFor': jest.fn().mockReturnValue(mockSchema) },
    };

    await fetchOrCreateSetting(store as any, 'new-setting', 'default-val', false);

    expect(createdSetting.save).not.toHaveBeenCalled();
  });

  it('uses empty string as default when val is empty', async() => {
    const createdSetting = {
      id: 'new-setting', value: '', save: jest.fn()
    };
    const mockSchema = { linkFor: jest.fn().mockReturnValue('/url') };
    const store = {
      dispatch: jest.fn()
        .mockRejectedValueOnce(new Error('not found'))
        .mockResolvedValueOnce(createdSetting),
      getters: { 'management/schemaFor': jest.fn().mockReturnValue(mockSchema) },
    };

    await fetchOrCreateSetting(store as any, 'new-setting', '', false);

    expect(store.dispatch).toHaveBeenNthCalledWith(2, 'management/create', {
      type:     MANAGEMENT.SETTING,
      metadata: { name: 'new-setting' },
      value:    '',
      default:  '',
    });
  });
});

describe('fetchSetting', () => {
  it('returns the matching setting by id', async() => {
    const settings = [
      { id: 'setting-a', value: 'a' },
      { id: 'setting-b', value: 'b' },
    ];
    const store = { dispatch: jest.fn().mockResolvedValue(settings) };

    const result = await fetchSetting(store as any, 'setting-b');

    expect(store.dispatch).toHaveBeenCalledWith('management/findAll', { type: MANAGEMENT.SETTING });
    expect(result).toStrictEqual({ id: 'setting-b', value: 'b' });
  });

  it('returns undefined when setting id is not found', async() => {
    const settings = [{ id: 'setting-a', value: 'a' }];
    const store = { dispatch: jest.fn().mockResolvedValue(settings) };

    const result = await fetchSetting(store as any, 'nonexistent');

    expect(result).toBeUndefined();
  });

  it('returns undefined when findAll returns null', async() => {
    const store = { dispatch: jest.fn().mockResolvedValue(null) };

    const result = await fetchSetting(store as any, 'setting-a');

    expect(result).toBeUndefined();
  });
});

describe('fetchInitialSettings', () => {
  it('dispatches findAll with full url and watch:false when authed (header=true)', async() => {
    const store = {
      dispatch: jest.fn().mockResolvedValue([]),
      getters:  {
        'management/generation': jest.fn().mockReturnValue(null),
        'auth/fromHeader':       'true',
      },
    };

    await fetchInitialSettings(store as any);

    expect(store.dispatch).toHaveBeenCalledWith('management/findAll', {
      type: MANAGEMENT.SETTING,
      opt:  {
        url:   expect.stringContaining(MANAGEMENT.SETTING),
        watch: false,
      },
    });
  });

  it('dispatches findAll with full url and watch:false when authed (header=none)', async() => {
    const store = {
      dispatch: jest.fn().mockResolvedValue([]),
      getters:  {
        'management/generation': jest.fn().mockReturnValue(null),
        'auth/fromHeader':       'none',
      },
    };

    await fetchInitialSettings(store as any);

    expect(store.dispatch).toHaveBeenCalledWith('management/findAll', {
      type: MANAGEMENT.SETTING,
      opt:  {
        url:   expect.stringContaining(MANAGEMENT.SETTING),
        watch: false,
      },
    });
  });

  it('dispatches findAll with redirectUnauthorized:false when not authed and no generation', async() => {
    const store = {
      dispatch: jest.fn().mockResolvedValue([]),
      getters:  {
        'management/generation': jest.fn().mockReturnValue(null),
        'auth/fromHeader':       'false',
      },
    };

    await fetchInitialSettings(store as any);

    expect(store.dispatch).toHaveBeenCalledWith('management/findAll', {
      type: MANAGEMENT.SETTING,
      opt:  {
        url:                  expect.stringContaining(MANAGEMENT.SETTING),
        load:                 'multi',
        redirectUnauthorized: false,
      },
    });
  });

  it('returns cached settings from store.getters when not authed but generation exists', async() => {
    const cachedSettings = [{ id: 'setting-a', value: 'a' }];
    const store = {
      dispatch: jest.fn(),
      getters:  {
        'management/generation': jest.fn().mockReturnValue(5),
        'auth/fromHeader':       'false',
        'management/all':        jest.fn().mockReturnValue(cachedSettings),
      },
    };

    const result = await fetchInitialSettings(store as any);

    expect(store.dispatch).not.toHaveBeenCalled();
    expect(store.getters['management/all']).toHaveBeenCalledWith(MANAGEMENT.SETTING);
    expect(result).toStrictEqual(cachedSettings);
  });
});

describe('setSetting', () => {
  it('fetches or creates setting, sets value, saves, and returns it', async() => {
    const existingSetting = {
      id:    'my-setting',
      value: 'old-value',
      save:  jest.fn().mockResolvedValue(undefined),
    };
    const store = {
      dispatch: jest.fn().mockResolvedValue(existingSetting),
      getters:  {},
    };

    const result = await setSetting(store as any, 'my-setting', 'new-value');

    expect(existingSetting.value).toBe('new-value');
    expect(existingSetting.save).toHaveBeenCalled();
    expect(result).toStrictEqual(existingSetting);
  });

  it('uses fetchOrCreateSetting with save=false', async() => {
    const existingSetting = {
      id:    'my-setting',
      value: 'original',
      save:  jest.fn().mockResolvedValue(undefined),
    };
    const store = {
      dispatch: jest.fn().mockResolvedValue(existingSetting),
      getters:  {},
    };

    await setSetting(store as any, 'my-setting', 'updated');

    // management/find is called (not create path), with save=false for fetchOrCreateSetting
    expect(store.dispatch).toHaveBeenCalledWith('management/find', {
      type: MANAGEMENT.SETTING,
      id:   'my-setting',
    });
  });
});
