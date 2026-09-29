<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useStore } from 'vuex';
import { useI18n } from '@shell/composables/useI18n';
import LiveDate from '@shell/components/formatter/LiveDate.vue';
import ConfigBadge from '@shell/pages/c/_cluster/explorer/ConfigBadge.vue';
import WidgetCard from './WidgetCard.vue';
import { useWidgetCluster, NO_CLUSTER } from '../../composables/useWidgetCluster';
import { CATALOG } from '@shell/config/types';
import { fetchManagementCluster, fetchClusterCounts } from '../../templating/widget-data';
import type { WidgetSpec } from '../../templating/types';

// CLUSTER HEADER — the top of a cluster's dashboard: its name and description, then the "glance"
// row of provider, Kubernetes version, architecture and age, with the config badge at the end.
//
// The same fields the dashboard reads from its `currentCluster`, read here from the management
// cluster the widget names - so it can sit on the Home, or show a cluster other than the one open.
// Titled with the cluster's name rather than the page's "Cluster Dashboard", because on a Home with
// several of them that name is the whole point.

const props = defineProps<{ widget: WidgetSpec }>();

const store = useStore();
const { t } = useI18n(store);
const { cluster } = useWidgetCluster(() => props.widget);

// On a cluster's own dashboard the heading is the dashboard's, as the stock page has it; a header
// that names its cluster - on the Home, or pointed at another - is headed by that cluster's name.
const followsPage = computed(() => !props.widget.cluster);

// The management cluster model (shell/models/management.cattle.io.cluster), whose getters the
// dashboard's own header reads.
interface MgmtCluster {
  id: string;
  nameDisplay: string;
  provisionerDisplay?: string;
  kubernetesVersionBase?: string;
  kubernetesVersionExtension?: string;
  architecture?: { label: string; tooltip?: string };
  canUpdate?: boolean;
  spec?: { description?: string };
  metadata?: { creationTimestamp?: string };
}

const mgmt = ref<MgmtCluster | null>(null);
const counts = ref<Record<string, unknown>>({});
const error = ref('');

// The dashboard links to Cluster Tools for someone who can list both chart repos and apps. It asks
// the open cluster's store; a cluster's counts hold exactly the types the user can list in it, so
// here they answer the same question for the cluster this widget names.
const showClusterTools = computed(() => !!counts.value[CATALOG.CLUSTER_REPO] && !!counts.value[CATALOG.APP]);

watch(cluster, async(id) => {
  mgmt.value = null;
  error.value = '';

  if (!id) {
    return;
  }

  try {
    [mgmt.value, counts.value] = await Promise.all([
      fetchManagementCluster<MgmtCluster>(store, id),
      fetchClusterCounts(store, id).catch(() => ({})),
    ]);
  } catch (e) {
    error.value = t('configurableViews.errors.cluster', { cluster: id });
  }
}, { immediate: true });
</script>

<template>
  <WidgetCard
    v-if="!cluster || error"
    :title="widget.title"
    :error="error || t(NO_CLUSTER)"
  />
  <section
    v-else-if="mgmt"
    class="wch"
  >
    <div class="wch__title">
      <h1>{{ widget.title || (followsPage ? t('clusterIndexPage.header') : mgmt.nameDisplay) }}</h1>
      <div
        v-if="mgmt.spec?.description"
        class="wch__description"
      >
        {{ mgmt.spec.description }}
      </div>
    </div>
    <div class="wch__glance">
      <div>
        <label>{{ t('glance.provider') }}: </label>
        <span>{{ mgmt.provisionerDisplay }}</span>
      </div>
      <div>
        <label>{{ t('glance.version') }}: </label>
        <span>{{ `${ mgmt.kubernetesVersionBase || '' }${ mgmt.kubernetesVersionExtension || '' }` }}</span>
      </div>
      <div v-if="mgmt.architecture">
        <label>{{ t('glance.architecture') }}: </label>
        <span v-clean-tooltip="mgmt.architecture.tooltip">{{ mgmt.architecture.label }}</span>
      </div>
      <div>
        <label>{{ t('glance.created') }}: </label>
        <span>
          <LiveDate
            :value="mgmt.metadata?.creationTimestamp"
            :add-suffix="true"
            :show-tooltip="true"
          />
        </span>
      </div>
      <div :style="{ flex: 1 }" />
      <div v-if="showClusterTools">
        <router-link
          :to="{ name: 'c-cluster-explorer-tools', params: { cluster } }"
          class="cluster-tools-link"
          role="link"
          :aria-label="t('nav.clusterTools')"
        >
          <span>{{ t('nav.clusterTools') }}</span>
        </router-link>
      </div>
      <ConfigBadge
        v-if="mgmt.canUpdate"
        :cluster="mgmt"
      />
    </div>
  </section>
</template>

<style lang="scss" scoped>
// The dashboard's own header rules (shell/pages/c/_cluster/explorer/index.vue), which are scoped to
// that page and so do not reach a widget.
.wch__title {
  h1 {
    margin: 0 0 10px;
  }
}

.wch__description {
  margin: 5px 0;
  opacity: 0.7;
}

.wch__glance {
  align-items: center;
  border-bottom: 1px solid var(--border);
  border-top: 1px solid var(--border);
  display: flex;
  padding: 10px 0;

  & > *:not(:nth-last-child(-n+2)) {
    margin-right: 40px;

    & span {
      font-weight: bold;
    }
  }
}
</style>
