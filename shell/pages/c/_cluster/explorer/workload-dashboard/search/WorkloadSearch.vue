<script setup lang="ts">
import LabeledSelect from '@shell/components/form/LabeledSelect.vue';
import StateDot from '@shell/components/StateDot/index.vue';
import LiveDate from '@shell/components/formatter/LiveDate.vue';
import ActionMenu from '@shell/components/ActionMenuShell.vue';
import { useI18n } from '@shell/composables/useI18n';
import { useStore } from 'vuex';
import { useRouter, type RouteLocationRaw } from 'vue-router';
import { computed, ref } from 'vue';
import { useWorkloadSearch } from './useWorkloadSearch';
import { type WorkloadSearchOption } from './types';
import type { WorkloadDashboardNamespaceNavigateFn, WorkloadDashboardResourceRouteFn } from '../types';

const props = defineProps<{
  navigateToNamespace: WorkloadDashboardNamespaceNavigateFn;
  resourceRoute: WorkloadDashboardResourceRouteFn;
}>();


/**
 * How many how many workloads to show in the entire drop down
 *
 * One row for the group label + the results shown per type + plus half a row (so user see's theres more results)
 */
const dropdownVisibleRows = 14;

/**
 * height of a row
 *
 * $rc-button-small-height (the action-menu button, the tallest thing in a
 * result row) + plus the row's own $row-margin-y top and bottom padding.
 */
const dropdownVisibleRowHeight = 24 + 16;

const store = useStore();
const router = useRouter();
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

// "+X more" rows are selectable options (rather than buttons inside an option)
// so they're reachable with the arrow keys and Enter, like any other result.
function isOptionSelectable(option: WorkloadSearchOption): boolean {
  return option.kind !== 'group';
}

function optionRoute(option: WorkloadSearchOption) {
  if (option.kind === 'more' && option.resourceType) {
    return props.resourceRoute(option.resourceType, undefined, option.searchTerm);
  }

  return option.value;
}

function routeHref(route?: RouteLocationRaw): string | undefined {
  return route ? router.resolve(route).href : undefined;
}

// The page the namespace link leads to. Clicking it also sets the header
// namespace filter (see onNamespaceClick), which a plain href can't carry.
function namespaceHref(option: WorkloadSearchOption): string | undefined {
  return routeHref(props.resourceRoute(option.resource?.type));
}

function onNamespaceClick(event: MouseEvent, option: WorkloadSearchOption): void {
  // Prevent vue-select from treating this as selecting the option.
  event.stopPropagation();

  if (option.resource?.type && option.namespace) {
    props.navigateToNamespace(option.resource.type, option.namespace);
  }
}

function onActionsClick(event: MouseEvent) {
  // Prevent vue-select from treating this as selecting the option.
  event.stopPropagation();
  // Setting this on click is early enough: vue-select prevents the default
  // mousedown inside its dropdown, so the input keeps focus until the action
  // menu takes it after this click.
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
    :reduce="optionRoute"
    option-key="uniqueId"
    :placeholder="t('workloadDashboard.search.placeholder')"
    :aria-label="t('workloadDashboard.search.ariaLabel')"
    data-testid="workload-dashboard-search"
    @search="handleSearch"
    @update:value="onSelect"
    @on-blur="onSearchBlur"
  >
    <template #option="option">
      <b
        v-if="option.kind === 'group'"
        class="group-label"
        :class="{ 'group-label--first': option.uniqueId === firstGroupUniqueId }"
      >{{ option.label }}</b>
      <!-- The click carries on to vue-select, which selects the option like any other result -->
      <a
        v-else-if="option.kind === 'more'"
        class="workload-search-option more-link"
        :href="routeHref(optionRoute(option))"
        @click.prevent
      >{{ option.label }}</a>
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
          <a
            v-if="option.namespace && option.resource?.type"
            class="namespace more-link"
            :href="namespaceHref(option)"
            @click.prevent="onNamespaceClick($event, option)"
          >{{ option.namespace }}</a>
          <span
            v-else
            class="namespace"
          >{{ option.namespace }}</span>
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

  &.more-link {
    color: var(--link);
    cursor: pointer;
  }
}

</style>
