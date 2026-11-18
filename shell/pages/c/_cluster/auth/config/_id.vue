<script>
import ResourceDetail from '@shell/components/ResourceDetail';
import Loading from '@shell/components/Loading';
import { MANAGEMENT } from '@shell/config/types';
import { providerKey } from '@shell/models/management.cattle.io.authconfig';

export default {
  name:       'AuthConfigDetail',
  components: { Loading, ResourceDetail },

  async fetch() {
    try {
      const config = await this.$store.dispatch('management/find', {
        type: MANAGEMENT.AUTH_CONFIG,
        id:   this.$route.params.id,
      });

      this.provider = providerKey(config?._type);
    } catch (e) {
      // ResourceDetail reports missing or inaccessible resources in context.
    }
  },

  data() {
    return { provider: null };
  },

  computed: {
    AUTH_CONFIG() {
      return MANAGEMENT.AUTH_CONFIG;
    }
  },
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <ResourceDetail
    v-else
    :resource-override="AUTH_CONFIG"
    :sub-type-override="provider"
    :flex-content="true"
  />
</template>
