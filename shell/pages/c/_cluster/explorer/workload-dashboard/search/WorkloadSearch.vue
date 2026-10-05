<script setup lang="ts">
import LabeledSelect from '@shell/components/form/LabeledSelect.vue';
import StateDot from '@shell/components/StateDot/index.vue';
import LiveDate from '@shell/components/formatter/LiveDate.vue';
import ActionMenu from '@shell/components/ActionMenuShell.vue';
import { useI18n } from '@shell/composables/useI18n';
import { useStore } from 'vuex';
import { computed, ref } from 'vue';
import { useWorkloadSearch } from './useWorkloadSearch';
import { WORKLOAD_SEARCH_RESULTS_PER_TYPE, type WorkloadSearchOption } from './types';
import type { WorkloadDashboardNamespaceNavigateFn, WorkloadDashboardResourceRouteFn } from '../types';

const props = defineProps<{
  navigateToNamespace: WorkloadDashboardNamespaceNavigateFn;
  resourceRoute: WorkloadDashboardResourceRouteFn;
}>();

// One row for the group label, the results shown per type, plus half a row
// as a scroll affordance when there's more to see.
const dropdownVisibleRows = WORKLOAD_SEARCH_RESULTS_PER_TYPE;
// $rc-button-small-height (the action-menu button, the tallest thing in a
// result row) plus the row's own 8px top/bottom padding.
const dropdownVisibleRowHeight = 24 + 16;

const store = useStore();
const { t } = useI18n(store);

const {
  loading,
  options,
  onSearch,
  onSelect,
} = useWorkloadSearch();

const searchRef = ref<InstanceType<typeof LabeledSelect> | null>(null);

// Result types with no matches are skipped, so the first group in the
// flattened list isn't always the first entry in WORKLOAD_DASHBOARD_RESOURCE_TYPES -
// find it directly instead of assuming which type it'll be.
const firstGroupUniqueId = computed(() => options.value.find((option) => option.kind === 'group')?.uniqueId);

// Opening the row action menu moves DOM focus into its own menu container,
// which blurs the search input. On any such blur vue-select (used internally
// by LabeledSelect) both clears its search text and closes - and, since its
// option list is v-if'd, unmounts - which would wipe the results and destroy
// the action menu the instant it opens. Track that an action-menu click is in
// flight, and the last real search term, so the blur handler can put vue-
// select's internal state back before its next render/emit, keeping the
// results (and the action menu nested inside them) intact.
const openingActionMenu = ref(false);
const lastSearchTerm = ref('');

function isOptionSelectable(option: WorkloadSearchOption): boolean {
  return !option.kind;
}

function onNamespaceClick(event: MouseEvent, option: WorkloadSearchOption): void {
  // Prevent vue-select from treating this as selecting the option.
  event.stopPropagation();

  if (option.resource?.type && option.namespace) {
    props.navigateToNamespace(option.resource.type, option.namespace);
  }
}

function onMoreClick(event: MouseEvent, option: WorkloadSearchOption): void {
  // Prevent vue-select from treating this as selecting the option.
  event.stopPropagation();

  if (option.resourceType) {
    onSelect(props.resourceRoute(option.resourceType, undefined, option.searchTerm));
  }
}

function onActionsClick(event: MouseEvent) {
  // Prevent vue-select from treating this as selecting the option.
  event.stopPropagation();
  openingActionMenu.value = true;
}

function handleSearch(term: string): void {
  if (term) {
    lastSearchTerm.value = term;
  }
  onSearch(term);
}

function onSearchBlur() {
  if (!openingActionMenu.value) {
    return;
  }

  openingActionMenu.value = false;

  searchRef.value?.forceOpen(lastSearchTerm.value);
}

function onActionInvoked(): void {
  // The search input is already blurred (from opening the action menu), so
  // no further blur event will fire to close the dropdown on its own.
  searchRef.value?.forceClose();
}
</script>

<template>
  <LabeledSelect
    ref="searchRef"
    class="workload-search"
    :options="options"
    :searchable="true"
    :filterable="false"
    :append-to-body="false"
    :visible-rows="dropdownVisibleRows"
    :visible-row-height="dropdownVisibleRowHeight"
    :selectable="isOptionSelectable"
    option-key="uniqueId"
    :placeholder="t('workloadDashboard.search.placeholder')"
    data-testid="workload-dashboard-search"
    @search="handleSearch"
    @selecting="onSelect"
    @on-blur="onSearchBlur"
  >
    <template #option="option">
      <b
        v-if="option.kind === 'group'"
        class="group-label"
        :class="{ 'group-label--first': option.uniqueId === firstGroupUniqueId }"
      >{{ option.label }}</b>
      <span
        v-else-if="option.kind === 'more'"
        class="more-link more-row"
        role="button"
        @click="onMoreClick($event, option)"
      >{{ option.label }}</span>
      <div
        v-else
        class="workload-search-option"
      >
        <StateDot
          v-if="option.color"
          class="state-dot"
          :color="option.color"
        />
        <span class="name">{{ option.label }}</span>
        <div class="meta text-muted">
          <span
            v-if="option.namespace"
            class="namespace more-link"
            role="button"
            @click="onNamespaceClick($event, option)"
          >{{ option.namespace }}</span>
          <span
            v-else
            class="namespace"
          />
          <span class="restarts">{{ t('workloadDashboard.search.restarts', { count: option.resource?.restartCount || 0 }) }}</span>
          <LiveDate
            class="age"
            :value="option.resource?.creationTimestamp"
            :show-tooltip="false"
          />
        </div>
        <span
          class="actions"
          @click="onActionsClick"
        >
          <ActionMenu
            :resource="option.resource"
            button-size="small"
            :button-aria-label="t('sortableTable.tableActionsLabel', { resource: option.resource?.id || '' })"
            container="body"
            @action-invoked="onActionInvoked"
          />
        </span>
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
$row-padding-x: 16px;
$row-option-padding-x: $row-padding-x*2;
$row-margin-y: 8px;

.workload-search {
  width: 100%;
}

.group-label {
  display: block;
  padding: $row-margin-y $row-padding-x;
}

.workload-search-option {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: $row-margin-y $row-option-padding-x;

  .state-dot {
    flex-shrink: 0;
  }

  .name {
    // Basis 0 (not auto) so its share of free space is a pure function of
    // the grow ratio, not this row's own text length - otherwise .meta's
    // start position would shift row to row.
    flex: 3 1 0;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .meta {
    display: flex;
    align-items: center;
    // Basis 0 (not auto) for the same reason as .name - a nested flex
    // container's auto basis is computed from its children's own content
    // width, not their pixel flex-basis, so it would still vary by row.
    flex: 2 0 0;
    gap: 16px;
  }

  .namespace,
  .restarts,
  .age {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  // Grow proportionally to one another (ratio matches the min-widths) as
  // extra row space becomes available, without shrinking below them.
  .namespace {
    flex: 15 1 150px;
    min-width: 150px;
  }

  .restarts {
    flex: 9 1 90px;
    min-width: 90px;
    text-align: right;
  }

  .age {
    flex: 7 1 70px;
    min-width: 70px;
    text-align: right;
  }

  .actions {
    flex-shrink: 0;
    margin-left: 8px;
  }
}

.more-link {
  color: var(--link);
  cursor: pointer;
}

// Shares .more-link's color/cursor with the namespace link inside a result
// row, but as the standalone "+X more" row it also needs its own padding.
.more-row {
  display: block;
  padding: 0px $row-option-padding-x;
}
</style>
