<script setup lang="ts">
import { useStore } from 'vuex';
import { useI18n } from '@shell/composables/useI18n';
import Loading from '@shell/components/Loading';
import ByStateSection from '@shell/pages/c/_cluster/explorer/workload-dashboard/ByStateSection.vue';
import ByTypeSection from '@shell/pages/c/_cluster/explorer/workload-dashboard/ByTypeSection.vue';
import ByNamespaceSection from '@shell/pages/c/_cluster/explorer/workload-dashboard/ByNamespaceSection.vue';
import { useWidgetCluster, NO_CLUSTER } from '../../composables/useWidgetCluster';
import { useClusterOverview } from '../../composables/useClusterOverview';
import type { WidgetSpec } from '../../templating/types';

// OVERVIEW — a cluster's workloads by state, by type and by namespace: the Workloads overview's cards.
//
// The cards are the overview's own sections (explorer/workload-dashboard), drawn as they are. What
// feeds them is read from the cluster this widget names - or the page's, when it names none - rather
// than from the open cluster the overview's own composable is tied to (see useClusterOverview). So
// the same widget shows each cluster on its own dashboard, and any one cluster on the Home.

const props = defineProps<{ widget: WidgetSpec }>();

const store = useStore();
const { t } = useI18n(store);
const { cluster } = useWidgetCluster(() => props.widget);

const {
  loading,
  error,
  hasWorkloads,
  byStateLayout,
  byTypeCards,
  byNamespaceCards,
  resourceRoute,
  navigateToNamespace,
  filterByNamespace,
} = useClusterOverview(cluster);
</script>

<template>
  <div class="template-overview mb-40">
    <h3
      v-if="widget.title"
      class="mb-10"
    >
      {{ widget.title }}
    </h3>

    <p
      v-if="!cluster"
      class="text-muted m-0"
    >
      {{ t(NO_CLUSTER) }}
    </p>

    <Loading
      v-else-if="loading"
      mode="relative"
    />

    <p
      v-else-if="error"
      class="text-error m-0"
    >
      {{ error }}
    </p>

    <div
      v-else-if="!hasWorkloads"
      class="text-muted"
    >
      {{ t('workloadDashboard.empty.title') }}
    </div>

    <div
      v-else
      class="overview-content"
    >
      <div class="section">
        <h4 class="m-0 text-deemphasized">
          {{ t('workloadDashboard.sections.byState') }}
        </h4>
        <ByStateSection
          :layout="byStateLayout"
          :resource-route="resourceRoute"
        />
      </div>

      <div class="section">
        <h4 class="m-0 text-deemphasized">
          {{ t('workloadDashboard.sections.byType') }}
        </h4>
        <ByTypeSection
          :cards="byTypeCards"
          :resource-route="resourceRoute"
        />
      </div>

      <div class="section">
        <h4 class="m-0 text-deemphasized">
          {{ t('workloadDashboard.sections.byNamespace') }}
        </h4>
        <ByNamespaceSection
          :cards="byNamespaceCards"
          :navigate-to-namespace="navigateToNamespace"
          :filter-by-namespace="filterByNamespace"
        />
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.template-overview {
  .overview-content {
    display:        flex;
    flex-direction: column;
    gap:            24px;
  }

  .section {
    display:        flex;
    flex-direction: column;
    gap:            16px;
  }

  h3 {
    font-weight: 600;
  }
}
</style>
