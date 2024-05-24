import { fetchInitialSettings } from '@shell/utils/settings';

/**
 * All pages need access to the initial settings to get things like the favicon and color theme.
 * This loads those settings for all pages so we can remove it from all other locations.
 */
export function loadInitialSettings(store) {
  return async(to, from, next) => {
    try {
      await fetchInitialSettings(store);
    } catch (ex) {}

    next();
  };
}
