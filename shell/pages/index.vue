<script>
import { SEEN_WHATS_NEW } from '@shell/store/prefs';
import { getVersionInfo } from '@shell/utils/version';
import { BACK_TO } from '@shell/config/local-storage';

const resolveRoute = (route, router) => {
  try {
    return route ? router.resolve(route) : null;
  } catch (e) {
    return null;
  }
};

// TODO #13939: This function has always a match using "/:catchAll(.*)*"
const validRoute = (route, router) => {
  return !!route && !!resolveRoute(route, router)?.matched?.length;
};

export default {
  // TODO #13939: Redirection should be handled by route guards
  beforeMount() {
    const seenWhatsNew = this.$store.getters['prefs/get'](SEEN_WHATS_NEW);
    const versionInfo = getVersionInfo(this.$store);
    const isSingleProduct = this.$store.getters['isSingleProduct'];
    const dashboardHome = { name: 'home' };

    // If this is a new version, then take the user to the home page to view the release notes
    if (versionInfo.fullVersion !== seenWhatsNew && !isSingleProduct) {
      return this.$router.replace(dashboardHome);
    }

    // Return to last page after logout if any
    const backTo = window.localStorage.getItem(BACK_TO);
    const resolvedBackTo = resolveRoute(backTo, this.$router);

    if (resolvedBackTo) {
      window.localStorage.removeItem(BACK_TO); // Reset value to prevent loops or other issues

      return this.$router.replace(resolvedBackTo);
    }

    const afterLoginRouteObject = this.$store.getters['prefs/afterLoginRoute'];
    const targetRoute = resolveRoute(afterLoginRouteObject, this.$router);

    // If target route is /, then we will loop with endless redirect - so detect that here and
    // redirect to /home, which is what we would do below, if there was no `afterLoginRouteObject`
    if (targetRoute?.fullPath === '/') {
      return this.$router.replace(dashboardHome);
    }

    // Confirm this is a valid route (it could have come from an uninstalled plugin)
    if (validRoute(afterLoginRouteObject, this.$router)) {
      // Take the user to the configured login route
      return this.$router.replace(afterLoginRouteObject);
    }

    if (validRoute(isSingleProduct?.afterLoginRoute, this.$router)) {
      return this.$router.replace(isSingleProduct.afterLoginRoute);
    }

    return this.$router.replace(dashboardHome);
  }
};
</script>
<template>
  <div />
</template>
