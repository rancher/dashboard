<script setup lang="ts">
/**
 * The row under the view tabs: the filter query and the View menu (grouping and columns). It edits
 * the `view` prop and hands it back; the tabs above see the change through the table
 */
import { computed, nextTick, ref, watch } from 'vue';
import { useStore } from 'vuex';

import TableViewQueryInput from '@shell/components/TableViews/TableViewQueryInput.vue';
import { useDragReorder } from '@shell/composables/useDragReorder';
import { useI18n } from '@shell/composables/useI18n';
import { validateQuery } from '@shell/utils/table-views/query';
import { NO_GROUPING } from '@shell/utils/table-views/views';
import { isMac } from '@shell/utils/platform';
import type { TableViewField, TableViewQueryProblem, TableViewRow, TableViewState } from '@shell/types/table-views';
import {
  RcDropdown,
  RcDropdownItem,
  RcDropdownItemCheckbox,
  RcDropdownItemRadio,
  RcDropdownSeparator,
  RcDropdownSubmenu,
  RcDropdownTrigger
} from '@components/RcDropdown';

/** Clears the row's hover highlight rather than sitting over the handle */
const TOOLTIP_DISTANCE = 12;

const props = withDefaults(defineProps<{
  view: TableViewState,
  coreColumns?: string[],
  /** Field ids the table shows when a view says nothing about columns - fewer than the menu offers */
  defaultColumns?: string[],
  unsupportedFields?: string[],
  fields?: TableViewField[],
  /** Defaults to `fields` */
  groupFields?: TableViewField[] | null,
  /** The grouping the table has when the view names none */
  defaultGroupBy?: string | null,
  /** Defaults to `fields` */
  filterFields?: TableViewField[] | null,
  /** Ids of the fields that hold dates */
  dateFields?: string[],
  fieldValues?: Record<string, { value: string, count: number }[]>,
  /** Ids of the fields whose values are on their way */
  pendingFields?: string[],
  /** All rows, before the view's query is applied */
  rows?: TableViewRow[],
}>(), {
  coreColumns:       () => [],
  defaultColumns:    () => [],
  unsupportedFields: () => [],
  fields:            () => [],
  groupFields:       null,
  defaultGroupBy:    null,
  filterFields:      null,
  dateFields:        () => [],
  fieldValues:       () => ({}),
  pendingFields:     () => [],
  rows:              () => [],
});

const emit = defineEmits<{
  'update:view': [view: TableViewState],
  'request-values': [fieldId: string],
}>();

const store = useStore();

const { t } = useI18n(store);

const columnsPanel = ref<HTMLElement | null>(null);

const groupPanel = ref<HTMLElement | null>(null);

const queryFocused = ref(false);

const columnSlots = ref<{ top: number, bottom: number }[] | null>(null);

/**
 * Said by a screen reader: what a command in the menu changed, which the focus, left on the command,
 * doesn't show
 */
const announcement = ref('');

/** Cleared first, so saying the same thing twice is heard twice */
const announce = async(message: string) => {
  announcement.value = '';
  await nextTick();
  announcement.value = message;
};

const moveKeysHint = computed(() => t('tableViews.columns.moveKeys', { modifier: isMac ? 'Option' : 'Alt' }));

/** Held back while the box has the caret, so `state:` isn't reported halfway through `state:active` */
const shownProblems = computed(() => (queryFocused.value ? [] : validateQuery(props.view.query, props.fields)));

const unsupportedNotice = computed(() => t('tableViews.query.unsupported', {
  count:  props.unsupportedFields.length,
  fields: props.unsupportedFields.join(', '),
}, true));

const problemNotice = (problem: TableViewQueryProblem) => t(`tableViews.query.problem.${ problem.kind }`, { text: problem.text, label: problem.label || '' }, true);

/** A query that can't be read is reported alone, before any unfilterable fields */
const queryStatusMessage = computed(() => {
  if (shownProblems.value.length) {
    return shownProblems.value.map((problem) => problemNotice(problem)).join('<br>');
  }

  return props.unsupportedFields.length ? unsupportedNotice.value : '';
});

const queryStatus = computed(() => (shownProblems.value.length ? 'error' : 'info'));

