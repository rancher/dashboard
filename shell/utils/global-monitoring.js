import { SETTING, getGlobalMonitoringV2Setting } from '@shell/config/settings';
import { MANAGEMENT } from '@shell/config/types';

// Can be used inside a components' computed property
export function monitoringStatus() {
  return {
    monitoringStatus: {
      get() {
        const status = {
          v1: haveV1Monitoring(this.$store.getters),
          v2: haveV2Monitoring(this.$store.getters),
        };

        status.installed = status.v1 || status.v2;

        return status;
      },
      set(enabled) {
        this.monitoringStatus.v2 = enabled;
        this.monitoringStatus.installed = this.monitoringStatus.v1 || enabled;
      }
    }
  };
}

export function haveV2Monitoring(getters, settings) {
  if (haveV1Monitoring(getters)) {
    return false;
  }

  const config = settings || getGlobalMonitoringV2Setting(getters);

  if (config) {
    return config.enabled === 'true';
  }

  return false;
}

export function haveV1Monitoring(getters) {
  return getters['management/byId'](MANAGEMENT.SETTING, SETTING.GLOBAL_MONITORING_ENABLED)?.value === 'true';
}
