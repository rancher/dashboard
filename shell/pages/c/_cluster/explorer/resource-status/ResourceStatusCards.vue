<script setup lang="ts">
import { computed } from 'vue';
import { useStore } from 'vuex';
import { NODE, WORKLOAD_TYPES } from '@shell/config/types';
import { useI18n } from '@shell/composables/useI18n';
import ResourceStatusWidget from '@shell/components/ResourceStatusWidget/index.vue';
import type { ResourceStatusSummaryWidgetConfig, ResourceStatusBreakdownWidgetConfig } from '@shell/components/ResourceStatusWidget/types';
import { WORKLOAD_DASHBOARD_RESOURCE_TYPES } from '../workload-dashboard/types';

const store = useStore();
const { t } = useI18n(store);

const SUMMARY_WIDGETS: ResourceStatusSummaryWidgetConfig[] = [
  { kind: 'summary', resource: NODE },
  { kind: 'summary', resource: WORKLOAD_TYPES.DEPLOYMENT },
];

const unhealthyWorkloadsWidget = computed<ResourceStatusBreakdownWidgetConfig>(() => ({
  kind:      'breakdown',
  title:     t('clusterIndexPage.resourceStatus.unhealthy.title'),
  resources: WORKLOAD_DASHBOARD_RESOURCE_TYPES.filter((type) => type !== WORKLOAD_TYPES.DEPLOYMENT),
  colors:    ['error', 'warning'],
}));
</script>

<template>
  <div
    class="resource-status-cards"
    data-testid="cluster-dashboard-resource-status"
  >
    <ResourceStatusWidget
      v-for="config in SUMMARY_WIDGETS"
      :key="config.resource"
      :config="config"
    />
    <ResourceStatusWidget :config="unhealthyWorkloadsWidget">
      <template #empty>
        <span class="text-deemphasized">{{ t('clusterIndexPage.resourceStatus.unhealthy.empty') }}</span>
      </template>
    </ResourceStatusWidget>
  </div>
</template>

<style lang="scss" scoped>
.resource-status-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: var(--gap-md);
  margin-top: 24px;
}
</style>
