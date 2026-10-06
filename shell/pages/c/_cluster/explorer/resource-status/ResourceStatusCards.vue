<script setup lang="ts">
import { computed } from 'vue';
import { useStore } from 'vuex';
import { useI18n } from '@shell/composables/useI18n';
import StatusSummaryCard from '@shell/components/Resource/Detail/Card/StatusSummaryCard/index.vue';
import StatusBreakdownCard from '@shell/components/Resource/Detail/Card/StatusBreakdownCard/index.vue';
import type { StatusSummaryCardItem } from '@shell/components/Resource/Detail/Card/StatusSummaryCard/types';
import { useClusterResourceStatus } from './composable';

const store = useStore();
const { t } = useI18n(store);

const {
  loaded, deploymentsCard, nodesCard, unhealthyRows
} = useClusterResourceStatus();

const summaryCards = computed(() => [deploymentsCard.value, nodesCard.value].filter((c): c is StatusSummaryCardItem => !!c));
</script>

<template>
  <div
    v-if="loaded"
    class="resource-status-cards"
    data-testid="cluster-dashboard-resource-status"
  >
    <StatusSummaryCard
      v-for="card in summaryCards"
      :key="card.key"
      :title="card.title"
      :total="card.total"
      :segments="card.segments"
      :rows="card.rows"
      :to="card.to"
    >
      <template #empty>
        <span class="text-deemphasized">{{ t('clusterIndexPage.resourceStatus.none') }}</span>
      </template>
    </StatusSummaryCard>
    <StatusBreakdownCard
      :title="t('clusterIndexPage.resourceStatus.unhealthy.title')"
      :rows="unhealthyRows"
    >
      <template #empty>
        <span class="text-deemphasized">{{ t('clusterIndexPage.resourceStatus.unhealthy.empty') }}</span>
      </template>
    </StatusBreakdownCard>
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
