import perfSettingUtils from '@shell/utils/perf-setting.utils';
import { PerfSettings } from '@shell/config/settings';

const makePerfSettings = (incrementalLoading: boolean, manualRefresh: boolean): PerfSettings => ({
  inactivity:                   { enabled: false, threshold: 0 },
  incrementalLoading:           { enabled: incrementalLoading, threshold: 0 },
  manualRefresh:                { enabled: manualRefresh, threshold: 0 },
  disableWebsocketNotification: false,
  garbageCollection:            {} as any,
  forceNsFilterV2:              null,
  advancedWorker:               {},
  kubeAPI:                      { warningHeader: { separator: '', notificationBlockList: [] } },
  serverPagination:             {} as any,
});

describe('perf-setting.utils', () => {
  describe('incrementalLoadingUtils.isEnabled', () => {
    it.each([
      [false, true, true, 'SSP disabled, performance setting enabled → enabled'],
      [false, false, false, 'SSP disabled, performance setting disabled → disabled'],
      [true, true, false, 'SSP enabled takes precedence even if performance setting enabled → disabled'],
      [true, false, false, 'SSP enabled, performance setting disabled → disabled'],
    ])('paginationEnabled=%s, perfEnabled=%s → %s (%s)', (paginationEnabled, perfEnabled, expected) => {
      const settings = makePerfSettings(perfEnabled, false);

      expect(perfSettingUtils.incrementalLoadingUtils.isEnabled(paginationEnabled, settings)).toStrictEqual(expected);
    });
  });

  describe('manualRefreshUtils.isEnabled', () => {
    it.each([
      [false, true, true, 'SSP disabled, performance setting enabled → enabled'],
      [false, false, false, 'SSP disabled, performance setting disabled → disabled'],
      [true, true, false, 'SSP enabled takes precedence even if performance setting enabled → disabled'],
      [true, false, false, 'SSP enabled, performance setting disabled → disabled'],
    ])('paginationEnabled=%s, perfEnabled=%s → %s (%s)', (paginationEnabled, perfEnabled, expected) => {
      const settings = makePerfSettings(false, perfEnabled);

      expect(perfSettingUtils.manualRefreshUtils.isEnabled(paginationEnabled, settings)).toStrictEqual(expected);
    });
  });

  describe('incrementalLoadingUtils and manualRefreshUtils are independent instances', () => {
    it('incrementalLoading setting does not affect manualRefreshUtils', () => {
      const settings = makePerfSettings(true, false);

      expect(perfSettingUtils.incrementalLoadingUtils.isEnabled(false, settings)).toStrictEqual(true);
      expect(perfSettingUtils.manualRefreshUtils.isEnabled(false, settings)).toStrictEqual(false);
    });

    it('manualRefresh setting does not affect incrementalLoadingUtils', () => {
      const settings = makePerfSettings(false, true);

      expect(perfSettingUtils.incrementalLoadingUtils.isEnabled(false, settings)).toStrictEqual(false);
      expect(perfSettingUtils.manualRefreshUtils.isEnabled(false, settings)).toStrictEqual(true);
    });
  });
});
