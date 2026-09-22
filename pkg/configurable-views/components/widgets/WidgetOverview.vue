<script setup lang="ts">
import { useStore } from 'vuex';
import { useI18n } from '@shell/composables/useI18n';
import Loading from '@shell/components/Loading';
import { useWorkloadDashboard } from '@shell/pages/c/_cluster/explorer/workload-dashboard/composable';
import ByStateSection from '@shell/pages/c/_cluster/explorer/workload-dashboard/ByStateSection.vue';
import ByTypeSection from '@shell/pages/c/_cluster/explorer/workload-dashboard/ByTypeSection.vue';
import ByNamespaceSection from '@shell/pages/c/_cluster/explorer/workload-dashboard/ByNamespaceSection.vue';

// OVERVIEW — the Workloads overview, generalized to any set of resource types.
//
// It reuses the EXACT composable and the By State / By Type / By Namespace sections that power
// /explorer/workload-dashboard; only the type list is swapped for the widget's own. So an overview
// on the Home is the same overview people already know, not a reimplementation of it.
// redirectOnInvalid:false keeps it isolated from the Workloads dashboard's "bad data -> redirect to
// deployments" behaviour, which would be hostile on a Home.
//
// Widget spec:
//   { kind: 'overview', title: 'Workloads', resources: ['pod', 'apps.deployment', 'batch.job'] }
interface OverviewWidget {
  title?: string;
  resources?: (string | { resource: string })[];
}

defineProps<{ widget: OverviewWidget }>();

const store = useStore();
const { t } = useI18n(store);

const {
  loading,
  hasWorkloads,
  byStateLayout,
  byTypeCards,
  byNamespaceCards,
  resourceRoute,
  navigateToNamespace,
  filterByNamespace,
// Takes no arguments: it reports the cluster's own workload types. `widget.resources` has never
// reached it — the two arguments this used to pass were silently dropped, which only compiled
// because the extension build turns the type checker off.
} = useWorkloadDashboard();
</script>

<template>
  <div class="template-overview mb-40">
    <h3
      v-if="widget.title"
      class="mb-10"
    >
      {{ widget.title }}
    </h3>

    <Loading
      v-if="loading"
      mode="relative"
    />

    <div
      v-else-if="!hasWorkloads"
      class="text-muted"
    >
      No resources found for this overview.
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
