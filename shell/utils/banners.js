/**
 *
 * Helper utilities for the fixed banners that can be configured to show on pages
 *
 */

import { MANAGEMENT } from '@shell/config/types';
import { SETTING } from '@shell/config/settings';

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

/**
 * Converts a pixel value to an em value based on the default font size.
 * @param {number} elementFontSize - The font size of the element in pixels.
 * @param {number} [defaultFontSize=14] - The default font size in pixels.
 * @returns {string} The converted value in em units.
 */
function pxToEm(elementFontSize, defaultFontSize = 14) {
  const lineHeightInPx = 2 * parseInt(elementFontSize);
  const lineHeightInEm = lineHeightInPx / defaultFontSize;

  return `${ lineHeightInEm }em`;
}

/**
 * Get banner font sizes - used to add margins when header and footer banners are present
 **/
export function getGlobalBannerFontSizes(store) {
  const settings = store.getters['management/all'](MANAGEMENT.SETTING);
  const bannerSettings = settings?.find((s) => s.id === SETTING.BANNERS);
  const individualBannerSettings = getIndividualBanners(store);

  if (bannerSettings) {
    const parsed = JSON.parse(bannerSettings.value);

    overlayIndividualBanners(parsed, individualBannerSettings);

    const {
      showFooter, showHeader, bannerFooter, bannerHeader, banner
    } = parsed;

    // add defaults to accommodate older JSON structures for banner definitions without breaking the UI
    // https://github.com/rancher/dashboard/issues/10140
    const bannerHeaderFontSize = bannerHeader?.fontSize || banner?.fontSize || '14px';
    const bannerFooterFontSize = bannerFooter?.fontSize || banner?.fontSize || '14px';

    return {
      headerFont: showHeader === 'true' ? pxToEm(bannerHeaderFontSize) : '0px',
      footerFont: showFooter === 'true' ? pxToEm(bannerFooterFontSize) : '0px'
    };
  }

  return undefined;
}
