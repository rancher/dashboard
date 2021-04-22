<script>
import { SEEN_WHATS_NEW } from '@/store/prefs';

export default {
  middleware({ redirect, store } ) {
    const seenWhatsNew = store.getters['prefs/get'](SEEN_WHATS_NEW);

    if (!seenWhatsNew || !seenWhatsNew.length) {
      return redirect({ name: 'home' });
    }

    // TODO: Add back in support for changing login landing page
    // const afterLoginRouteObject = store.getters['prefs/afterLoginRoute'];
    // return redirect(afterLoginRouteObject);
    return redirect({ name: 'home' });
  }
};
</script>
