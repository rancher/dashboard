import { PerfSettings } from '@shell/config/settings';

type PaginationSupersedesSettings = 'incrementalLoading' | 'manualRefresh'

class _Utils {
  private setting: PaginationSupersedesSettings;
  constructor(setting: PaginationSupersedesSettings) {
    this.setting = setting;
  }

  /**
   * This is a centralised point to ensure SSP takes precedence over the performance setting
   */
  isEnabled(paginationEnabled: boolean, perfSettings: PerfSettings): boolean {
    return !paginationEnabled && perfSettings[this.setting].enabled;
  }
}

export default {
  /**
   * Helper functions for the 'incremental loading indicator' performance settings
   */
  incrementalLoadingUtils: new _Utils('incrementalLoading'),
  /**
   * Helper functions for the 'manual refresh' performance settings
   */
  manualRefreshUtils:      new _Utils('manualRefresh'),
};
