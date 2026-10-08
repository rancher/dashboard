<script setup lang="ts">
import { useStore } from 'vuex';
import { useI18n } from '@shell/composables/useI18n';
import StatusSummaryCardSection from '@shell/components/Resource/Detail/Card/StatusSummaryCard/StatusSummaryCardSection.vue';
import SubtleLink from '@shell/components/SubtleLink.vue';
import type { OverviewStatusCard } from './types';

/**
 * A titled grid of status cards, shared by the Issuers and ACME sections. Unlike the workload
 * dashboard, cert-manager lists a type even when it has no resources, so empty cards get a message
 * and an optional create link.
 */
defineProps<{
  title: string;
  cards: OverviewStatusCard[];
  testid?: string;
}>();

const { t } = useI18n(useStore());
</script>

<template>
  <StatusSummaryCardSection
    :title="title"
    :cards="cards"
    :columns="2"
    :data-testid="testid"
  >
    <template #empty="{ card }">
      <div class="empty">
        <span class="text-muted">{{ card.emptyLabel || t('certManager.overview.noneOfType') }}</span>
        <SubtleLink
          v-if="card.createAction"
          :to="card.createAction.to"
        >
          {{ card.createAction.label }}
        </SubtleLink>
      </div>
    </template>
  </StatusSummaryCardSection>
</template>

<style lang="scss" scoped>
.empty {
  display: flex;
  align-items: baseline;
  gap: var(--gap);
  line-height: 24px;
}
</style>
