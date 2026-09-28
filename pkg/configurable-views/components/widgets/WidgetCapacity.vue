<script setup lang="ts">
import { ref, watch } from 'vue';
import { useStore } from 'vuex';
import { useI18n } from '@shell/composables/useI18n';
import HardwareResourceGauge from '@shell/components/HardwareResourceGauge.vue';
import WidgetCard from './WidgetCard.vue';
import { useWidgetCluster, NO_CLUSTER } from '../../composables/useWidgetCluster';
import { fetchClusterCapacity } from '../../templating/widget-data';
import type { WidgetSpec } from '../../templating/types';

// CAPACITY — a cluster's pods, CPU and memory: reserved against what it can allocate, and live
// usage where the cluster has a metrics server. The dashboard's own HardwareResourceGauge, three of
// them, under the dashboard's own heading, with the dashboard's own arithmetic (fetchClusterCapacity)
// run against the cluster this widget names.

const props = defineProps<{ widget: WidgetSpec }>();

const store = useStore();
const { t } = useI18n(store);
const { cluster } = useWidgetCluster(() => props.widget);

interface Gauge { total: number; useful: number; units?: string }
interface Capacity {
  hasStats: boolean;
  pods: Gauge;
  cores: Gauge;
  memory: Gauge;
  cpuUsed: Gauge | null;
  ramUsed: Gauge | null;
}

const capacity = ref<Capacity | null>(null);
const error = ref('');

watch(cluster, async(id) => {
  capacity.value = null;
  error.value = '';

  if (!id) {
    return;
  }

  try {
    const c = await fetchClusterCapacity(store, id);
    const cores = (g: Gauge | null) => g && { ...g, units: t('clusterIndexPage.hardwareResourceGauge.units.cores', { count: g.total }) };

    capacity.value = {
      ...c, cores: cores(c.cores) as Gauge, cpuUsed: cores(c.cpuUsed)
    };
  } catch (e) {
    error.value = `Could not read the capacity of cluster “${ id }”.`;
  }
}, { immediate: true });
</script>

<template>
  <WidgetCard
    v-if="!cluster || error"
    :title="widget.title"
    :error="error || NO_CLUSTER"
  />
  <div v-else-if="capacity?.hasStats">
    <h3>{{ widget.title || t('clusterIndexPage.sections.capacity.label') }}</h3>
    <div class="hardware-resource-gauges">
      <HardwareResourceGauge
        :name="t('clusterIndexPage.hardwareResourceGauge.pods')"
        :used="capacity.pods"
      />
      <HardwareResourceGauge
        :name="t('clusterIndexPage.hardwareResourceGauge.cores')"
        :reserved="capacity.cores"
        :used="capacity.cpuUsed ?? undefined"
        :units="capacity.cores.units"
      />
      <HardwareResourceGauge
        :name="t('clusterIndexPage.hardwareResourceGauge.ram')"
        :reserved="capacity.memory"
        :used="capacity.ramUsed ?? undefined"
        :units="capacity.memory.units"
      />
    </div>
  </div>
  <WidgetCard
    v-else-if="capacity"
    :title="widget.title || t('clusterIndexPage.sections.capacity.label')"
    empty
    empty-text="This cluster reports no capacity yet."
  />
</template>
