<script setup lang="ts">
import LabeledSelect from '@shell/components/form/LabeledSelect.vue';
import { useI18n } from '@shell/composables/useI18n';
import { useStore } from 'vuex';
import { useWorkloadSearch } from './useWorkloadSearch';

const store = useStore();
const { t } = useI18n(store);

const {
  loading,
  options,
  onSearch,
  onSelect,
} = useWorkloadSearch();
</script>

<template>
  <LabeledSelect
    class="workload-search"
    :options="options"
    :searchable="true"
    :filterable="false"
    option-key="uniqueId"
    :placeholder="t('workloadDashboard.search.placeholder')"
    data-testid="workload-dashboard-search"
    @search="onSearch"
    @selecting="onSelect"
  >
    <template #option="option">
      <b v-if="option.kind === 'group'">{{ option.label }}</b>
      <div
        v-else
        class="workload-search-option"
      >
        <span>{{ option.label }}</span>
        <span
          v-if="option.namespace"
          class="text-muted"
        >{{ option.namespace }}</span>
      </div>
    </template>
    <template #no-options="{ search }">
      <span v-if="loading">{{ t('workloadDashboard.search.searching') }}</span>
      <span v-else-if="search">{{ t('labelSelect.noOptions.noMatch') }}</span>
      <span v-else>{{ t('workloadDashboard.search.startTyping') }}</span>
    </template>
  </LabeledSelect>
</template>

<style lang="scss" scoped>
.workload-search {
  // Match the width of one card in the By Namespace section's 3-column grid
  // (ByNamespaceSection.vue: grid-template-columns: repeat(3, 1fr); gap: 15px).
  width: calc((100% - 2 * 15px) / 3);
}

.workload-search-option {
  display: flex;
  justify-content: space-between;
  gap: 8px;

  span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}
</style>
