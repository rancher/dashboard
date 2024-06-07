import { MANAGEMENT } from '@shell/config/types';

const BANNER_HEADER = 'bannerHeader';
const BANNER_FOOTER = 'bannerFooter';
const BANNER_LOGIN = 'bannerConsent';

const INDIVIDUAL_BANNERS = {
  'ui-banner-header': BANNER_HEADER,
  'ui-banner-footer': BANNER_FOOTER,
  'ui-banner-login-consent': BANNER_LOGIN,
};

const BANNER_SHOW_KEY_MAP = {
  [BANNER_HEADER]: 'showHeader',
  [BANNER_FOOTER]: 'showFooter',
  [BANNER_LOGIN]: 'showConsent',
};

export function getIndividualBanners(store) {
  const banners = {};

  // We fetch all settings, so we can check for individual banner setting resources
  // We will have already fetched all settings, so there is no performance impact doing this versus fetching individual settings
  const allSettings = store.getters['management/all'](MANAGEMENT.SETTING);

  allSettings.forEach((setting) => {
    if (setting.value && !!INDIVIDUAL_BANNERS[setting.id]) {
      const settingId = INDIVIDUAL_BANNERS[setting.id];

      banners[settingId] = setting;
    }
  });

  return banners;
}

export function overlayIndividualBanners(parsedBanner, banners) {
  Object.keys(banners).forEach((id) => {
    try {
        const parsedIndvBanner = JSON.parse(banners[id].value);
        const shownID = BANNER_SHOW_KEY_MAP[id];

        parsedBanner[id] = parsedIndvBanner;
        parsedBanner[shownID] = 'true'; // If there is an individual banner setting, then banner is shown
    } catch {}
  });  
}
