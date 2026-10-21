<script setup lang="ts">
import LabeledSelect from '@shell/components/form/LabeledSelect.vue';
import StateDot from '@shell/components/StateDot/index.vue';
import LiveDate from '@shell/components/formatter/LiveDate.vue';
import ActionMenu from '@shell/components/ActionMenuShell.vue';
import { useI18n } from '@shell/composables/useI18n';
import { useStore } from 'vuex';
import { useRouter, type RouteLocationRaw } from 'vue-router';
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue';
import { useWorkloadSearch } from './useWorkloadSearch';
import { WORKLOAD_SEARCH_MIN_CHARS, type WorkloadSearchOption } from './types';
import type { WorkloadDashboardNamespaceNavigateFn, WorkloadDashboardResourceRouteFn } from '../types';

const props = defineProps<{
  navigateToNamespace: WorkloadDashboardNamespaceNavigateFn;
  resourceRoute: WorkloadDashboardResourceRouteFn;
}>();


/**
 * The most workloads to show in the entire drop down
 *
 * One row for the group label + the results shown per type + plus half a row (so user sees there's more results)
 */
const maxDropdownVisibleRows = 14;

/**
 * The fewest rows to show, even if they run past the bottom of the window
 */
const minDropdownVisibleRows = 3.5;

/**
 * Gap to leave between the bottom of the drop down and the bottom of the window
 */
const dropdownViewportMargin = 16;

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

const dropdownVisibleRows = ref(maxDropdownVisibleRows);

// Fit the drop down in the space below the search, so it doesn't run past the bottom of the window
function updateDropdownVisibleRows(): void {
  const searchEl = searchRef.value?.$el as HTMLElement | undefined;

  if (!searchEl) {
    return;
  }

  const available = window.innerHeight - searchEl.getBoundingClientRect().bottom - dropdownViewportMargin;
  // Whole rows that fit, less half a row so the last one still hints there are more
  const rows = Math.floor(available / dropdownVisibleRowHeight) - 0.5;

  dropdownVisibleRows.value = Math.max(minDropdownVisibleRows, Math.min(maxDropdownVisibleRows, rows));
}

onMounted(() => window.addEventListener('resize', updateDropdownVisibleRows));
onBeforeUnmount(() => window.removeEventListener('resize', updateDropdownVisibleRows));

const keepOpenOnBlur = ref(false);

// A click in a result never reaches the action menus' click outside handling, the option stops it
const openActionsFor = ref<string | null>(null);

function onActionsOpen(option: WorkloadSearchOption, open: boolean): void {
  if (open) {
    openActionsFor.value = option.uniqueId;
  } else if (openActionsFor.value === option.uniqueId) {
    openActionsFor.value = null;
  }
}

function searchInput(): HTMLInputElement | null {
  return searchRef.value?.$el?.querySelector('input.vs__search') || null;
}

