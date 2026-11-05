<script setup lang="ts">
import { computed } from 'vue';
import { useStore } from 'vuex';
import Endpoints from '@shell/components/formatter/Endpoints.vue';
import { useI18n } from '@shell/composables/useI18n';
import { useFetch } from '@shell/components/Resource/Detail/FetchLoader/composables';

/**
 * Shows the endpoints of a workload in its popover card: the public endpoints the same way as the Endpoints column of
 * workload lists, then the Gateway API endpoints with the links the workload detail page shows.
 *
 * What the Gateway API endpoints are worked out from is fetched when this is shown, because it often isn't in the store.
 * Avoid it in lists, where every row would fetch it
 */
export interface Props {
  /**
   * The publicEndpoints annotation of the workload
   */
  value?: string;
  /**
   * The workload
   */
  row: any;
  col?: object;
}

const props = withDefaults(defineProps<Props>(), { value: undefined, col: () => ({}) });
const store = useStore();
const i18n = useI18n(store);
const fetch = useFetch(async() => await props.row.fetchGatewayEndpointResources?.());

const hasPublicEndpoints = computed(() => !!props.row.publicEndpoints?.length);
const gatewayEndpoints = computed<{ link: string, linkDisplay: string }[]>(() => (fetch.value.loading ? [] : props.row.glanceGatewayEndpoints || []));
</script>

<template>
  <span>
    <!-- The annotation is only passed on when it's valid, the Endpoints formatter doesn't handle malformed JSON -->
    <Endpoints
      v-if="hasPublicEndpoints"
      :value="props.value"
      :row="props.row"
      :col="props.col"
    />
    <i
      v-if="fetch.loading"
      class="icon icon-spinner icon-spin"
      role="status"
      :aria-label="i18n.t('component.resource.detail.glance.ariaLabel.loading')"
    />
    <template v-else>
      <a
        v-for="endpoint in gatewayEndpoints"
        :key="endpoint.link"
        class="block gateway-endpoint"
        :href="endpoint.link"
        target="_blank"
        rel="nofollow noopener noreferrer"
      >{{ endpoint.linkDisplay }}</a>
      <span v-if="!hasPublicEndpoints && !gatewayEndpoints.length">—</span>
    </template>
  </span>
</template>

<style lang="scss" scoped>
// Hostnames are often longer than the card is wide
.gateway-endpoint {
  overflow-wrap: anywhere;
}
</style>
