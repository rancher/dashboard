<script setup lang="ts">
import { computed } from 'vue';
import { useStore } from 'vuex';
import { NODE, WORKLOAD_TYPES } from '@shell/config/types';
import { useI18n } from '@shell/composables/useI18n';
import ResourceStatusWidgetGroup from '@shell/components/ResourceStatusWidget/ResourceStatusWidgetGroup.vue';
import type { ResourceStatusWidgetGroupConfig } from '@shell/components/ResourceStatusWidget/types';
import { WORKLOAD_DASHBOARD_RESOURCE_TYPES } from '../workload-dashboard/types';

const store = useStore();
const { t } = useI18n(store);

const group = computed<ResourceStatusWidgetGroupConfig>(() => ({
  kind:    'group',
  widgets: [
    { kind: 'summary', resource: NODE },
    { kind: 'summary', resource: WORKLOAD_TYPES.DEPLOYMENT },
    {
      kind:      'breakdown',
      title:     t('clusterIndexPage.resourceStatus.unhealthy.title'),
      resources: WORKLOAD_DASHBOARD_RESOURCE_TYPES.filter((type) => type !== WORKLOAD_TYPES.DEPLOYMENT),
      colors:    ['error', 'warning'],
    },
  ],
}));
</script>

<template>
  <ResourceStatusWidgetGroup
    :config="group"
    class="resource-status-cards"
    data-testid="cluster-dashboard-resource-status"
  >
    <template #empty="{ config }">
      <span
        v-if="config.kind === 'breakdown'"
        class="text-deemphasized"
      >{{ t('clusterIndexPage.resourceStatus.unhealthy.empty') }}</span>
    </template>
  </ResourceStatusWidgetGroup>
</template>

<style lang="scss" scoped>
.resource-status-cards {
  margin-top: 24px;
}
</style>
