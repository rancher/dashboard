<script>
import ResourceDetail from '@shell/components/ResourceDetail';
import { MANAGEMENT } from '@shell/config/types';
import { authProvidersInfo } from '@shell/utils/auth';

export default {
  name:       'AuthConfigDetail',
  components: { ResourceDetail },
  computed:   {
    AUTH_CONFIG() {
      return MANAGEMENT.AUTH_CONFIG;
    }
  },
  async beforeRouteLeave(to, from, next) {
    // The root auth/config page redirects to this page in some cases. Prevent that navigation if we're just going to end up here again
    const sameRoute = from.name === 'c-cluster-auth-config-id' && to.name === 'c-cluster-auth-config';

    if (sameRoute) {
      // Ensure we re-evaluate the redirect in case this auth provider has been disabled
      const authProvs = await authProvidersInfo(this.$store);

      // Nuxt does not remove it's loading indicator - if we are not changing route, then hide it
      // https://nuxtjs.org/docs/features/loading/
      if (authProvs.enabledLocation) {
        this.$nuxt.$loading.finish();
      }

      next(!authProvs.enabledLocation);
    } else {
      next();
    }
  },
};
</script>

<template>
  <ResourceDetail
    :resource-override="AUTH_CONFIG"
    :flex-content="true"
  />
</template>
