<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue';
import { useStore } from 'vuex';
import { useI18n } from '@shell/composables/useI18n';
import AlertTable from '@shell/components/AlertTable.vue';
import SortableTable from '@shell/components/SortableTable/index.vue';
import { useWidgetCluster, useOpenCluster, NO_CLUSTER } from '../../composables/useWidgetCluster';
import { fetchAlerts, fetchMonitoring, type Alert } from '../../templating/widget-data';
import type { WidgetSpec } from '../../templating/types';

// ALERTS — a cluster's firing alerts: the Alerts tab of its dashboard, as the dashboard draws it.
//
// The dashboard shows that tab only when the cluster has Rancher's monitoring, and so does this; on a
// cluster without it the widget says so rather than showing an empty table.
//
// On the cluster Rancher has open this IS the dashboard's AlertTable. That component asks the open
// cluster's Alertmanager, so for any other cluster the widget asks that cluster's Alertmanager itself
// - the same request through Rancher's proxy - and draws the answer in the same table, with the same
// columns, order and paging, polled as often.

const POLL_MS = 30000;

const props = defineProps<{ widget: WidgetSpec }>();

const store = useStore();
const { t } = useI18n(store);
const { cluster } = useWidgetCluster(() => props.widget);
const isOpen = useOpenCluster(cluster);

const monitoring = ref<boolean | null>(null);
const alerts = ref<Alert[]>([]);
const error = ref('');
let timer: ReturnType<typeof setInterval> | null = null;

// AlertTable's own columns.
const headers = [
  {
    name: 'severity', labelKey: 'monitoring.overview.alertsList.severity.label', value: 'labels.severity', sort: ['labels.severity', 'labels.alertname'], width: 125
  },
  {
    name: 'name', labelKey: 'generic.name', value: 'labels.alertname', sort: ['labels.alertname', 'labels.severity']
  },
  {
    name: 'message', labelKey: 'monitoring.overview.alertsList.message.label', value: 'annotations', formatter: 'RunBookLink', sort: ['annotations.message', 'labels.alertname', 'labels.severity']
  },
];

function stop(): void {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}

async function loadAlerts(id: string): Promise<void> {
  try {
    alerts.value = await fetchAlerts(store, id);
    error.value = '';
  } catch (e) {
    error.value = `Could not read the alerts of cluster “${ id }”.`;
  }
}

watch([cluster, isOpen], async([id, open]) => {
  stop();
  monitoring.value = null;
  alerts.value = [];
  error.value = '';

  if (!id) {
    return;
  }

  monitoring.value = (await fetchMonitoring(store, id)).installed;

  // The open cluster's alerts are the stock table's to read.
  if (monitoring.value && !open) {
    await loadAlerts(id);
    timer = setInterval(() => loadAlerts(id), POLL_MS);
  }
}, { immediate: true });

onBeforeUnmount(stop);
</script>

<template>
  <div class="wstock">
    <h3
      v-if="widget.title"
      class="wstock__title"
    >
      {{ widget.title }}
    </h3>

    <p
      v-if="!cluster"
      class="wstock__msg"
    >
      {{ NO_CLUSTER }}
    </p>
    <p
      v-else-if="monitoring === false"
      class="wstock__msg"
    >
      {{ t('clusterIndexPage.sections.alerts.label') }} come from Rancher's monitoring, which this cluster does not have.
    </p>
    <p
      v-else-if="error"
      class="wstock__msg wstock__msg--error"
    >
      {{ error }}
    </p>

    <template v-else-if="monitoring">
      <AlertTable v-if="isOpen" />
      <SortableTable
        v-else
        :rows="alerts"
        :headers="headers"
        :search="false"
        :table-actions="false"
        :row-actions="false"
        :paging="true"
        :rows-per-page="10"
        default-sort-by="name"
        key-field="fingerprint"
      />
    </template>
  </div>
</template>

<style lang="scss" scoped>
.wstock {
  min-width: 0;

  &__title {
    font-size:   18px;
    font-weight: 600;
    line-height: 22px;
    margin:      0 0 12px;
  }

  &__msg {
    color:     var(--muted);
    font-size: 14px;
    margin:    0;

    &--error {
      color: var(--error);
    }
  }
}
</style>
