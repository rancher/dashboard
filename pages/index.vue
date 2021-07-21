<script>
import { SEEN_WHATS_NEW } from '@/store/prefs';
import { getVersionInfo } from '@/utils/version';

export default {
  middleware({ redirect, store } ) {
    const seenWhatsNew = store.getters['prefs/get'](SEEN_WHATS_NEW);
    const versionInfo = getVersionInfo(store);
    console.log(store.getters['prefs/afterLoginRoute'], 'afterLoginRoute')
    // If this is a new version, then take the user to the home page to view the release notes
    if (versionInfo.fullVersion !== seenWhatsNew) {
      return redirect({ name: 'home' });
    }

    // Take the user to the configured login route
    const afterLoginRouteObject = store.getters['prefs/afterLoginRoute'];

    return redirect(afterLoginRouteObject);
  }
};
</script>
