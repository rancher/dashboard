<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useStore } from 'vuex';
import { useI18n } from '@shell/composables/useI18n';
import ResourceSummary from '@shell/components/ResourceSummary.vue';
import { NODE, WORKLOAD_TYPES } from '@shell/config/types';
import { NAME as EXPLORER } from '@shell/config/product/explorer';
import WidgetCard from './WidgetCard.vue';
import { useWidgetCluster, NO_CLUSTER } from '../../composables/useWidgetCluster';
import { fetchClusterCounts, summarizeCounts, totalCounts } from '../../templating/widget-data';
import type { WidgetSpec } from '../../templating/types';

// RESOURCE CARDS — the row under a cluster dashboard's header: Total Resources, Nodes, Deployments.
//
// Drawn by the dashboard's own ResourceSummary. On the dashboard it reads its counts from the
// `cluster` store, which holds only the cluster that is open; here they come from the named
// cluster's own counts, through ResourceSummary's `spoofedCounts` - the prop the dashboard itself
// uses for the Total card. Same card, same numbers, any cluster.

const props = defineProps<{ widget: WidgetSpec }>();

const store = useStore();
const { t } = useI18n(store);
const { cluster } = useWidgetCluster(() => props.widget);

type Counts = Record<string, { summary?: { count?: number; states?: Record<string, number> } }>;

const counts = ref<Counts | null>(null);
const error = ref('');

watch(cluster, async(id) => {
  counts.value = null;
  error.value = '';

  if (!id) {
    return;
  }

  try {
    counts.value = await fetchClusterCounts(store, id);
  } catch (e) {
    error.value = `Could not read the counts of cluster “${ id }”.`;
  }
}, { immediate: true });

// A card for one type, linking to that type's list in the widget's cluster.
function card(resource: string) {
  const summary = summarizeCounts(counts.value, resource);

  return {
    ...summary,
    name:     store.getters['i18n/withFallback'](`typeLabel."${ resource }"`, { count: summary.useful }, resource),
    location: {
      name:   'c-cluster-product-resource',
      params: {
        cluster: cluster.value, product: EXPLORER, resource
      },
    },
  };
}

const cards = computed(() => {
  if (!counts.value) {
    return [];
  }

  // The dashboard shows Nodes and Deployments only to someone who can see them; the counts carry
  // exactly the types this user can list, so a type missing from them is the same answer.
  return [
    { ...totalCounts(store.getters, counts.value), name: t('clusterIndexPage.resourceGauge.totalResources') },
    ...[NODE, WORKLOAD_TYPES.DEPLOYMENT].filter((type) => counts.value?.[type]).map(card),
  ];
});
</script>

<template>
  <WidgetCard
    v-if="!cluster || error"
    :title="widget.title"
    :error="error || NO_CLUSTER"
  />
  <div
    v-else
    class="resource-gauges"
  >
    <ResourceSummary
      v-for="entry in cards"
      :key="entry.name"
      :spoofed-counts="entry"
    />
  </div>
</template>
