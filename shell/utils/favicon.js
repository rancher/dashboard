import { SETTING } from '@shell/config/settings';
import { MANAGEMENT } from '@shell/config/types';
import { getSettingValue } from './settings';

let favIconSet = false;

export function haveSetFavIcon() {
  return favIconSet;
}

export function setFavIcon(store, $plugin) {
  const res = store.getters['management/byId'](MANAGEMENT.SETTING, SETTING.FAVICON);
  const brandSetting = store.getters['management/byId'](MANAGEMENT.SETTING, SETTING.BRAND);
  const link = findIconLink(document.head.getElementsByTagName('link'));
  const brand = getSettingValue(brandSetting, $plugin);

  if (link) {
    let brandImage;

    if (brand === 'suse') {
      brandImage = require('~shell/assets/brand/suse/favicon.png');
    } else if (brand === 'csp') {
      brandImage = require('~shell/assets/brand/csp/favicon.png');
    } else if (brand === 'harvester') {
      brandImage = require('~shell/assets/brand/harvester/favicon.png');
    } else if (brand && $plugin?.getDynamic('image', `brand/${ brand }/favicon`)) {
      brandImage = $plugin.getDynamic('image', `brand/${ brand }/favicon`);
    }

    link.href = res?.value || brandImage || defaultFavIcon;
    favIconSet = true;
  }
}

function getCurrentFavIcon() {
  const link = findIconLink(document.head.getElementsByTagName('link'));

  return link ? link.href : '';
}

function findIconLink(links) {
  for (let i = 0; i < links.length; i++) {
    const link = links[i];

    if (link.rel?.includes('icon')) {
      return link;
    }
  }

  return undefined;
}

const defaultFavIcon = getCurrentFavIcon();
