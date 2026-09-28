<script setup lang="ts">
/**
 * The row beneath the view tabs: the filter query, and the View menu that groups the table and
 * chooses and orders its columns.
 *
 * Everything here edits the `view` prop and hands it back, so the owning table applies it and the
 * tabs above - TableViewTabs - see the change. The two share nothing else.
 */
import {
  computed, nextTick, onBeforeUnmount, onMounted, ref, watch
} from 'vue';
import { useStore } from 'vuex';

import TableViewQueryInput from '@shell/components/TableViews/TableViewQueryInput.vue';
import { useDragReorder } from '@shell/composables/useDragReorder';
import { useI18n } from '@shell/composables/useI18n';
import { validateQuery } from '@shell/utils/table-views/query';
import type { TableViewField, TableViewQueryProblem, TableViewRow, TableViewState } from '@shell/types/table-views';
import { RcDropdown, RcDropdownItem, RcDropdownSeparator, RcDropdownTrigger } from '@components/RcDropdown';

/** Clears the handle's tooltip of the row's hover highlight rather than sitting over the handle */
const TOOLTIP_DISTANCE = 12;

/**
 * How long the pointer is given to cross one row of the View menu on its way to the sub menu
 * another row opened, before that row is taken to be the one you meant.
 *
 * The sub menus open alongside the menu rather than below the row, so reaching anything but the
 * first entry means travelling diagonally - straight across whichever rows lie between. Acting
 * on those the moment they are touched made the lower half of a sub menu unreachable: the menu
 * you were heading for was replaced before you arrived.
 */
const SUB_MENU_GRACE_MS = 300;

/**
 * How close to an edge of the page's content region a sub menu may come.
 *
 * Applied to every edge, so a menu slid up to stay on screen stops this far under the masthead
 * and a menu at the bottom stops this far above the fold.
 */
const MENU_GUTTER = 16;

const props = withDefaults(defineProps<{
  /** What the table is showing: the query, the columns, the grouping and the sort */
  view: TableViewState,
  /** Field ids this table will not let go of, so the menu can show them locked */
  coreColumns?: string[],
  /**
   * Field ids the table shows when a view has said nothing about columns.
   *
   * The menu offers every column the type has, which is more than a page showing its own
   * chosen set displays - so "shown" cannot mean "all of them" any more.
   */
  defaultColumns?: string[],
  /**
   * Names of fields the query mentions that this list cannot be filtered by, so the toolbar
   * can say the query did not entirely run
   */
  unsupportedFields?: string[],
  /** Everything filterable/groupable on this table */
  fields?: TableViewField[],
  /**
   * Fields offered in the group by menu. Grouping is a sort, so this can be narrower than
   * `fields` - server side only indexed fields can be grouped on. Defaults to all fields.
   */
  groupFields?: TableViewField[] | null,
  /**
   * Fields offered as filter suggestions. Narrower than `fields` for the same reason
   * `groupFields` is - server side only indexed fields can be filtered on. Defaults to all
   * fields.
   */
  filterFields?: TableViewField[] | null,
  /**
   * fieldId -> values in use, fetched from the api. Falls back to scanning `rows` when a field
   * has nothing here yet.
   */
  fieldValues?: Record<string, { value: string, count: number }[]>,
  /** All rows, before the view query is applied. Used for value autocomplete */
  rows?: TableViewRow[],
}>(), {
  coreColumns:       () => [],
  defaultColumns:    () => [],
  unsupportedFields: () => [],
  fields:            () => [],
  groupFields:       null,
  filterFields:      null,
  fieldValues:       () => ({}),
  rows:              () => [],
});

const emit = defineEmits<{
  'update:view': [view: TableViewState],
  'request-values': [fieldId: string],
}>();

const store = useStore();

const { t } = useI18n(store);

const root = ref<HTMLElement | null>(null);

const viewMenu = ref<HTMLElement | null>(null);

const columnsPanel = ref<HTMLElement | null>(null);

const groupPanel = ref<HTMLElement | null>(null);

/**
 * What a sub menu has to stay inside, so it can be slid back into view without going somewhere
 * it cannot be read.
 *
 * The window is the wrong edge to stop at. The page's masthead is fixed, so a menu pushed up to
 * fit ran underneath it - the top of the list went behind the header and the rows that mattered
 * were the ones you could no longer see. The content region below the masthead is the box the
 * page actually owns. Null where a page has no such region, which leaves the window as it was.
 */
