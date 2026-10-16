<script lang="ts">
import { computed, defineAsyncComponent } from 'vue';
import { useStore } from 'vuex';
import { NAME as EXPLORER } from '@shell/config/product/explorer';
import { canViewResource } from '@shell/utils/auth';

// Loaded when first used, formatters are all registered when the app starts
const ResourcePopover = defineAsyncComponent(() => import('@shell/components/Resource/Detail/ResourcePopover/index.vue'));

/**
 * Like LinkName for a resource that isn't namespaced, but the link also opens a popover with the details of the resource.
 * The resource is only fetched when the user hovers or focuses the link, so it can be used in a table
 */
export interface Props {
  /**
   * The name of the resource
   */
  value?: string;
  type: string;
}
</script>

<script setup lang="ts">
// A table also passes the row, column and other values that shouldn't end up as attributes on the link
defineOptions({ inheritAttrs: false });

const props = withDefaults(defineProps<Props>(), { value: '' });
const store = useStore();

// The same route as LinkName
const detailLocation = computed(() => ({
  name:   'c-cluster-product-resource-id',
  params: {
    cluster:  store.getters['clusterId'],
    product:  store.getters['productId'] || EXPLORER,
    resource: props.type,
    id:       props.value,
  }
}));

const canView = computed(() => canViewResource(store, props.type));
</script>

<template>
  <!-- A lazy popover only knows the state of the resource once it's opened, so the state isn't shown next to the name -->
  <ResourcePopover
    v-if="props.value && canView"
    :id="props.value"
    :type="props.type"
    :name="props.value"
    :detail-location="detailLocation"
    :show-status="false"
    lazy
    wrap-name
  />
  <span v-else-if="props.value">{{ props.value }}</span>
</template>

