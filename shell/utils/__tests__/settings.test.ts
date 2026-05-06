import { getPerformanceSetting, isProviderEnabled } from '../settings';
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