const menuBoundary = ref<Element | undefined>(undefined);

/** True while the caret is in the query box, so it is not corrected mid-word */
const queryFocused = ref(false);

/**
 * Which sub menu of the View menu is open - 'group', 'columns', or null. A menu item has
 * no trigger of its own, so the row that opens one says so here and the menu takes its
 * open state from it.
 */
const subMenu = ref<string | null>(null);

/**
 * Whether the pointer is inside the open sub menu. The row that opened it takes the
 * highlight back while it is, so the menu says where you are rather than what you last
 * passed over on the way there.
 */
const subMenuHovered = ref(false);

/**
 * Where the column rows sat when a drag began, in the panel's own coordinates - see
 * captureColumnSlots for why they are taken once rather than read live.
 */
const columnSlots = ref<{ top: number, bottom: number }[] | null>(null);

let subMenuTimer: ReturnType<typeof setTimeout> | undefined;

/**
 * What is wrong with the query, once the user has stopped writing it.
 *
 * Held back while the box has the caret: `state:` is a field with no value, and it is also
 * the halfway point of typing `state:active` - with the values for it on screen at that very
 * moment. Correcting someone mid-word is noise, so this waits until they look away.
 */
const shownProblems = computed(() => (queryFocused.value ? [] : validateQuery(props.view.query, props.fields)));

/** What the toolbar says about the part of the query that could not be run */
const unsupportedNotice = computed(() => t('tableViews.query.unsupported', {
  count:  props.unsupportedFields.length,
  fields: props.unsupportedFields.join(', '),
}, true));

const problemNotice = (problem: TableViewQueryProblem) => t(`tableViews.query.problem.${ problem.kind }`, { text: problem.text, label: problem.label || '' }, true);

/**
 * Everything the box has to say about what is in it, for the status icon at its right.
 *
 * A query that cannot be read as written comes first and on its own - saying a field is
 * unfilterable while the query also ends in `and` answers a question nobody asked yet.
 */
const queryStatusMessage = computed(() => {
  if (shownProblems.value.length) {
    return shownProblems.value.map((problem) => problemNotice(problem)).join('<br>');
  }

  return props.unsupportedFields.length ? unsupportedNotice.value : '';
});

/**
 * A query that cannot be read is an error - nothing is being filtered by it. A field the
 * server cannot filter on is not: the rest of the query still ran.
 */
const queryStatus = computed(() => (shownProblems.value.length ? 'error' : 'info'));

const columnFields = computed(() => props.fields.filter((f) => !f.isLabel));

/**
 * The handle's tooltip. Empty content is how the directive is told to show nothing, so the
 * tooltip goes the moment a row is picked up rather than riding along with it.
 *
 * Far enough left to clear the row's hover highlight: on the handle itself it sat over the
 * thing being dragged, which is the one place it is in the way.
 */
const reorderTip = computed(() => ({
  // eslint-disable-next-line @typescript-eslint/no-use-before-define
  content: heldColumnId.value ? '' : t('tableViews.columns.reorder'), placement: 'left', distance: TOOLTIP_DISTANCE
}));

const lockedTip = computed(() => ({
  content: t('tableViews.columns.locked'), placement: 'left', distance: TOOLTIP_DISTANCE
}));

/**
 * Columns in the order the view puts them, so the picker reads the way the table does
 */
