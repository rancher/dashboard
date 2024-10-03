<script>
import { SEEN_WHATS_NEW } from '@shell/store/prefs';
import { getVersionInfo } from '@shell/utils/version';

const resolveRoute = (route, router) => {
  try {
    return route ? router.resolve(route) : null;
  } catch (e) {
    return null;
  }
};

const validRoute = (route, router) => {
  return !!route && !!resolveRoute(route, router)?.matched?.length;
};

export default {
  beforeMount() {
    const seenWhatsNew = this.$store.getters['prefs/get'](SEEN_WHATS_NEW);
    const versionInfo = getVersionInfo(this.$store);
    const isSingleProduct = this.$store.getters['isSingleProduct'];
    const dashboardHome = { name: 'home' };

    // If this is a new version, then take the user to the home page to view the release notes
    if (versionInfo.fullVersion !== seenWhatsNew && !isSingleProduct) {
      return this.$router.replace(dashboardHome);
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
