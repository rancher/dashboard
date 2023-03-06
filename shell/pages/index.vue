<script>
import { SEEN_WHATS_NEW } from '@shell/store/prefs';
import { getVersionInfo } from '@shell/utils/version';

const validRoute = (route, router) => {
  return !!route && !!router.resolve(route)?.resolved?.matched?.length;
};

export default {
  middleware({
    redirect, store, app, route
  } ) {
    const seenWhatsNew = store.getters['prefs/get'](SEEN_WHATS_NEW);
    const versionInfo = getVersionInfo(store);
    const isSingleProduct = store.getters['isSingleProduct'];
    const dashboardHome = { name: 'home' };

    // If this is a new version, then take the user to the home page to view the release notes
    if (versionInfo.fullVersion !== seenWhatsNew && !isSingleProduct) {
      return redirect(dashboardHome);
    }

    const afterLoginRouteObject = store.getters['prefs/afterLoginRoute'];
    const targetRoute = app.router.resolve(afterLoginRouteObject);

    // If target route is /, then we will loop with endless redirect - so detect that here and
    // redirect to /home, which is what we would do below, if there was no `afterLoginRouteObject`
    if (targetRoute?.route?.fullPath === '/') {
      return redirect(dashboardHome);
    }

    // Confirm this is a valid route (it could have come from an uninstalled plugin)
    if (validRoute(afterLoginRouteObject, app.router)) {
      // Take the user to the configured login route
      return redirect(afterLoginRouteObject);
    }

    if (validRoute(isSingleProduct?.afterLoginRoute, app.router)) {
      return redirect(isSingleProduct.afterLoginRoute);
    }

    return redirect(dashboardHome);
  }
};
</script>
