<script>
import { AFTER_LOGIN_ROUTE, LAST_VISITED, SEEN_WHATS_NEW } from '@/store/prefs';

export default {
  middleware({ redirect, store } ) {
    const seenWhatsNew = store.getters['prefs/get'](SEEN_WHATS_NEW);

    if (!seenWhatsNew) {
      store.dispatch('prefs/set', { key: SEEN_WHATS_NEW, value: true });

      return redirect({ name: 'whats-new' });
    }
    const afterLoginRoute = store.getters['prefs/get'](AFTER_LOGIN_ROUTE);

    if (afterLoginRoute === 'last-visited') {
      const lastVisted = store.getters['prefs/get'](LAST_VISITED);

      if (lastVisted !== '/') {
        return redirect({ path: lastVisted });
      } else {
        return redirect({ name: 'clusters' });
      }
    }
    // todo redirect to current cluster or default cluster
    // move route-generating logic to store getter?

    return redirect({ path: afterLoginRoute });
  }
};
</script>
