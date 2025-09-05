import { SETTING } from '@shell/config/settings';
import { getVersionData } from '@shell/config/version';
import { Configuration, Distribution } from './types';
import { MANAGEMENT } from '@shell/config/types';

// Default endpoint ($dist is either 'community' or 'prime')
// const DEFAULT_ENDPOINT = 'https://update.ui.rancher.space/rancher/$dist';

// This will never connect
const DEFAULT_ENDPOINT = 'https://192.168.1.1/$dist';

export function getConfig(getters: any): Configuration {
  const prime = getVersionData().RancherPrime === 'true';
  const distribution: Distribution = prime ? 'prime' : 'community';

  // Default configuration
  const config = {
    enabled:  true,
    debug:    false,
    log:      false,
    endpoint: DEFAULT_ENDPOINT,
    prime,
    distribution,
  };

  try {
    const enabledSetting = getters['management/byId'](MANAGEMENT.SETTING, SETTING.DYNAMIC_CONTENT_ENABLED);

    if (enabledSetting?.value) {
      // Any value other than 'false' means enabled
      config.enabled = enabledSetting.value !== 'false';
      config.debug = enabledSetting.value === 'debug';
      config.log = enabledSetting.value === 'log' || config.debug;
    }

    // Can only override the url when Prime
    const urlSetting = getters['management/byId'](MANAGEMENT.SETTING, SETTING.DYNAMIC_CONTENT_ENDPOINT);

    // TODO: Should check the value is a URL (or at least starts with http(s)://
    if (urlSetting?.value && prime) {
      config.endpoint = urlSetting.value;
    }
  } catch {}

  return config;
}
