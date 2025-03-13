/**
 *
 * Helper utilities for the fixed banners that can be configured to show on pages
 *
 */

import { MANAGEMENT } from '@shell/config/types';

const BANNER_HEADER = 'bannerHeader';
const BANNER_FOOTER = 'bannerFooter';
const BANNER_LOGIN = 'bannerConsent';

const INDIVIDUAL_BANNERS = {
  'ui-banner-header':        BANNER_HEADER,
  'ui-banner-footer':        BANNER_FOOTER,
  'ui-banner-login-consent': BANNER_LOGIN,
};

const BANNER_SHOW_KEY_MAP = {
  [BANNER_HEADER]: 'showHeader',
  [BANNER_FOOTER]: 'showFooter',
  [BANNER_LOGIN]:  'showConsent',
};

/**
 * Get the individual banner settings
 */
export function getIndividualBanners(store) {
  const banners = {};

  // Go through all settings looking for the individual settings
  const allSettings = store.getters['management/all'](MANAGEMENT.SETTING);

  allSettings.forEach((setting) => {
    if (setting.value && !!INDIVIDUAL_BANNERS[setting.id]) {
      const settingId = INDIVIDUAL_BANNERS[setting.id];

      banners[settingId] = setting;
    }
  });

  return banners;
}

/**
 * Overlay settings from the individual banner settings onto the single banner setting
 */
export function overlayIndividualBanners(parsedBanner, banners) {
  Object.keys(banners).forEach((id) => {
    try {
      const parsedIndividualBanner = JSON.parse(banners[id].value);
      const shownID = BANNER_SHOW_KEY_MAP[id];

      parsedBanner[id] = parsedIndividualBanner;
      parsedBanner[shownID] = 'true'; // If there is an individual banner setting, then banner is shown
    } catch {}
  });
}