const columnFields = computed(() => props.fields.filter((f) => !f.isLabel && !f.queryOnly));

/** Empty content hides the tooltip once a row is picked up */
const reorderTip = computed(() => ({
  // eslint-disable-next-line @typescript-eslint/no-use-before-define
  content: heldColumnId.value ? '' : t('tableViews.columns.reorder'), placement: 'left', distance: TOOLTIP_DISTANCE
}));

const lockedTip = computed(() => ({
  content: t('tableViews.columns.locked'), placement: 'left', distance: TOOLTIP_DISTANCE
}));

const orderedColumnFields = computed(() => {
  // eslint-disable-next-line @typescript-eslint/no-use-before-define
  const order = columnDragOrder.value || props.view.columnOrder;

  if (!order?.length) {
    return columnFields.value;
  }

  const byId: Record<string, TableViewField> = {};

  columnFields.value.forEach((f) => {
    byId[f.id] = f;
  });

  const out = order.map((id: string) => byId[id]).filter((f) => !!f);

  return out.concat(columnFields.value.filter((f) => !order.includes(f.id)));
});

const isColumnVisible = (field: TableViewField) => {
  if (props.view.columns) {
    return props.view.columns.includes(field.id);
  }

  // Nothing chosen yet, so the page's own set is what is shown
  return !props.defaultColumns.length || props.defaultColumns.includes(field.id);
};

const visibleColumnCount = computed(() => columnFields.value.filter((f) => isColumnVisible(f)).length + (props.view.labelColumns?.length || 0));

const columnsSummary = computed(() => {
  if (!props.view.columns && !props.view.labelColumns?.length && !props.view.columnOrder) {
    return t('tableViews.view.columnsDefault');
  }

  // Label columns only count once added, or a pod list reads "9 / 42"
  return t('tableViews.view.columnsCount', { shown: visibleColumnCount.value, total: columnFields.value.length + (props.view.labelColumns?.length || 0) });
});

/** Labels are left out: there can be any number of them */
const groupOptions = computed(() => {
  const none = { id: null as string | null, label: t('tableViews.group.none') };

  return [none].concat((props.groupFields || props.fields)
    .filter((f) => !f.isLabel)
    .map((f) => ({ id: f.id as string | null, label: f.label })));
});

/** The grouping in force: the view's, else the table's default */
const appliedGroupBy = computed(() => (props.view.groupBy === NO_GROUPING ? null : props.view.groupBy || props.defaultGroupBy || null));

const groupLabel = computed(() => groupOptions.value.find((o) => o.id === appliedGroupBy.value)?.label || t('tableViews.group.none'));

const update = (changes: Partial<TableViewState>) => emit('update:view', { ...props.view, ...changes });

const isCoreColumn = (field: TableViewField) => !!field?.id && props.coreColumns.includes(field.id);

const toggleColumn = (field: TableViewField) => {
  if (isCoreColumn(field)) {
    return;
  }

  // From what is on screen, or toggling one would turn on the columns the page leaves out
  const current = props.view.columns || columnFields.value.filter((f) => isColumnVisible(f)).map((f) => f.id);
  const next = current.includes(field.id) ? current.filter((id: string) => id !== field.id) : current.concat([field.id]);

  update({ columns: next });
};

const selectAllColumns = () => {
  update({ columns: columnFields.value.map((f) => f.id) });
  announce(t('tableViews.columns.allShown', { count: columnFields.value.length }));
};

/**
 * Measured once as the drag begins, in the panel's coordinates: displaced rows are mid-transition
 * afterwards, and the panel may scroll
 */
const captureColumnSlots = () => {
  const scroller = columnsPanel.value;
  const rows = scroller?.querySelectorAll('[data-col-id]') || [];
  const origin = scroller ? scroller.getBoundingClientRect().top - scroller.scrollTop : 0;

  columnSlots.value = Array.from(rows).map((el) => {
    const box = el.getBoundingClientRect();

    return { top: box.top - origin, bottom: box.bottom - origin };
  });
};