// "+X more" rows are options rather than buttons so they're reachable with the arrow keys and Enter
function isOptionSelectable(option: WorkloadSearchOption): boolean {
  return option.kind !== 'group' && option.kind !== 'error';
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

// Clicking also sets the header namespace filter (see onNamespaceClick), which an href can't carry
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

let openBeforeClick: string | null = null;

function onActionsClickCapture(): void {
  openBeforeClick = openActionsFor.value;
}

function onActionsClick(event: MouseEvent, option: WorkloadSearchOption) {
  // Prevent vue-select from treating this as selecting the option.
  event.stopPropagation();
  // Early enough, vue-select prevents mousedown in its dropdown so the input keeps focus until after this click.
  // Opened by keyboard, focus is already on the button so the input won't blur
  if (document.activeElement === searchInput()) {
    keepOpenOnBlur.value = true;
  }

  // Else closing the open menu gives the focus to its button, which then shows the focus ring
  if (openBeforeClick) {
    searchInput()?.focus();

    if (openBeforeClick === option.uniqueId) {
      onActionsOpen(option, false);
    } else {
      keepOpenOnBlur.value = true;
    }
  }
}

// Workload names can't contain whitespace, so keep it out of the search
function onSearchBeforeInput(event: InputEvent): void {
  const input = searchInput();
  const text = event.data ?? event.dataTransfer?.getData('text/plain');

  if (!input || event.target !== input || !text || !/\s/.test(text)) {
    return;
  }

  event.preventDefault();

  // Pasted or dropped text keeps its non-whitespace characters
  const stripped = text.replace(/\s/g, '');

  // execCommand (unlike setRangeText) keeps the undo history, fall back if it's ever unsupported
  if (stripped && !document.execCommand?.('insertText', false, stripped)) {
    input.setRangeText(stripped, input.selectionStart ?? input.value.length, input.selectionEnd ?? input.value.length, 'end');
    input.dispatchEvent(new Event('input', { bubbles: true }));
  }
}

function onSearchBlur() {
  if (!keepOpenOnBlur.value) {
    return;
  }

  keepOpenOnBlur.value = false;

  searchRef.value?.forceOpen();
}

function onActionInvoked(): void {
  // The input already lost focus to the action menu, so no blur will close the dropdown
  searchRef.value?.forceClose();
}

const resultFocusables = 'a[href], button:not([disabled])';

// Tab and Shift+Tab move focus from the search through the links and buttons of the highlighted result and back,
// Escape goes back to the search
function onResultsKeydown(event: KeyboardEvent): void {
  const input = searchInput();
  const target = event.target as HTMLElement;
  const fromInput = target === input;
  const row = fromInput ? searchRef.value?.$el?.querySelector('.vs__dropdown-option--highlight') : target.closest('.vs__dropdown-option');
  const focusables: HTMLElement[] = row ? Array.from(row.querySelectorAll(resultFocusables)) : [];

  if (!input || !focusables.length || (!fromInput && !focusables.includes(target))) {
    return;
  }

  if (event.key === 'Tab') {
    const order = [input, ...focusables];
    const at = order.indexOf(target);
    const next = order[(at + (event.shiftKey ? -1 : 1) + order.length) % order.length];

    event.preventDefault();

    if (fromInput) {
      keepOpenOnBlur.value = true;
    }

    next.focus();
  } else if (event.key === 'Escape' && !fromInput) {
    event.preventDefault();
    input.focus();
  }
}

function onResultsFocusout(event: FocusEvent): void {
  const to = event.relatedTarget as HTMLElement | null;

  // vue-select handles the input's own blur. Focus moving within the results, or into a result's action menu, keeps them open
  if (event.target === searchInput() || (to && (searchRef.value?.$el?.contains(to) || to.closest('.v-popper__popper')))) {
    return;
  }

  searchRef.value?.forceClose();

  // Closing focuses the select (LabeledSelect onClose), put focus back where it was going
  if (to) {
    nextTick(() => to.focus());
  }
}
</script>

<template>
  <LabeledSelect
    ref="searchRef"
    class="workload-search"
    :options="options"
    :searchable="true"
    :filterable="false"
    :keep-search-on-blur="true"
    :append-to-body="false"
    :visible-rows="dropdownVisibleRows"
    :visible-row-height="dropdownVisibleRowHeight"
    :selectable="isOptionSelectable"
    :reduce="optionRoute"
    option-key="uniqueId"
    :placeholder="t('workloadDashboard.search.placeholder')"
    :aria-label="t('workloadDashboard.search.ariaLabel')"
    data-testid="workload-dashboard-search"
    @search="onSearch"
    @update:value="onSelect"
    @on-blur="onSearchBlur"
    @on-open="updateDropdownVisibleRows"
    @keydown="onResultsKeydown"
    @focusout="onResultsFocusout"
    @beforeinput="onSearchBeforeInput"
  >
    <template #option="option">
      <b
        v-if="option.kind === 'group'"
        class="group-label"
      >{{ option.label }}</b>
      <span
        v-else-if="option.kind === 'error'"
        class="error-label text-error"
      >{{ option.label }}</span>
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
          <LiveDate
            class="age"
            :value="option.resource?.creationTimestamp"
            :show-tooltip="false"
          />
        </div>
        <span
          class="actions"
          @click.capture="onActionsClickCapture"
          @click="onActionsClick($event, option)"
        >
          <ActionMenu
            :resource="option.resource"
            button-size="small"
            :button-aria-label="t('sortableTable.tableActionsLabel', { resource: option.resource?.id || '' })"
            container="body"
            :open="openActionsFor === option.uniqueId"
            @update:open="onActionsOpen(option, $event)"
            @vue:unmounted="onActionsOpen(option, false)"
            @action-invoked="onActionInvoked"
          />
        </span>
      </div>
    </template>
    <template #no-options="{ search }">
      <span v-if="loading">{{ t('workloadDashboard.search.searching') }}</span>
      <span v-else-if="search && search.length < WORKLOAD_SEARCH_MIN_CHARS">{{ t('workloadDashboard.search.minCharacters', { count: WORKLOAD_SEARCH_MIN_CHARS }) }}</span>
      <span v-else-if="search">{{ t('workloadDashboard.search.noMatch') }}</span>
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

.group-label,
.error-label {
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
    // Basis 0 (here and on .meta) keeps columns aligned across rows whatever the name length
    flex: 3 1 0;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .meta {
    display: flex;
    align-items: center;
    flex: 1 0 0;
    gap: 16px;
  }

  .namespace,
  .age {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .namespace {
    flex: 15 1 150px;
    min-width: 150px;
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
