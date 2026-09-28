<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { useStore } from 'vuex';
import { useI18n } from '@shell/composables/useI18n';
import { Banner } from '@components/Banner';
import DashboardMetrics from '@shell/components/DashboardMetrics.vue';
import DashboardOptions from '@shell/components/DashboardOptions.vue';
import EtcdInfoBanner from '@shell/components/EtcdInfoBanner.vue';
import { computeDashboardUrl, hasLeader, leaderChanges, failedProposals } from '@shell/utils/grafana';
import ClusterGrafana from './ClusterGrafana.vue';
import { useWidgetCluster, useOpenCluster, NO_CLUSTER } from '../../composables/useWidgetCluster';
import { METRICS_DASHBOARDS, fetchMonitoring } from '../../templating/widget-data';
import type { WidgetSpec } from '../../templating/types';

// METRICS — one of a cluster's Grafana dashboards: the Cluster Metrics, Kubernetes Components or
// etcd tab of its dashboard, as the dashboard draws it. Like the dashboard, it has something to show
// only when the cluster has Rancher's monitoring.
//
// On the cluster Rancher has open this IS the dashboard's DashboardMetrics - its range, refresh and
// detail/summary options over the embedded Grafana, and for etcd the leader / proposals banner.
// Those components build their URLs from the open cluster, so for any other cluster the widget puts
// the same pieces together itself: the same options, the same Grafana URL for THAT cluster, and the
// same etcd figures asked of that cluster's Prometheus.

const props = defineProps<{ widget: WidgetSpec }>();

const store = useStore();
const { t } = useI18n(store);
const { cluster } = useWidgetCluster(() => props.widget);
const isOpen = useOpenCluster(cluster);

const board = computed(() => METRICS_DASHBOARDS[props.widget.metrics || 'cluster']);
const isEtcd = computed(() => props.widget.metrics === 'etcd');

const monitoring = ref<{ installed: boolean; version: string } | null>(null);

// DashboardMetrics' own defaults, edited in place by DashboardOptions as they are there.
const graphOptions = reactive({
  range: '5m', refreshRate: '30s', type: 'detail'
});

const theme = computed<string>(() => store.getters['prefs/theme']);
const background = computed(() => (theme.value === 'dark' ? '#2e3035' : '#f3f4f9'));

// The URL GrafanaDashboard would build, for this cluster rather than the open one.
const frameUrl = computed(() => {
  const embed = graphOptions.type === 'detail' ? board.value.detailUrl : board.value.summaryUrl;

  return computeDashboardUrl(monitoring.value?.version || '', embed, cluster.value, {
    from: `now-${ graphOptions.range }`, to: 'now', refresh: graphOptions.refreshRate, theme: theme.value
  });
});

// The etcd banner's three figures (EtcdInfoBanner reads them from the open cluster).
const etcd = ref<{ leader: string; changes: string | number; failed: string | number } | null>(null);

// The shell's queries ask the `cluster` store; for another cluster the same URL goes through the
// management store, which reaches every cluster through Rancher's proxy.
const viaManagement = (_action: string, opts: object) => store.dispatch('management/request', opts);

async function loadEtcd(id: string, version: string): Promise<void> {
  try {
    const [leader, changes, failed] = await Promise.all([
      hasLeader(version, viaManagement, id), leaderChanges(version, viaManagement, id), failedProposals(version, viaManagement, id),
    ]);

    etcd.value = {
      leader: leader ? 'Yes' : 'No', changes, failed
    };
  } catch (e) {
    etcd.value = null;
  }
}

watch([cluster, isOpen, isEtcd], async([id, open, wantsEtcd]) => {
  monitoring.value = null;
  etcd.value = null;

  if (!id) {
    return;
  }

  monitoring.value = await fetchMonitoring(store, id);

  if (monitoring.value.installed && !open && wantsEtcd) {
    await loadEtcd(id, monitoring.value.version);
  }
}, { immediate: true });
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
      {{ t(NO_CLUSTER) }}
    </p>
    <p
      v-else-if="monitoring && !monitoring.installed"
      class="wstock__msg"
    >
      {{ t('configurableViews.widget.noMonitoring', { what: t(board.labelKey) }) }}
    </p>

    <template v-else-if="monitoring">
      <DashboardMetrics
        v-if="isOpen"
        :class="{ 'etcd-metrics': isEtcd }"
        :detail-url="board.detailUrl"
        :summary-url="board.summaryUrl"
        :graph-height="board.graphHeight"
      >
        <EtcdInfoBanner v-if="isEtcd" />
      </DashboardMetrics>

      <div
        v-else
        class="wstock__metrics"
      >
        <div class="wstock__options mb-10">
          <DashboardOptions :value="graphOptions" />
        </div>
        <Banner
          v-if="isEtcd && etcd"
          class="wstock__etcd"
          color="info"
        >
          <div class="wstock__datum">
            <label>{{ t('etcdInfoBanner.hasLeader') }}</label> {{ etcd.leader }},
          </div>
          <div class="wstock__datum">
            <label>{{ t('etcdInfoBanner.leaderChanges') }}</label> {{ etcd.changes }},
          </div>
          <div class="wstock__datum">
            <label>{{ t('etcdInfoBanner.failedProposals') }}</label> {{ etcd.failed }}
          </div>
        </Banner>
        <div
          class="wstock__graphs"
          :class="{ 'wstock__graphs--etcd': isEtcd && etcd }"
          :style="{ height: board.graphHeight }"
        >
          <ClusterGrafana
            :url="frameUrl"
            :background-color="background"
          />
        </div>
      </div>
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
  }

  // The dashboard's etcd tab pulls the Grafana link up beside its banner.
  .etcd-metrics :deep() .external-link {
    top: -107px;
  }

  // EtcdInfoBanner's layout, for the same banner drawn here.
  &__etcd {
    align-items:     center;
    display:         flex;
    justify-content: space-evenly;
  }

  &__datum {
    margin-right: 5px;
    text-align:   center;
  }

  &__etcd :deep() label {
    color: var(--info);
  }

  &__graphs {
    position: relative;

    // Past the etcd banner, as the dashboard places it.
    &--etcd :deep() .cgraf__link {
      top: -107px;
    }
  }
}
</style>
