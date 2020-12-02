<script>
import ResourceTable from '@/components/ResourceTable';
import Loading from '@/components/Loading';
import { MONITORING } from '@/config/types';
import { areRoutesSupportedFormat, getSecret } from '@/utils/alertmanagerconfig';
import { MODE, _EDIT } from '@/config/query-params';

export default {
  name:       'ListRoute',
  components: { Loading, ResourceTable },

  props: {
    schema: {
      type:     Object,
      required: true,
    },
  },

  async fetch() {
    const routes = this.$store.dispatch('cluster/findAll', { type: MONITORING.SPOOFED.ROUTE });
    const secret = await getSecret(this.$store.dispatch);
    const areSomeRoutesInvalidFormat = areRoutesSupportedFormat(secret);

    if (areSomeRoutesInvalidFormat) {
      this.$store.dispatch('type-map/configureType', { match: MONITORING.SPOOFED.ROUTE, isCreatable: true });
      this.rows = await routes;
    } else {
      this.$store.dispatch('type-map/configureType', { match: MONITORING.SPOOFED.ROUTE, isCreatable: false });
      this.secretTo = { ...secret.detailLocation };
      this.secretTo.query = { [MODE]: _EDIT };
    }
  },

  data() {
    return { rows: null, secretTo: null };
  }
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <div v-else-if="secretTo">
    We don't support the current route format stored in alertmanager.yaml. Click
    <nuxt-link :to="secretTo">
      here
    </nuxt-link> to update manually.
  </div>
  <ResourceTable v-else :schema="schema" :rows="rows" />
</template>
