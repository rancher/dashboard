<script>
import { SEEN_WHATS_NEW } from '@/store/prefs';

export default {
  middleware({ redirect, store } ) {
    const seenWhatsNew = store.getters['prefs/get'](SEEN_WHATS_NEW);

    if (!seenWhatsNew) {
      return redirect({ name: 'whats-new' });
    }
    const afterLoginRouteObject = store.getters['prefs/afterLoginRoute'];

    return redirect(afterLoginRouteObject);
  }
};
</script>