const orderedColumnFields = computed(() => {
  // Mid-drag the list follows the pointer rather than the saved order
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

  // Nothing chosen yet, so what the table shows is the page's own set. Without a set to
  // compare against every offered column would read as shown, including the ones the page
  // leaves out.
  return !props.defaultColumns.length || props.defaultColumns.includes(field.id);
};

const visibleColumnCount = computed(() => columnFields.value.filter((f) => isColumnVisible(f)).length + (props.view.labelColumns?.length || 0));

// "7 / 11", or "Default" while nothing has been changed - shown on the Columns row of the View menu
const columnsSummary = computed(() => {
  if (!props.view.columns && !props.view.labelColumns?.length && !props.view.columnOrder) {
    return t('tableViews.view.columnsDefault');
  }

  // Labels are extras rather than columns of the table, so only the ones actually added count
  // towards the total - otherwise a pod list reads "9 / 42" because of its label keys
  return t('tableViews.view.columnsCount', { shown: visibleColumnCount.value, total: columnFields.value.length + (props.view.labelColumns?.length || 0) });
});

/**
 * Labels are left out: a cluster carries as many of them as it likes, so offering every key
 * buries the handful of fields worth grouping on under a list of them.
 */
const groupOptions = computed(() => {
  const none = { id: null as string | null, label: t('tableViews.group.none') };

  return [none].concat((props.groupFields || props.fields)
    .filter((f) => !f.isLabel)
    .map((f) => ({ id: f.id as string | null, label: f.label })));
});

const groupLabel = computed(() => groupOptions.value.find((o) => o.id === props.view.groupBy)?.label || t('tableViews.group.none'));

const update = (changes: Partial<TableViewState>) => emit('update:view', { ...props.view, ...changes });

const isCoreColumn = (field: TableViewField) => !!field?.id && props.coreColumns.includes(field.id);

const toggleColumn = (field: TableViewField) => {
  // Core columns (name, age) can't be hidden - the table depends on them
  if (isCoreColumn(field)) {
    return;
  }

  // From what is on screen rather than from every column offered - seeding with all of them
  // turned on the ones the page leaves out the moment anything was toggled
  const current = props.view.columns || columnFields.value.filter((f) => isColumnVisible(f)).map((f) => f.id);
  const next = current.includes(field.id) ? current.filter((id: string) => id !== field.id) : current.concat([field.id]);

  update({ columns: next });
};

const selectAllColumns = () => update({ columns: columnFields.value.map((f) => f.id) });

/**
 * The places the rows occupy, measured once as the drag begins.
 *
 * They cannot be read live. A row's box reflects any transform it is under, and the rows
 * displaced by a drag are mid-FLIP for as long as that move lasts - so measuring during the
 * drag reads the positions rows are traveling THROUGH. The pointer then lands on a row that is
 * only passing by, which reorders, which starts another move: the row flails between places
 * instead of settling under the cursor.
 *
 * Held in the panel's own coordinates rather than the viewport's, so that a panel scrolled
 * mid-drag does not put every boundary where the rows no longer are.
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

/**
 * Which row the pointer is over. Past either end it clamps, so dragging beyond the last row
 * parks the column at the end rather than abandoning the move.
 */
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

/**
 * The first place a column can be dropped into. The locked columns hold the head of the list
 * and cannot be moved themselves, so nothing may be carried above them either.
 */
const firstMovableIndex = (order: string[]) => {
  let i = 0;

  while (i < order.length && props.coreColumns.includes(order[i])) {
    i++;
  }

  return i;
};

/** The column picker's drag: the rows shuffle under the cursor as a held one travels */
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

/**
 * Press on a column's grip: arm a possible drag. Nothing is picked up here - a press on a row
 * is far more often the start of a click that toggles the column - so the row is only taken
 * once the pointer has travelled far enough with it held.
 */
const startColumnDrag = (id: string, event: MouseEvent) => {
  if (event.button !== 0) {
    return;
  }

  // Otherwise the pointer selects the labels it crosses on the way
  event.preventDefault();
  armColumnDrag(id, event);
};

const setGroupBy = (id: string | null) => update({ groupBy: id });

/**
 * Picking a grouping from the menu, where picking the one already applied undoes it.
 *
 * The rows are how the grouping is read as much as how it is set, so the obvious move on
 * seeing the tick against the field you are grouped by is to click it again - and a menu
 * that answers by doing nothing leaves you hunting for None or Reset to say what the row you
 * just clicked was already saying.
 */
const toggleGroupBy = (id: string | null) => setGroupBy(id === props.view.groupBy ? null : id);

const resetColumns = () => update({
  columns: null, labelColumns: [], columnOrder: null
});

/**
 * Put the whole view back to the table's defaults - the query included
 */
const resetView = () => update({
  query: '', columns: null, labelColumns: [], columnOrder: null, groupBy: null, sort: null, sortDescending: false
});

/**
 * A row of the View menu coming under the pointer.
 *
 * Opening one is immediate; taking an open one away from another row is not - see
 * SUB_MENU_GRACE_MS. `key` is null for the rows that open nothing, which close what is open
 * on the same terms.
 */
const hoverSubMenu = (key: string | null) => {
  clearTimeout(subMenuTimer);

  if (subMenu.value === key) {
    return;
  }

  if (!subMenu.value) {
    subMenu.value = key;

    return;
  }

  subMenuTimer = setTimeout(() => {
    subMenu.value = key;
  }, SUB_MENU_GRACE_MS);
};

/** Clicking a row says which menu you want outright, with none of the waiting */
const openSubMenu = (key: string | null) => {
  clearTimeout(subMenuTimer);
  subMenu.value = key;
};

/** The pointer has left a row without settling on it, so it never meant to choose it */
const cancelSubMenuSwitch = () => clearTimeout(subMenuTimer);

/** The pointer has arrived in the sub menu, which is the end of any journey across the rows */
const enterSubMenu = () => {
  clearTimeout(subMenuTimer);
  subMenuHovered.value = true;
};

/**
 * A sub menu closing itself - a click outside it, Escape, picking something - is what takes
 * the row out of the open state the click put it in.
 *
 * A menu normally hands focus back to the button that opened it, and this one has no button:
 * it is opened by a row of the menu above. So the row takes focus back, leaving the keyboard
 * where it was rather than at the top of the page.
 */
const closeSubMenu = (key: string | null, open: boolean) => {
  if (!open && key && subMenu.value === key) {
    subMenu.value = null;
    nextTick(() => (viewMenu.value?.querySelector(`[data-testid="table-views-view-${ key }"]`) as HTMLElement)?.focus());
  }
};

/** Whatever was under the pointer belonged to the menu that has just gone */
watch(subMenu, () => {
  subMenuHovered.value = false;
});

/**
 * Which list the sub menu is showing, which is not quite the same as which one is open.
 *
 * It follows `subMenu` on the way in and ignores it on the way out. Closing empties `subMenu`, and
 * a list rendered straight off that would unmount while the popper was still on screen - the panel
 * collapsing to nothing for a frame, which reads as the list jumping upward just as it goes. This
 * way it leaves with the contents it had.
 */
const shownSubMenu = ref<string | null>(null);

watch(subMenu, (key) => {
  if (key) {
    shownSubMenu.value = key;
  }
});

/**
 * A list that opens taller than its room opens on the field it is grouped by, not at the top.
 *
 * Otherwise the tick is simply out of sight: the row saying what the table is doing right now is
 * the one thing the list is opened to check, and on a short window it sits below the fold with
 * nothing to say it is there. `nearest` scrolls by as little as will show it, so a grouping near
 * the top does not move the list at all.
 *
 * Keyed on the panel arriving rather than on `subMenu` changing. The two are not the same: the
 * menu remembers which sub menu was last open, so re-opening the View menu and going back to the
 * same row puts the list on screen again without that value ever changing - and a watcher on it
 * would not run.
 *
 * A frame after that, because the popper is placed and sized by a layout pass of its own, and
 * scrolling a box before it has been given its height does nothing at all.
 */
watch(groupPanel, (panel) => {
  if (!panel) {
    return;
  }

  requestAnimationFrame(() => {
    panel.querySelector(`[data-testid="table-views-group-${ props.view.groupBy || 'none' }"]`)?.scrollIntoView({ block: 'nearest' });
  });
});

onMounted(() => {
  menuBoundary.value = root.value?.closest('#main-content') || undefined;
});

onBeforeUnmount(() => {
  clearTimeout(subMenuTimer);
});
</script>

<template>
  <div
    ref="root"
    class="table-views"
    data-testid="table-views-controls"
  >
    <div class="view-controls">
      <div class="query-grow query-column">
        <TableViewQueryInput
          :value="view.query"
          :fields="fields"
          :filter-fields="filterFields"
          :rows="rows"
          :field-values="fieldValues"
          @update:value="update({ query: $event })"
          @update:focused="queryFocused = $event"
          @request-values="$emit('request-values', $event)"
        />
        <!-- What the box has to say about what is in it, under the box the way the product puts
             a field's validation message under its field. `alert` rather than a `Banner`: it
             belongs to the box, not to the page.

             A query that cannot be read as written comes first and on its own - saying a field is
             unfilterable while the query also ends in `and` answers a question nobody asked yet. -->
        <p
          v-if="queryStatusMessage"
          :class="['query-notice', queryStatus]"
          role="alert"
          :data-testid="queryStatus === 'error' ? 'table-views-query-problem' : 'table-views-unsupported'"
        >
          <!-- Both marks come from the same drawn-outline set, so the two things the box can
               say about itself read as one kind of message - `icon-info` is a filled bubble and
               stood out as something else entirely beside the warning. -->
          <i
            class="icon"
            :class="queryStatus === 'error' ? 'icon-notify-warning' : 'icon-notify-info'"
          />
          <span v-clean-html="queryStatusMessage" />
        </p>
      </div>

      <!-- Single "View" popup - Group by and Columns each open their own nested dropdown
           beside the row.

           `shift` off on this one. It opens downwards, so what it would slide along is the
           horizontal: left on, the menu walked sideways out from under the button that opened it
           as the window narrowed, while the button itself stayed put on the toolbar's own
           minimum. It belongs to the button - if the window is too narrow for it, the page
           scrolls to it. The sub menus open sideways, so sliding moves them up and down instead,
           which is what they want; see below. -->
      <rc-dropdown
        flush
        :placement="'bottom-end'"
        :shift="false"
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
          <div
            ref="viewMenu"
            class="menu-panel view-menu"
          >
            <!-- The View button sits at the right hand end of the toolbar, so the sub menus
                 open to the left of it rather than off screen. They are positioned against this
                 menu rather than the row that opens them: the rows are inset from its edges, and
                 a sub menu belongs alongside the menu, top with top - which lines its first row
                 up with the row that opened it, both panels being inset by the same 3.

                 Opening sideways means the axis they can slide along is the vertical, so `shift`
                 is left on: a list with more rows than there is room below it rides up rather
                 than opening at its placement and scrolling while the space above it goes
                 unused. `menuBoundary` is the region it rides up within; the panel's own
                 max-height caps it at what that region leaves, so a list too long even for the
                 whole of it is the only one that scrolls. -->
            <rc-dropdown-item
              :close-on-click="false"
              :class="{ 'owns-sub-menu': subMenu === 'group' && subMenuHovered }"
              data-testid="table-views-view-group"
              @mouseenter="hoverSubMenu('group')"
              @mouseleave="cancelSubMenuSwitch()"
              @click="openSubMenu('group')"
            >
              {{ t('tableViews.view.groupBy') }}
              <template #after>
                <span class="menu-nav-value">{{ groupLabel }}</span>
                <i class="icon icon-chevron-right" />
              </template>
            </rc-dropdown-item>

            <rc-dropdown-item
              :close-on-click="false"
              :class="{ 'owns-sub-menu': subMenu === 'columns' && subMenuHovered }"
              data-testid="table-views-view-columns"
              @mouseenter="hoverSubMenu('columns')"
              @mouseleave="cancelSubMenuSwitch()"
              @click="openSubMenu('columns')"
            >
              {{ t('tableViews.view.columnsConfiguration') }}
              <template #after>
                <span class="menu-nav-value">{{ columnsSummary }}</span>
                <i class="icon icon-chevron-right" />
              </template>
            </rc-dropdown-item>
            <!-- One popper for both lists, not one each.

                 Two of them meant that moving from one row to the other closed a menu and opened
                 a menu, and those do not happen together: hiding is immediate, showing waits for
                 the popper to be placed. Measured, that left an 18ms window with both mounted and
                 neither shown - which is the blink. With one popper the lists simply change place
                 in it, and there is no moment when nothing is there. -->
            <rc-dropdown
              flush
              :open="subMenu !== null"
              :placement="'left-start'"
              :distance="-1"
              :skidding="-8"
              :flip="false"
              :boundary="menuBoundary"
              :overflow-padding="MENU_GUTTER"
              popper-class="popper-no-fade"
              :reference-node="() => viewMenu"
              @update:open="(open) => closeSubMenu(subMenu, open)"
            >
              <template #dropdownCollection>
                <div
                  v-if="shownSubMenu === 'group'"
                  ref="groupPanel"
                  class="menu-panel"
                  @mouseenter="enterSubMenu()"
                  @mouseleave="subMenuHovered = false"
                >
                  <rc-dropdown-item
                    v-for="option in groupOptions"
                    :key="option.id || 'none'"
                    :class="{ selected: option.id === view.groupBy }"
                    :close-on-click="false"
                    :data-testid="`table-views-group-${ option.id || 'none' }`"
                    @click="toggleGroupBy(option.id)"
                  >
                    {{ option.label }}
                    <template
                      v-if="option.id === view.groupBy"
                      #after
                    >
                      <i class="icon icon-checkmark" />
                    </template>
                  </rc-dropdown-item>
                  <rc-dropdown-separator />
                  <rc-dropdown-item
                    class="menu-reset"
                    :close-on-click="false"
                    data-testid="table-views-group-reset"
                    @click="setGroupBy(null)"
                  >
                    {{ t('tableViews.view.reset') }}
                  </rc-dropdown-item>
                </div>
                <div
                  v-else
                  ref="columnsPanel"
                  class="menu-panel columns-panel"
                  @mouseenter="enterSubMenu()"
                  @mouseleave="subMenuHovered = false"
                >
                  <!-- The list reorders live under the cursor and the rows shuffle on the
                       TransitionGroup's own FLIP move, the same way the pinned shelf does -->
                  <TransitionGroup
                    name="column-row"
                    tag="div"
                    :class="{ 'is-reordering': heldColumnId !== null }"
                  >
                    <rc-dropdown-item
                      v-for="field in orderedColumnFields"
                      :key="field.id"
                      :class="{ 'column-row': true, locked: isCoreColumn(field), shown: isColumnVisible(field), held: heldColumnId === field.id }"
                      :disabled="isCoreColumn(field)"
                      :close-on-click="false"
                      :data-col-id="field.id"
                      :data-testid="`table-views-col-${ field.id }`"
                      @click="toggleColumn(field)"
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
                      <template
                        v-if="isColumnVisible(field)"
                        #after
                      >
                        <i class="icon icon-checkmark" />
                      </template>
                    </rc-dropdown-item>
                  </TransitionGroup>

                  <rc-dropdown-separator />
                  <rc-dropdown-item
                    :close-on-click="false"
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
                    :close-on-click="false"
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
            </rc-dropdown>

            <rc-dropdown-separator />
            <rc-dropdown-item
              class="menu-reset"
              :close-on-click="false"
              data-testid="table-views-reset"
              @mouseenter="hoverSubMenu(null)"
              @mouseleave="cancelSubMenuSwitch()"
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
    // One line, the box and the View button beside it: the box gives way rather than the button
    // wrapping underneath it
    flex-wrap: nowrap;
    // To the top, not the middle. The filter box can grow a line under it, and centring had the
    // View button drift down with it - the button belongs on the box's own line, which is the
    // top of this row whether the box has anything to say or not.
    align-items: flex-start;
    gap: 16px;
    width: 100%;
    // The floor for the whole toolbar. `min-content` rather than a number: it comes out as the
    // filter box at its own minimum, the gap, and the View button at whatever its label needs -
    // so it is right in every language rather than right in this one.
    //
    // Both halves are `width: 100%` of the same masthead column, so the tabs strip above takes
    // the same floor from this without being told. Without it the row kept shrinking after the
    // box had stopped, and the box carried on underneath the View button instead of the page
    // admitting it had run out of room. The table beside it already scrolls sideways, so there
    // is somewhere for this to go.
    min-width: min-content;
  }

  .query-grow {
    flex: 1 1 auto;
  }

  // The box and anything it has to say about itself, stacked - so the notice sits under the box
  // rather than beside it in the toolbar's own row
  .query-column {
    display: flex;
    flex-direction: column;
    // What stands between the box and what it has to say about itself
    gap: 8px;
    min-width: 0;
  }

  // Under the box, the way the product writes a field's validation message under its field:
  // words in the colour that says how to take them, and no box of its own - a tint and a rule
  // would make one line about what was typed read like a notice about the page.
  //
  // One colour for both things the box can say, because both are the same news: what you typed
  // is not what is being answered. Written in body text the ignored-field line read as a caption
  // about the list rather than as something about the query.
  //
  // `--error` and not one of the warning colours. The warm ones the product already holds are
  // each built for a background rather than for words: `--warning` is the yellow a warning is
  // drawn on (1.26:1 over the toolbar) and `--rc-warning` is the brown written on that yellow,
  // which is the same brown in the dark theme and comes out at 1.3:1 there. This is the colour
  // the product's own validation message under a field is written in.
  .query-notice {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0;
    color: var(--error);
    // A step under body text - the size the design gives this message. It was two steps under,
    // which read as a caption about the list rather than as something the box was saying about
    // what had just been typed into it.
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

.menu-panel {
  // The View menu carries a value beside each row - the field grouped by, the columns preset -
  // so it is given more room than a menu of plain commands before those values start crowding
  // the labels they sit against.
  &.view-menu {
    min-width: 300px;
  }

  // The one exception, and it is about where you are rather than how a row looks: while the
  // pointer is inside a sub menu it is over none of the rows here, so the row that opened it
  // would go dark and the menu would stop saying which of them you are in. It keeps the same
  // highlight hovering gives, so the hand back is invisible.
  [dropdown-menu-item].owns-sub-menu {
    background-color: var(--dropdown-hover-bg);
  }

  // What a row that opens a sub menu carries at its end: where that sub menu stands, and the
  // arrow into it. The row itself is an ordinary menu item and is left to the component.
  // The value a sub menu row shows at its end. Styled on itself rather than on the slot holding
  // it, so nothing the dropdown owns is redefined here.
  .menu-nav-value {
    color: var(--muted);
    max-width: 150px;
    margin-right: 8px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  // TransitionGroup's own FLIP move. Re-timed only while a drag is actually in progress, so the
  // rows travel with the held one rather than teleporting into their new slots.
  // Only while a row is actually being carried.
  //
  // TransitionGroup's move is FLIP: it compares where a row was with where it is and animates the
  // difference. The popper is positioned after its contents have mounted, so on opening every row
  // had "moved" by the width of the panel and slid in from the right - an animation of the menu
  // arriving, which is not what the reordering is for. Nothing is being reordered then, so there
  // is nothing to animate.
  .is-reordering .column-row-move {
    transition: transform 0.2s $drag-displace-curve;
  }

  // A row is being carried, so the pointer says so over the whole list - the rows' own `pointer`
  // would otherwise take over the moment the cursor crossed one
  .is-reordering {
    cursor: grabbing;

    [dropdown-menu-item],
    [dropdown-menu-item]:hover,
    .column-handle {
      cursor: grabbing;
    }
  }

  // A row's transform is worth easing only while one is actually being carried. TransitionGroup's
  // FLIP writes a transform whenever the rows look to have moved, and the popper being positioned
  // after its contents mount looks exactly like that - so easing it here slid every row in from the
  // right each time the menu opened. Held rows keep their own timing, set below.
  .is-reordering .column-row {
    transition: background-color 0.1s ease-in-out, transform 0.33s $drag-drop-curve, box-shadow 0.33s $drag-drop-curve;
  }

  // Column rows carry a drag handle (or a lock) and tick only what is shown
  .column-row {
    transition: background-color 0.1s ease-in-out;
    user-select: none;
    .column-handle {
      font-size: 14px;
      cursor: grab;
    }

    // The grip is furniture, so it stays neutral. The lock is not - it belongs to the column it
    // is locking, and takes that row's colour.
    .grip {
      color: var(--muted);
    }

    // Two short bars - the handle that says a row can be dragged. Drawn rather than taken from
    // the icon font, which has no grip glyph.
    .grip {
      position: relative;
      display: inline-block;
      // The width the lock icon beside it takes, so a draggable row and a locked one start their
      // label in the same place. The bars keep their own width inside it.
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

    // A locked column is shown and cannot be turned off, so it reads as the same colour the other
    // shown ones do, only fainter. Grey said "off", when the column is very much on - it is the
    // switch that is unavailable, not the column. Mixed from the same token so it follows the
    // brand with the rest of them, at the half strength the design draws the whole row in - lock,
    // name and tick together, all off one inherited colour.
    &.locked {
      color: color-mix(in srgb, var(--active, var(--primary)) 50%, transparent);
      cursor: default;

      .column-handle { cursor: default; }
    }

    // The row being carried, lifted off the list the way a dragged shelf row is
    // Lifted exactly the way the app bar's pinned shelf lifts a row it is carrying - the same
    // tint, scale, shadow and timings - so a drag looks the same everywhere in the product.
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
