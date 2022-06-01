import { SETTING } from '@shell/config/settings';
import { MANAGEMENT } from '@shell/config/types';

export function setFavIcon(store) {
  const app = store.app;
  const res = store.getters['management/byId'](MANAGEMENT.SETTING, SETTING.FAVICON);
  const link = findIconLink(app.head.link);

  if (link) {
    link.href = res?.value || defaultFavIcon;
  }
}

function getCurrentFavIcon() {
  const link = findIconLink(document.head.getElementsByTagName('link'));

  return link ? link.href : '';
}

function findIconLink(links) {
  for (let i = 0; i < links.length; i++) {
    const link = links[i];

    if (link.rel === 'icon') {
      return link;
    }
  }

  return undefined;
}

const defaultFavIcon = getCurrentFavIcon();