/** Clamped, so dragging past the last row parks the column at the end */
const columnIndexAt = (clientY: number) => {
  const slots = columnSlots.value || [];
  const scroller = columnsPanel.value;

  if (!slots.length || !scroller) {
    return -1;
  }

  const y = clientY - scroller.getBoundingClientRect().top + scroller.scrollTop;

  if (y <= slots[0].top) {
    return 0;
  }

  if (y >= slots[slots.length - 1].bottom) {
    return slots.length - 1;
  }

  return slots.findIndex((slot) => y >= slot.top && y <= slot.bottom);
};

/** Locked columns hold the head of the list, so nothing may be carried above them */
const firstMovableIndex = (order: string[]) => {
  let i = 0;

  while (i < order.length && props.coreColumns.includes(order[i])) {
    i++;
  }

  return i;
};

const { heldId: heldColumnId, order: columnDragOrder, start: armColumnDrag } = useDragReorder({
  axis:         'y',
  initialOrder: () => orderedColumnFields.value.map((f) => f.id),
  measure:      captureColumnSlots,
  indexAt:      columnIndexAt,
  firstMovable: firstMovableIndex,
  onEnd:        () => {
    columnSlots.value = null;
  },
  onCommit: (order) => update({ columnOrder: order }),
});

const startColumnDrag = (id: string, event: MouseEvent) => {
  if (event.button !== 0) {
    return;
  }

  // Otherwise the pointer selects the labels it crosses
  event.preventDefault();
  armColumnDrag(id, event);
};

/** The table's default is stored as nothing, so it isn't a change; none over a default is stored as such */
const pickGroupBy = (id: string | null) => update({ groupBy: id === props.defaultGroupBy ? null : id || NO_GROUPING });

/** Picking the applied grouping again removes it */
const toggleGroupBy = (id: string | null) => pickGroupBy(id === appliedGroupBy.value ? null : id);

const resetColumns = () => {
  update({
    columns: null, labelColumns: [], columnOrder: null
  });
  announce(t('tableViews.columns.resetDone'));
};

const resetGroupBy = async() => {
  update({ groupBy: null });
  // The table's default grouping, once the view has taken the change
  await nextTick();
  announce(t('tableViews.group.resetDone', { label: groupLabel.value }));
};

/** The keyboard's way to reorder: one place up or down, never above the locked columns */
const moveColumn = async(field: TableViewField, step: number) => {
  const order = orderedColumnFields.value.map((f) => f.id);
  const from = order.indexOf(field.id);
  const to = from + step;

  if (isCoreColumn(field) || to < firstMovableIndex(order) || to >= order.length) {
    return;
  }

  order.splice(to, 0, order.splice(from, 1)[0]);
  update({ columnOrder: order });
  announce(t('tableViews.columns.moved', {
    label: field.label, position: to + 1, total: order.length
  }));

  // Moving the row takes it out of the page for a moment, which drops its focus
  await nextTick();
  (columnsPanel.value?.querySelector(`[data-col-id="${ field.id }"]`) as HTMLElement | null)?.focus();
};

const resetView = () => update({
  query: '', columns: null, labelColumns: [], columnOrder: null, groupBy: null, sort: null, sortDescending: false
});

/** Scroll the grouped field into view when the list opens, a frame later so the popper has its height */
watch(groupPanel, (panel) => {
  if (!panel) {
    return;
  }

  requestAnimationFrame(() => {
    panel.querySelector(`[data-testid="table-views-group-${ appliedGroupBy.value || 'none' }"]`)?.scrollIntoView({ block: 'nearest' });
  });
});
</script>

