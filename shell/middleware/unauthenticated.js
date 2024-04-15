import { setFavIcon, haveSetFavIcon } from '@shell/utils/favicon';
import { fetchInitialSettings } from '@shell/utils/settings';

export default async function({ store }) {
  if (haveSetFavIcon()) {
    return;
  }

  try {
    // Load settings, which will either be just the public ones if not logged in, or all if you are
    fetchInitialSettings(store)
      // Don't block everything on fetching settings, just update when they come in
      .then(() => {
        // Set the favicon - use custom one from store if set
        setFavIcon(store);
      });
  } catch (e) {}
}
