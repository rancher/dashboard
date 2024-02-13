import { setFavIcon, haveSetFavIcon } from '@shell/utils/favicon';
import { MANAGEMENT } from '@shell/config/types';
import { _ALL_IF_AUTHED } from '@shell/plugins/dashboard-store/actions';

export default async function({ store }) {
  if (haveSetFavIcon()) {
    return;
  }

  try {
    // Load settings, which will either be just the public ones if not logged in, or all if you are
    await store.dispatch('management/findAll', {
      type: MANAGEMENT.SETTING,
      opt:  { load: _ALL_IF_AUTHED, redirectUnauthorized: false }
    });

    // Set the favicon - use custom one from store if set
    setFavIcon(store);
  } catch (e) {}
}