<template>
  <div
    class="table-views"
    data-testid="table-views-controls"
  >
    <div
      class="sr-only"
      role="status"
      aria-live="polite"
      data-testid="table-views-announcement"
    >
      {{ announcement }}
    </div>
    <div class="view-controls">
      <div class="query-grow query-column">
        <TableViewQueryInput
          :value="view.query"
          :fields="fields"
          :filter-fields="filterFields"
          :date-fields="dateFields"
          :rows="rows"
          :field-values="fieldValues"
          :pending-fields="pendingFields"
          @update:value="update({ query: $event })"
          @update:focused="queryFocused = $event"
          @request-values="$emit('request-values', $event)"
        />
        <!-- Under the box, like a field's validation message -->
        <p
          v-if="queryStatusMessage"
          :class="['query-notice', queryStatus]"
          role="alert"
          :data-testid="queryStatus === 'error' ? 'table-views-query-problem' : 'table-views-unsupported'"
        >
          <i
            class="icon"
            :class="queryStatus === 'error' ? 'icon-notify-warning' : 'icon-notify-info'"
          />
          <span v-clean-html="queryStatusMessage" />
        </p>
      </div>

      <rc-dropdown
        :placement="'bottom-end'"
        :aria-label="t('tableViews.view.label')"
      >
        <rc-dropdown-trigger
          variant="tertiary"
          class="view-control-btn"
          data-testid="table-views-view-menu"
        >
          <template #before>
            <i class="icon icon-gear" />
          </template>
          {{ t('tableViews.view.label') }}
        </rc-dropdown-trigger>
        <template #dropdownCollection>
          <!-- The lists open to the left: the button sits at the page's right edge -->
          <div class="view-menu">
            <rc-dropdown-submenu
              side="left"
              data-testid="table-views-view-group"
            >
              {{ t('tableViews.view.groupBy') }}
              <template #after>
                <span class="menu-nav-value">{{ groupLabel }}</span>
              </template>
              <template #submenu>
                <div
                  ref="groupPanel"
                  class="menu-panel"
                >
                  <!-- Grouped, as radios beside other items are -->
                  <div
                    role="group"
                    :aria-label="t('tableViews.view.groupBy')"
                  >
                    <rc-dropdown-item-radio
                      v-for="option in groupOptions"
                      :key="option.id || 'none'"
                      :checked="option.id === appliedGroupBy"
                      :data-testid="`table-views-group-${ option.id || 'none' }`"
                      @click="toggleGroupBy(option.id)"
                    >
                      {{ option.label }}
                    </rc-dropdown-item-radio>
                  </div>
                  <rc-dropdown-separator />
                  <rc-dropdown-item
                    class="menu-reset"
                    acts-on-checkable-items
                    data-testid="table-views-group-reset"
                    @click="resetGroupBy"
                  >
                    {{ t('tableViews.view.reset') }}
                  </rc-dropdown-item>
                </div>
              </template>
            </rc-dropdown-submenu>

            <rc-dropdown-submenu
              side="left"
              data-testid="table-views-view-columns"
            >
              {{ t('tableViews.view.columnsConfiguration') }}
              <template #after>
                <span class="menu-nav-value">{{ columnsSummary }}</span>
              </template>
              <template #submenu>
                <div
                  ref="columnsPanel"
                  class="menu-panel columns-panel"
                >
                  <TransitionGroup
                    name="column-row"
                    tag="div"
                    role="group"
                    :aria-label="t('tableViews.view.columnsConfiguration')"
                    :class="{ 'is-reordering': heldColumnId !== null }"
                  >
                    <rc-dropdown-item-checkbox
                      v-for="field in orderedColumnFields"
                      :key="field.id"
                      indicator="checkmark"
                      :model-value="isColumnVisible(field)"
                      :class="{ 'column-row': true, locked: isCoreColumn(field), shown: isColumnVisible(field), held: heldColumnId === field.id }"
                      :disabled="isCoreColumn(field)"
                      :data-col-id="field.id"
                      :data-testid="`table-views-col-${ field.id }`"
                      :aria-description="isCoreColumn(field) ? t('tableViews.columns.locked') : moveKeysHint"
                      @click="toggleColumn(field)"
                      @keydown.alt.up.prevent.stop="moveColumn(field, -1)"
                      @keydown.alt.down.prevent.stop="moveColumn(field, 1)"
                    >
                      <template #before>
                        <i
                          v-if="isCoreColumn(field)"
                          v-clean-tooltip="lockedTip"
                          class="icon icon-lock column-handle"
                        />
                        <span
                          v-else
                          v-clean-tooltip="reorderTip"
                          class="column-handle grip"
                          :data-testid="`table-views-col-handle-${ field.id }`"
                          @mousedown="startColumnDrag(field.id, $event)"
                        />
                      </template>
                      {{ field.label }}
                    </rc-dropdown-item-checkbox>
                  </TransitionGroup>

                  <rc-dropdown-separator />
                  <rc-dropdown-item
                    acts-on-checkable-items
                    data-testid="table-views-columns-select-all"
                    @click="selectAllColumns"
                  >
                    <template #before>
                      <i class="menu-gutter" />
                    </template>
                    {{ t('tableViews.columns.selectAll') }}
                  </rc-dropdown-item>
                  <rc-dropdown-item
                    class="menu-reset"
                    acts-on-checkable-items
                    data-testid="table-views-columns-reset"
                    @click="resetColumns"
                  >
                    <template #before>
                      <i class="menu-gutter" />
                    </template>
                    {{ t('tableViews.columns.reset') }}
                  </rc-dropdown-item>
                </div>
              </template>
            </rc-dropdown-submenu>

            <rc-dropdown-separator />
            <rc-dropdown-item
              class="menu-reset"
              data-testid="table-views-reset"
              @click="resetView"
            >
              {{ t('tableViews.view.reset') }}
            </rc-dropdown-item>
          </div>
        </template>
      </rc-dropdown>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@import '@shell/components/TableViews/_table-views.scss';

.table-views {
  .view-controls {
    display: flex;
    flex-wrap: nowrap;
    // Top aligned, so the View button stays on the box's line when a notice grows under the box
    align-items: flex-start;
    gap: 16px;
    width: 100%;
    // The toolbar's floor, right in any language. The tabs above share this masthead column and
    // take it too
    min-width: min-content;
  }

  .query-grow {
    flex: 1 1 auto;
  }

  .query-column {
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-width: 0;
  }

  // `--error`: the warning tokens are for backgrounds and fail contrast as text
  .query-notice {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0;
    color: var(--error);
    font-size: 13px;
    line-height: 18px;

    .icon {
      flex: none;
      font-size: 14px;
    }
  }

  .view-control-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    height: 32px;
    padding: 0 12px;
    white-space: nowrap;

    .icon {
      @include toolbar-icon(14px, 14px);
    }
  }
}

// Room for the value beside each row
.view-menu {
  min-width: 300px;

  .menu-nav-value {
    color: var(--muted);
    max-width: 150px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.menu-panel {
  // Only while a row is carried: the popper is positioned after mounting, which FLIP would animate
  // as every row sliding in
  .is-reordering .column-row-move {
    transition: transform 0.2s $drag-displace-curve;
  }

  .is-reordering {
    cursor: grabbing;

    [dropdown-menu-item],
    [dropdown-menu-item]:hover,
    .column-handle {
      cursor: grabbing;
    }
  }

  .is-reordering .column-row {
    transition: background-color 0.1s ease-in-out, transform 0.33s $drag-drop-curve, box-shadow 0.33s $drag-drop-curve;
  }

  .column-row {
    transition: background-color 0.1s ease-in-out;
    user-select: none;
    .column-handle {
      font-size: 14px;
      cursor: grab;
    }

    .grip {
      color: var(--muted);
    }

    // The icon font has no grip glyph
    .grip {
      position: relative;
      display: inline-block;
      // The lock's width, so every label starts in the same place
      width: 14px;
      height: 12px;

      &::before,
      &::after {
        content: '';
        position: absolute;
        left: 1px;
        right: 1px;
        height: 1.5px;
        border-radius: 1px;
        background: currentColor;
      }

      &::before { top: 3.5px; }
      &::after { top: 7px; }
    }

    &.shown {
      color: var(--active, var(--primary));
    }

    // Shown but unavailable: a fainter version of the shown colour rather than grey, which reads as
    // off
    &.locked {
      color: color-mix(in srgb, var(--active, var(--primary)) 50%, transparent);
      cursor: default;

      .column-handle { cursor: default; }
    }

    // Lifted the way the app bar's pinned shelf lifts a row
    &.held {
      position: relative;
      z-index: 1;
      background: color-mix(in srgb, var(--primary) 14%, transparent);
      transform: scale(1.02);
      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.28);
      transition: transform 0.2s $drag-displace-curve, box-shadow 0.2s $drag-displace-curve, background-color 0.2s $drag-displace-curve;
    }
  }
}
</style>
