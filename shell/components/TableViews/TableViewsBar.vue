<script setup lang="ts">
/**
 * The toolbar above a resource table - filter query, column picker, group by, export and
 * saved views.
 *
 * All of the state lives in the `view` prop so the owning table can apply it; this
 * component only owns the saved view list (stored as a user preference).
 */
import {
  computed, nextTick, onBeforeUnmount, onMounted, ref, watch
} from 'vue';
import { useStore } from 'vuex';

import AppModal from '@shell/components/AppModal.vue';
import TableViewExportModal from '@shell/components/TableViews/TableViewExportModal.vue';
import TableViewQueryInput from '@shell/components/TableViews/TableViewQueryInput.vue';
import { useI18n } from '@shell/composables/useI18n';
import { TABLE_VIEWS } from '@shell/store/prefs';
import { isMac, shortcutLabel } from '@shell/utils/platform';
import { randomStr } from '@shell/utils/string';
import { validateQuery } from '@shell/utils/table-views/query';
import { isViewDirty, moveInOrder, selectedViewIdFor } from '@shell/utils/table-views/views';
import type { SavedView, ViewField, ViewState } from '@shell/types/table-views';
import { RcDropdown, RcDropdownItem, RcDropdownSeparator, RcDropdownTrigger } from '@components/RcDropdown';

/** How far the pointer travels with a row held before it counts as a drag rather than a click */
const DRAG_THRESHOLD = 4;

/** Clears the handle's tooltip of the row's hover highlight rather than sitting over the handle */
const TOOLTIP_DISTANCE = 12;

/** Where a saved view's key bindings apply, and what they do */
const SHORTCUTS = [
  {
    key: 's', shift: false, action: 'saveChanges'
  },
  {
    key: 's', shift: true, action: 'openSaveAsNew'
  },
  {
    key: 'd', shift: false, action: 'duplicateCurrent'
  },
] as const;

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

/** How close to an end of the tab strip a held tab has to come before the strip runs that way */
const TAB_SCROLL_EDGE = 56;

/** How fast it runs, per frame */
const TAB_SCROLL_STEP = 12;

/** How long to wait for that run to finish before marking the tab anyway */
const TAB_SCROLL_SETTLE_MAX_MS = 1200;

/** How long the tab that moved is marked for afterwards - the wash's own length */
const TAB_FLASH_MS = 600;

/**
 * How long a deleted view can be had back.
 *
 * Longer than a growl's usual five seconds: this one is not telling you something you already
 * know, it is the only way back from something that is otherwise gone, and it takes a moment to
 * notice a tab has vanished and decide you wanted it.
 */
const UNDO_TIMEOUT = 10000;

/**
 * How close to an edge of the page's content region a sub menu may come.
 *
 * Applied to every edge, so a menu slid up to stay on screen stops this far under the masthead
 * and a menu at the bottom stops this far above the fold.
 */
const MENU_GUTTER = 16;

interface Tab {
  id: string | null;
  name: string;
  view?: SavedView;
  isDefaultTab?: boolean;
}

/** The table's own tab has no id, and null is also what "nothing" looks like - so it is named */
function tabKey(tab: { id?: string | null }) {
  return tab.id || 'all';
}

const props = withDefaults(defineProps<{
  /**
   * { query, columns, labelColumns, groupBy }
   */
  view: ViewState,
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
  fields?: ViewField[],
  /**
   * Fields offered in the group by menu. Grouping is a sort, so this can be narrower than
   * `fields` - server side only indexed fields can be grouped on. Defaults to all fields.
   */
  groupFields?: ViewField[] | null,
  /**
   * Fields offered as filter suggestions. Narrower than `fields` for the same reason
   * `groupFields` is - server side only indexed fields can be filtered on. Defaults to all
   * fields.
   */
  filterFields?: ViewField[] | null,
  /**
   * fieldId -> values in use, fetched from the api. Falls back to scanning `rows` when a field
   * has nothing here yet.
   */
  fieldValues?: Record<string, { value: string, count: number }[]>,
  /** All rows, before the view query is applied. Used for value autocomplete */
  rows?: any[],
  /** How many rows the view query leaves */
  matchCount?: number,
  /**
   * query -> how many rows it matches, counted by the owning table in its own right rather
   * than read off the rows on screen. Shown on the tabs, so someone can see what a view holds
   * without opening it.
   */
  viewCounts?: Record<string, number | null>,
  /** Plural display name of what the table holds ("clusters"), for the export modal */
  resourceLabel?: string,
  /** Key the saved views are stored under, normally the resource type */
  resourceType?: string,
  /**
   * Which part of the bar to render:
   *  - 'all'      (default) both the view tabs and the filter/View controls
   *  - 'tabs'     only the view tabs row
   *  - 'controls' only the filter + single "View" popup, laid out to fill one toolbar line
   * Two instances (tabs + controls) stay in sync because all state comes from props and the
   * shared TABLE_VIEWS preference.
   */
  part?: string,
}>(), {
  coreColumns:       () => [],
  defaultColumns:    () => [],
  unsupportedFields: () => [],
  fields:            () => [],
  groupFields:       null,
  filterFields:      null,
  fieldValues:       () => ({}),
  rows:              () => [],
  matchCount:        0,
  viewCounts:        () => ({}),
  resourceLabel:     '',
  resourceType:      '',
  part:              'all',
});

const emit = defineEmits<{
  'update:view': [view: ViewState],
  export: [args: { format: string, name: string }],
  'request-values': [fieldId: string],
  'tab-queries': [queries: string[]],
}>();

const store = useStore();
const { t } = useI18n(store);

const root = ref<HTMLElement | null>(null);
const tabStrip = ref<HTMLElement | null>(null);
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

/**
 * The tab-level elements, by tab key. Function refs rather than named ones because there is a
 * set of them per tab and they are looked up by whichever tab is being acted on.
 */
const tabWraps = new Map<string, HTMLElement>();
const tabButtons = new Map<string, HTMLElement>();
const tabCarets = new Map<string, any>();
const renameInputs = new Map<string, HTMLInputElement>();

const keepRef = <T, >(map: Map<string, T>, key: string, el: T | null) => {
  if (el) {
    map.set(key, el);
  } else {
    map.delete(key);
  }
};

/** True while the caret is in the query box, so it is not corrected mid-word */
const queryFocused = ref(false);
/**
 * The tab the user picked, so we can offer save/discard against it and light it up.
 *
 * Three states: `undefined` if nothing has been picked here yet, `null` for the default
 * tab, or the id of a saved view. The default tab has to be distinguishable from "nothing
 * picked", or a saved view holding the same config as it is matched instead.
 */
const pickedViewId = ref<string | null | undefined>(undefined);
/**
 * Unsaved edits, per tab, for as long as the page is open. Leaving a tab with changes on it
 * holds on to them so coming back finds them where they were, and the tab keeps its mark
 * while you are elsewhere. A reload is where they end - nothing here is written down.
 */
const drafts = ref<Record<string, ViewState>>({});
/** Which modal is open, if any: { kind: 'export', view } */
const modal = ref<{ kind: string, view: SavedView | null } | null>(null);
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
/** id of the view being renamed in place, and the name being typed for it */
const renamingId = ref<string | null>(null);
const renameDraft = ref('');
/**
 * Column picker drag. `dragId` is the row being held; `dragOrder` is the ids in the order
 * the list is showing them mid-drag, which is what lets the rows shuffle under the cursor
 * instead of waiting for the drop. `dragSlots` are the places the rows sat when the drag
 * began - see captureColumnSlots for why they are taken once rather than read live.
 */
const dragId = ref<string | null>(null);
const dragOrder = ref<string[] | null>(null);
const dragMoved = ref(false);
const dragFrom = ref<{ id: string, y: number } | null>(null);
const dragPointerY = ref(0);
const dragSlots = ref<{ top: number, bottom: number }[] | null>(null);
const dragStartOrder = ref<string[] | null>(null);
/**
 * Tab drag, the same shape as the column one a few lines up but along the strip rather than
 * down a list. `tabDragOrder` is the tab keys in the order the pointer has put them.
 */
const tabDragFrom = ref<{ key: string, x: number } | null>(null);
const tabDragId = ref<string | null>(null);
const tabDragMoved = ref(false);
const tabDragPointerX = ref(0);
const tabDragBounds = ref<number[] | null>(null);
const tabDragOrder = ref<string[] | null>(null);
const tabDragStartOrder = ref<string[] | null>(null);
/** Which tab's own menu is open, so it can be closed when the strip moves under it */
const openTabMenuId = ref<string | null>(null);
/** The tab to draw attention to once the strip has finished running back to it */
const flashTabId = ref<string | null>(null);

let subMenuTimer: any = null;
let flashTimer: any = null;
let flashFrame = 0;
let tabScrollFrame = 0;

const allSavedViews = computed({
  get: () => store.getters['prefs/get'](TABLE_VIEWS),
  set: (value) => store.dispatch('prefs/set', { key: TABLE_VIEWS, value }),
});

/**
 * What is wrong with the query, once the user has stopped writing it.
 *
 * Held back while the box has the caret: `state:` is a field with no value, and it is also
 * the halfway point of typing `state:active` - with the values for it on screen at that very
 * moment. Correcting someone mid-word is noise, so this waits until they look away.
 */
const shownProblems = computed(() => (queryFocused.value ? [] : validateQuery(props.view.query, props.fields)));

/**
 * The shortcuts as this keyboard writes them.
 *
 * The handler already answers to either modifier, so only the label was wrong: it read
 * "CMD-S" on every machine, which is neither what a Mac draws nor what Windows calls the key.
 * `shortcutLabel` is what the rest of the product spells its own shortcuts with.
 */
const shortcuts = computed(() => {
  const modifier = isMac ? '⌘' : 'Ctrl';

  return {
    save:      shortcutLabel([modifier, 'S']),
    saveAsNew: shortcutLabel([modifier, 'Shift', 'S']),
    duplicate: shortcutLabel([modifier, 'D']),
  };
});

/** What the toolbar says about the part of the query that could not be run */
const unsupportedNotice = computed(() => t('tableViews.query.unsupported', {
  count:  props.unsupportedFields.length,
  fields: props.unsupportedFields.join(', '),
}, true));

const problemNotice = (problem: any) => t(`tableViews.query.problem.${ problem.kind }`, { text: problem.text, label: problem.label || '' }, true);

/**
 * Everything the box has to say about what is in it, for the status icon at its right.
 *
 * A query that cannot be read as written comes first and on its own - saying a field is
 * unfilterable while the query also ends in `and` answers a question nobody asked yet.
 */
const queryStatusMessage = computed(() => {
  if (shownProblems.value.length) {
    return shownProblems.value.map((problem: any) => problemNotice(problem)).join('<br>');
  }

  return props.unsupportedFields.length ? unsupportedNotice.value : '';
});

/**
 * A query that cannot be read is an error - nothing is being filtered by it. A field the
 * server cannot filter on is not: the rest of the query still ran.
 */
const queryStatus = computed(() => (shownProblems.value.length ? 'error' : 'info'));

const savedViews = computed<SavedView[]>(() => allSavedViews.value?.[props.resourceType]?.views || allSavedViews.value?.[props.resourceType] || []);

/**
 * The view applied when the list is first opened, if the user has set one
 */
const defaultViewId = computed<string | null>(() => allSavedViews.value?.[props.resourceType]?.defaultViewId || null);

/**
 * Where the table's own tab sits among the saved ones.
 *
 * It is not a saved view, so it has no place in that list to hold - but it can be dragged
 * about like any other tab, so its place has to be kept somewhere. Missing means the front,
 * which is where it was before it could be moved.
 */
const allTabIndex = computed(() => {
  const at = allSavedViews.value?.[props.resourceType]?.allIndex;

  return Math.min(Math.max(Number.isInteger(at) ? at : 0, 0), savedViews.value.length);
});

/**
 * The strip as it is saved, before a drag in progress rearranges it - see `tabs`.
 *
 * The table as it comes, then the saved views - except that the view the list opens on leads,
 * and the table's own tab follows it. The first tab is the one you land on, so the one that is
 * actually applied on arrival belongs there - and having marked a view as the default, watching
 * it stay wherever it happened to sit was the menu saying one thing and the strip another.
 * Neither of those two can be dragged out of the first two places; see `lockedTabCount`.
 */
const baseTabs = computed<Tab[]>(() => {
  const all: Tab = {
    id: null, name: t('tableViews.tabs.all'), isDefaultTab: true
  };
  const tabs: Tab[] = savedViews.value.map((view) => ({
    id: view.id, name: view.name, view
  }));

  tabs.splice(allTabIndex.value, 0, all);

  // The one the list opens on leads, wherever it had been put. With nothing set that is the
  // table's own tab, which is what an empty default means.
  const lead = tabs.findIndex((tab) => (defaultViewId.value ? tab.view?.id === defaultViewId.value : tab.isDefaultTab));

  if (lead <= 0) {
    return tabs;
  }

  return [tabs[lead]].concat(tabs.filter((_, i) => i !== lead));
});

/** Mid-drag the strip follows the pointer rather than the saved order */
const tabs = computed<Tab[]>(() => {
  if (!tabDragOrder.value) {
    return baseTabs.value;
  }

  const byKey: Record<string, Tab> = {};

  baseTabs.value.forEach((tab) => {
    byKey[tabKey(tab)] = tab;
  });

  return tabDragOrder.value.map((key) => byKey[key]).filter(Boolean);
});

/**
 * How many tabs at the head of the strip are held there: the one the list opens on, and only
 * that one. It leads because it is the tab you arrive at, so it cannot be dragged out of the
 * front and nothing can be dropped in front of it. Everything else moves freely, the table's
 * own tab included - it is only pinned to the front while it is itself the default.
 */
const lockedTabCount = computed(() => 1);

const columnFields = computed(() => props.fields.filter((f) => !f.isLabel));

/**
 * The handle's tooltip. Empty content is how the directive is told to show nothing, so the
 * tooltip goes the moment a row is picked up rather than riding along with it.
 *
 * Far enough left to clear the row's hover highlight: on the handle itself it sat over the
 * thing being dragged, which is the one place it is in the way.
 */
const reorderTip = computed(() => ({
  content: dragId.value ? '' : t('tableViews.columns.reorder'), placement: 'left', distance: TOOLTIP_DISTANCE
}));

const lockedTip = computed(() => ({
  content: t('tableViews.columns.locked'), placement: 'left', distance: TOOLTIP_DISTANCE
}));

/**
 * Columns in the order the view puts them, so the picker reads the way the table does
 */
const orderedColumnFields = computed(() => {
  // Mid-drag the list follows the pointer rather than the saved order
  const order = dragOrder.value || props.view.columnOrder;

  if (!order?.length) {
    return columnFields.value;
  }

  const byId: Record<string, ViewField> = {};

  columnFields.value.forEach((f) => {
    byId[f.id] = f;
  });

  const out = order.map((id: string) => byId[id]).filter((f) => !!f);

  return out.concat(columnFields.value.filter((f) => !order.includes(f.id)));
});

const isColumnVisible = (field: ViewField) => {
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

/**
 * The saved view the current state was applied from, if it still exists
 */
const editingView = computed(() => savedViews.value.find((v) => v.id === pickedViewId.value) || null);

/** Which saved view the tab bar shows as selected - see `selectedViewIdFor` */
const selectedViewId = computed(() => selectedViewIdFor(savedViews.value, props.view, pickedViewId.value));

/**
 * The one tab in the strip that Tab can land on. A tablist is a single stop and the arrows
 * walk it from there, so the tab holding the current view carries the tabindex and the rest
 * are reachable only through it. If the current view is not among the tabs - a deleted one,
 * say - the first tab takes it, or the strip would have no way in at all.
 */
const focusableTabId = computed(() => {
  const list = tabs.value || [];
  const selected = list.find((tab) => tab.id === selectedViewId.value);

  return (selected || list[0])?.id;
});

/** Unsaved changes: either edits on top of a saved view, or an unsaved view of one's own */
const isDirty = computed(() => isViewDirty(savedViews.value, props.view, pickedViewId.value));

/** What a saved view keeps of the state in front of the user */
const viewToSave = computed(() => ({
  query:          props.view.query || '',
  columns:        props.view.columns || null,
  columnOrder:    props.view.columnOrder || null,
  labelColumns:   props.view.labelColumns || [],
  groupBy:        props.view.groupBy || null,
  sort:           props.view.sort || null,
  sortDescending: !!props.view.sortDescending,
}));

/** The default tab has no id of its own, so it needs a key of its own */
const draftKey = (id: string | null | undefined) => id || '__default';

/**
 * What a tab is actually filtering by: the box for the tab in front of the user, the edits
 * held for a tab left with some, and the saved query for the rest.
 *
 * Counts are looked up by query and never taken from the table's own rows, so a tab keeps its
 * number while the list goes off to fetch a page instead of falling to zero.
 */
const tabQuery = (tab: Tab) => {
  if (tab.id === selectedViewId.value) {
    return props.view.query || '';
  }

  const draft = drafts.value[draftKey(tab.id)];

  return (draft ? draft.query : tab.view?.query) || '';
};

/** Every query on show, so the table knows which counts it has to go and get */
const tabQueries = computed(() => Array.from(new Set(tabs.value.map((tab) => tabQuery(tab)))));

const tabCount = (tab: Tab) => props.viewCounts[tabQuery(tab)];

const tabLabel = (tab: Tab) => {
  const count = tabCount(tab);

  // undefined: not counted yet. null: asked, and the api wouldn't say. Either way the tab
  // shows its name rather than a number that isn't true.
  return count === undefined || count === null ? tab.name : t('tableViews.tabs.count', { name: tab.name, count });
};

const isTabDirty = (tab: Tab) => {
  if (tab.id === selectedViewId.value) {
    return isDirty.value;
  }

  return !!drafts.value[draftKey(tab.id)];
};

const update = (changes: Partial<ViewState>) => emit('update:view', { ...props.view, ...changes });

const isCoreColumn = (field: ViewField) => !!field?.id && props.coreColumns.includes(field.id);

const toggleColumn = (field: ViewField) => {
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
 * Is `target` part of this table's toolbar - its tabs, its filter, or its View menu?
 *
 * Both halves of the bar live in the same table masthead, so that is what is compared. A
 * second table on the page has its own, and keeps its own shortcuts.
 */
const ownsTarget = (target: any) => {
  // The component has a modal beside its bar, so its root is a fragment whose first node may
  // not be an element at all - hence a ref of its own rather than the root node
  const el = root.value;

  if (!el?.closest || !target?.closest) {
    return false;
  }

  // The toolbar and the table under it together: they are one list as far as the user is
  // concerned, and a shortcut pressed while reading the rows belongs to the list being read.
  // The masthead is the fallback for a table that is not in table views layout.
  const listOf = (node: HTMLElement) => node.closest('.has-table-views') || node.closest('.fixed-header-actions');
  const mine = listOf(el);

  return !!mine && listOf(target) === mine;
};

/**
 * Eat the click that a mouseup at the end of a drag is about to produce.
 *
 * It would land on whatever the pointer finished over - the row it was dropped on, or the tab
 * it was dropped beside - and toggle or apply it. A drag is not a click.
 */
const swallowNextClick = () => {
  const swallow = (event: MouseEvent) => {
    event.stopPropagation();
    event.preventDefault();
  };

  window.addEventListener('click', swallow, { capture: true, once: true });
  setTimeout(() => window.removeEventListener('click', swallow, true), 0);
};

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

  dragSlots.value = Array.from(rows).map((el) => {
    const box = el.getBoundingClientRect();

    return { top: box.top - origin, bottom: box.bottom - origin };
  });
};

/**
 * Which row the pointer is over. Past either end it clamps, so dragging beyond the last row
 * parks the column at the end rather than abandoning the move.
 */
const columnIndexAt = (clientY: number) => {
  const slots = dragSlots.value || [];
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

/** Put the held row where the pointer is, so the rest shuffle around it as it travels */
const placeDraggedColumn = () => {
  const order = dragOrder.value || [];
  const from = order.indexOf(dragId.value as string);
  const at = columnIndexAt(dragPointerY.value);

  if (from === -1 || at === -1) {
    return;
  }

  dragOrder.value = moveInOrder(order, from, Math.max(at, firstMovableIndex(order)));
};

const beginColumnDrag = () => {
  if (dragMoved.value || !dragFrom.value) {
    return;
  }

  dragMoved.value = true;
  dragId.value = dragFrom.value.id;
  dragOrder.value = orderedColumnFields.value.map((f) => f.id);
  dragStartOrder.value = [...dragOrder.value];
  captureColumnSlots();
  // The list's own rows are told to say `grabbing` in CSS; this is for everywhere else the
  // pointer can go while still carrying a row.
  document.body.style.cursor = 'grabbing';
};

const onColumnDragMove = (event: MouseEvent) => {
  if (!dragFrom.value) {
    return;
  }

  dragPointerY.value = event.clientY;

  if (!dragMoved.value && Math.abs(event.clientY - dragFrom.value.y) < DRAG_THRESHOLD) {
    return;
  }

  beginColumnDrag();
  placeDraggedColumn();
};

const endColumnDrag = (commit: boolean) => {
  window.removeEventListener('mousemove', onColumnDragMove, true);
  // eslint-disable-next-line @typescript-eslint/no-use-before-define
  window.removeEventListener('mouseup', onColumnDragEnd, true);
  // eslint-disable-next-line @typescript-eslint/no-use-before-define
  window.removeEventListener('keydown', onColumnDragKey, true);

  const started = dragStartOrder.value || [];
  const order = dragOrder.value;
  const moved = !!order && order.some((id, i) => id !== started[i]);

  if (dragMoved.value) {
    swallowNextClick();
  }

  document.body.style.cursor = '';

  dragFrom.value = null;
  dragId.value = null;
  dragMoved.value = false;
  dragSlots.value = null;
  dragStartOrder.value = null;
  dragOrder.value = null;

  if (commit && moved) {
    update({ columnOrder: order });
  }
};

/** Escape abandons the drag: the list snaps back to the view, and nothing is written */
function onColumnDragKey(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    endColumnDrag(false);
  }
}

function onColumnDragEnd() {
  endColumnDrag(dragMoved.value);
}

/**
 * Press on a column's grip: arm a possible drag. Nothing is picked up here - a press on a row
 * is far more often the start of a click that toggles the column - so the row is only taken
 * once the pointer has travelled `DRAG_THRESHOLD` with it held.
 */
const startColumnDrag = (id: string, event: MouseEvent) => {
  if (event.button !== 0) {
    return;
  }

  // Otherwise the pointer selects the labels it crosses on the way
  event.preventDefault();

  dragFrom.value = { id, y: event.clientY };
  dragMoved.value = false;

  window.addEventListener('mousemove', onColumnDragMove, true);
  window.addEventListener('mouseup', onColumnDragEnd, true);
  window.addEventListener('keydown', onColumnDragKey, true);
};

/**
 * The tab a menu belongs to, for the menu to line itself up against.
 */
const tabWrap = (tab: Tab) => tabWraps.get(tabKey(tab));

/** The tab's own button */
const tabButton = (tab: Tab) => tabButtons.get(tabKey(tab));

/** The chevron that opens the tab's menu - a component, so its element is one step down */
const tabCaret = (tab: Tab) => {
  const cmp = tabCarets.get(tabKey(tab));

  return cmp?.$el || cmp;
};

/**
 * Shut whichever tab's menu is open.
 *
 * The menu is positioned against its tab, so anything that moves the tab out from under it -
 * the strip scrolling, or the tab itself being picked up - leaves the menu pointing at
 * nothing. Closing it is the honest answer.
 */
const closeTabMenus = () => {
  openTabMenuId.value = null;
};

/**
 * The places the tabs occupy, measured once as the drag begins.
 *
 * Fixed, and that is the whole point. Working the places out from the order the pointer has
 * currently put things in feeds the answer back into the question: passing the tab to your
 * right swaps the two, which puts the boundary you just crossed back under the pointer, so
 * it swaps again - and the pair flickers between the two arrangements while you hold still.
 * Measuring once leaves a fixed ladder to read the pointer against.
 *
 * Kept relative to the list rather than to the window, so the strip scrolling under a held
 * tab does not move the rungs.
 */
const captureTabSlots = () => {
  const list = tabStrip.value?.querySelector('.view-tabs-list');

  if (!list) {
    return;
  }

  const base = list.getBoundingClientRect().left;
  const boxes = baseTabs.value.map((tab) => {
    const rect = tabWrap(tab)?.getBoundingClientRect();

    return rect ? { left: rect.left - base, right: rect.right - base } : null;
  }).filter(Boolean) as { left: number, right: number }[];

  // The line between one tab and the next, which is the middle of the gap they sit either
  // side of. A tab changes places when the pointer crosses one of these, the way a column row
  // changes places when the pointer enters the row below it - not at the far tab's middle,
  // which meant carrying a tab halfway across its neighbour before anything happened.
  tabDragBounds.value = boxes.slice(0, -1).map((box, i) => (box.right + boxes[i + 1].left) / 2);
};

/** Where along the strip the pointer is, in the strip's own scrolled-out width */
const tabContentX = () => {
  const strip = tabStrip.value;
  const list = strip?.querySelector('.view-tabs-list');

  if (!strip || !list) {
    return 0;
  }

  return tabDragPointerX.value - list.getBoundingClientRect().left;
};

/** How many of the lines measured at the start the pointer has crossed */
const tabIndexAt = (contentX: number) => {
  const bounds = tabDragBounds.value || [];
  let i = 0;

  while (i < bounds.length && contentX >= bounds[i]) {
    i++;
  }

  return i;
};

/** Put the held tab where the pointer is, so the rest shuffle around it as it travels */
const placeDraggedTab = () => {
  if (!tabDragOrder.value) {
    return;
  }

  const from = tabDragOrder.value.indexOf(tabDragId.value as string);
  const to = Math.max(tabIndexAt(tabContentX()), lockedTabCount.value);

  tabDragOrder.value = moveInOrder(tabDragOrder.value, from, to);
};

/**
 * Carrying a tab to an end of the strip runs the strip that way, so a tab can be taken
 * somewhere that is not on screen yet. A frame loop rather than something driven by the
 * pointer: holding still at the edge should keep going.
 */
const runTabScroll = () => {
  const step = () => {
    if (!tabDragMoved.value) {
      return;
    }

    const strip = tabStrip.value;

    if (strip) {
      const rect = strip.getBoundingClientRect();

      if (tabDragPointerX.value < rect.left + TAB_SCROLL_EDGE) {
        strip.scrollLeft -= TAB_SCROLL_STEP;
        placeDraggedTab();
      } else if (tabDragPointerX.value > rect.right - TAB_SCROLL_EDGE) {
        strip.scrollLeft += TAB_SCROLL_STEP;
        placeDraggedTab();
      }
    }

    tabScrollFrame = requestAnimationFrame(step);
  };

  cancelAnimationFrame(tabScrollFrame);
  tabScrollFrame = requestAnimationFrame(step);
};

const beginTabDrag = () => {
  if (tabDragMoved.value || !tabDragFrom.value) {
    return;
  }

  tabDragMoved.value = true;
  closeTabMenus();
  tabDragId.value = tabDragFrom.value.key;
  tabDragOrder.value = baseTabs.value.map(tabKey);
  tabDragStartOrder.value = [...tabDragOrder.value];
  captureTabSlots();
  // Otherwise the pointer selects the tab names it crosses on the way
  window.getSelection()?.removeAllRanges();
  document.body.style.cursor = 'grabbing';
  runTabScroll();
};

const onTabDragMove = (event: MouseEvent) => {
  if (!tabDragFrom.value) {
    return;
  }

  tabDragPointerX.value = event.clientX;

  if (!tabDragMoved.value && Math.abs(event.clientX - tabDragFrom.value.x) < DRAG_THRESHOLD) {
    return;
  }

  beginTabDrag();
  placeDraggedTab();
};

const persistAll = (views: SavedView[], viewId: string | null, allIndex: number = allTabIndex.value) => {
  // A view that no longer exists can't be the default one
  const validDefault = views.find((v) => v.id === viewId) ? viewId : null;

  allSavedViews.value = {
    ...(allSavedViews.value || {}),
    [props.resourceType]: {
      views,
      defaultViewId: validDefault,
      allIndex:      Math.min(Math.max(allIndex, 0), views.length)
    }
  };
};

const persist = (views: SavedView[]) => persistAll(views, defaultViewId.value);

const endTabDrag = (commit: boolean) => {
  window.removeEventListener('mousemove', onTabDragMove, true);
  // eslint-disable-next-line @typescript-eslint/no-use-before-define
  window.removeEventListener('mouseup', onTabDragEnd, true);
  // eslint-disable-next-line @typescript-eslint/no-use-before-define
  window.removeEventListener('keydown', onTabDragKey, true);
  cancelAnimationFrame(tabScrollFrame);

  const started = tabDragStartOrder.value || [];
  const order = tabDragOrder.value;
  const moved = !!order && order.some((key, i) => key !== started[i]);

  if (tabDragMoved.value) {
    swallowNextClick();
  }

  document.body.style.cursor = '';

  tabDragFrom.value = null;
  tabDragId.value = null;
  tabDragMoved.value = false;
  tabDragBounds.value = null;
  tabDragStartOrder.value = null;

  if (commit && moved && order) {
    const byId: Record<string, SavedView> = {};

    savedViews.value.forEach((view) => {
      byId[view.id] = view;
    });

    // The table's own tab is not one of the saved views, so its place is kept beside them
    persistAll(order.map((key) => byId[key]).filter(Boolean), defaultViewId.value, order.indexOf('all'));
  }

  tabDragOrder.value = null;
};

/** Escape abandons the drag: the strip snaps back to the saved order, and nothing is written */
function onTabDragKey(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    endTabDrag(false);
  }
}

function onTabDragEnd() {
  endTabDrag(tabDragMoved.value);
}

/**
 * Press on a tab: arm a possible drag.
 *
 * Nothing is picked up here. A press on a tab is far more often the start of a click that
 * selects the view, so the tab is only taken once the pointer has travelled DRAG_THRESHOLD
 * with it held - and the click that would follow the drop is swallowed in endTabDrag.
 */
const startTabDrag = (tab: Tab, event: MouseEvent) => {
  const key = tabKey(tab);

  if (event.button !== 0 || renamingId.value || baseTabs.value.findIndex((t) => tabKey(t) === key) < lockedTabCount.value) {
    return;
  }

  tabDragFrom.value = { key, x: event.clientX };
  tabDragMoved.value = false;

  window.addEventListener('mousemove', onTabDragMove, true);
  window.addEventListener('mouseup', onTabDragEnd, true);
  window.addEventListener('keydown', onTabDragKey, true);
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

const forgetDraft = (id: string | null | undefined) => {
  const key = draftKey(id);

  if (!drafts.value[key]) {
    return;
  }

  const rest = { ...drafts.value };

  delete rest[key];
  drafts.value = rest;
};

/**
 * Hold on to the tab being left, if it has changes worth keeping. A tab left in the state it
 * was saved in has nothing to hold, so anything held for it is let go.
 */
const rememberDraft = (id: string | null | undefined) => {
  const key = draftKey(id);

  if (isDirty.value) {
    drafts.value = { ...drafts.value, [key]: { ...props.view } };

    return;
  }

  forgetDraft(id);
};

/**
 * @param saved the view to show, or null for the default tab
 * @param useDraft whether unsaved edits left on that tab should come back with it. Off for
 *        the paths whose whole purpose is to put a tab back the way it was saved.
 */
const applyView = (saved: SavedView | null, useDraft = true) => {
  const from = selectedViewId.value;
  const to = saved?.id || null;
  const moving = from !== to;

  // Clicking the tab already in front of you is not a request to throw away what is on it.
  // Discarding says so outright, and comes through here with `useDraft` off.
  if (!moving && useDraft) {
    pickedViewId.value = to;

    return;
  }

  // Before the pick moves: what counts as unsaved is measured against the tab being left, and
  // moving the pick first measures it against the one being arrived at, which marks every tab
  // left behind as changed whether anything was typed into it or not.
  if (moving) {
    rememberDraft(from);
  }

  pickedViewId.value = to;

  const draft = useDraft ? drafts.value[draftKey(to)] : null;

  if (draft) {
    emit('update:view', { ...draft });

    return;
  }

  emit('update:view', {
    query:          saved?.query || '',
    columns:        saved?.columns || null,
    columnOrder:    saved?.columnOrder || null,
    labelColumns:   saved?.labelColumns || [],
    groupBy:        saved?.groupBy || null,
    sort:           saved?.sort || null,
    sortDescending: saved?.sortDescending || false,
  });
};

/**
 * Put the view back the way it was - either the saved view being edited, or nothing at all
 */
const discardChanges = () => {
  forgetDraft(selectedViewId.value);
  applyView(editingView.value, false);
};

/**
 * Put the keyboard on a view's tab once it exists, and bring the tab into sight with it: a
 * view you just made or just copied should be the one in front of you.
 *
 * `toEnd` is for those two. A new view goes on the end of the strip, so rather than working
 * out where its tab has landed - which the strip has not finished laying out at the moment it
 * is asked - the strip is simply run to its far end, where the tab must be.
 */
const focusTab = (id: string | null, toEnd = false) => {
  nextTick(() => {
    const tab = (tabs.value || []).find((candidate) => candidate.id === id);
    const btn = tab && tabButton(tab);

    if (!btn) {
      return;
    }

    // Focus scrolls the strip by itself, which would fight the run to the end below
    btn.focus({ preventScroll: !!toEnd });

    if (!toEnd) {
      btn.scrollIntoView({ block: 'nearest', inline: 'nearest' });

      return;
    }

    // A frame later, so the tab that has just been added is in the strip's width
    requestAnimationFrame(() => {
      const strip = tabStrip.value;

      if (strip) {
        strip.scrollLeft = strip.scrollWidth;
      }
    });
  });
};

/**
 * Rename in place. The name lives on the tab, so that is where it is edited - a modal to
 * change one word puts the thing being renamed behind the thing renaming it.
 */
const openRename = (saved?: { id?: string, name?: string } | null) => {
  if (!saved?.id) {
    return;
  }

  renamingId.value = saved.id;
  renameDraft.value = saved.name || '';

  nextTick(() => {
    const input = renameInputs.get(saved.id as string);

    input?.focus();
    input?.select();
  });
};

/**
 * `base`, or the first number after it that no view is called yet.
 *
 * `from` is where the counting starts: a new view is just "Untitled" until there is one, so
 * the second is "Untitled 1"; a copy is "X (copy)" and the next is "X (copy) 2", which reads
 * as the second copy rather than as a second thing called copy.
 */
const unusedViewName = (base: string, from: number) => {
  let name = base;
  let n = from;

  while (savedViews.value.find((v) => v.name === name)) {
    name = `${ base } ${ n++ }`;
  }

  return name;
};

const nextNewViewName = () => unusedViewName(t('tableViews.tab.newViewName'), 1);

/**
 * Copy a saved view, so a variation can be built without losing the original
 */
const duplicateView = (saved: any) => {
  const name = unusedViewName(`${ saved.name } ${ t('tableViews.tab.copySuffix') }`, 2);
  const copy = {
    ...saved, id: randomStr(8), name
  };

  persist(savedViews.value.concat([copy]));
  applyView(copy);
  focusTab(copy.id, true);
  // A copy is named after the thing it was copied from, which is never what you wanted it
  // called - so the name is already open for typing by the time the tab is in front of you
  nextTick(() => openRename(copy));
};

const updateView = (saved: SavedView) => persist(savedViews.value.map((v) => (v.id === saved.id ? { ...v, ...viewToSave.value } : v)));

/**
 * Keep the changes on the tab as a view of their own.
 *
 * The same act as copying a tab, and it lands the same way - the new tab in front of you with
 * its name open for typing. The only difference is what is copied: the tab as it stands with
 * the unsaved changes on it, rather than the view as it was last saved.
 *
 * It used to ask for the name in a modal first. A modal to take one word put the thing being
 * named behind the thing naming it, and it was the one place in the toolbar where naming a
 * view did not happen on the tab itself.
 */
const openSaveAsNew = () => {
  if (!isDirty.value && pickedViewId.value === undefined) {
    return;
  }

  duplicateView({ ...viewToSave.value, name: editingView.value?.name || t('tableViews.tabs.all') });
};

const saveChanges = () => {
  if (editingView.value) {
    updateView(editingView.value);
  } else if (isDirty.value) {
    // The default tab can't be saved over, and an unsaved view has nothing to save over, so
    // either way what is being asked for is a new view - and it needs a name
    openSaveAsNew();
  }
};

/**
 * A new tab starts life as an unsaved "New View" holding the table's defaults, so it can be
 * built up in place and named when it is worth keeping
 */
const addView = () => {
  const view = {
    id:           randomStr(8),
    name:         nextNewViewName(),
    query:        '',
    columns:      null,
    columnOrder:  null,
    labelColumns: [],
    groupBy:      null,
  } as unknown as SavedView;

  persist(savedViews.value.concat([view]));
  applyView(view);
  focusTab(view.id, true);
};

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

/**
 * Show a tab and put the focus on it. The focus has to follow, because the strip is a roving
 * tabindex - the tab left behind stops being reachable the moment another takes the view.
 */
const goToTab = (tab: Tab) => {
  applyView(tab.view || null);
  focusTab(tab.id);
};

/**
 * Arrow along the strip. Moving the focus picks the view as it goes, the way the tabs
 * elsewhere in the product behave - a tab that has focus but is not the one in force would
 * leave the underline and the table disagreeing about which view is shown.
 */
const stepTab = (delta: number) => {
  const list = tabs.value || [];

  if (list.length < 2) {
    return;
  }

  // From wherever the focus actually is. It is normally on the tab in force, but a view just
  // deleted leaves it on the one before, which is not the one showing.
  const focused = list.findIndex((tab) => tabButton(tab) === document.activeElement);
  const at = focused >= 0 ? focused : list.findIndex((tab) => tab.id === focusableTabId.value);
  const next = list[((at < 0 ? 0 : at) + delta + list.length) % list.length];

  goToTab(next);
};

/** Home and End, to either end of the strip */
const edgeTab = (which: string) => {
  const list = tabs.value || [];
  const next = which === 'first' ? list[0] : list[list.length - 1];

  if (next) {
    goToTab(next);
  }
};

/**
 * Down arrow opens the focused tab's menu, the way it opens any menu button. The chevron is
 * out of the tab sequence, so this is the keyboard's way in.
 *
 * The menu is told a key opened it before it is opened: that is what has it hand the focus to
 * its first row rather than leaving it on the chevron, which is how it tells a key press from
 * a click.
 */
const openTabMenu = (tab: Tab) => {
  const caret = tabCaret(tab);

  if (!caret) {
    return;
  }

  caret.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
  caret.click();
};

/**
 * Closing the menu hands the focus back to the chevron, which is not in the tab sequence and
 * answers no arrows. Put it back on the tab it belongs to, so the strip still works - but
 * only when the keyboard is where it was left, or a click elsewhere would be dragged back.
 */
const onTabMenuToggle = (tab: Tab, open: boolean) => {
  openTabMenuId.value = open ? tabKey(tab) : null;

  if (open) {
    return;
  }

  nextTick(() => {
    if (document.activeElement === tabCaret(tab)) {
      tabButton(tab)?.focus();
    }
  });
};

/**
 * Mark a tab once the strip has actually arrived at the start.
 *
 * Waiting on the scroll rather than on a guess at how long it takes: a fixed delay fired
 * while the strip was still moving, which is the one moment the mark is no use - it is there
 * to answer "why did that just move", and it has to land after the moving has stopped. The
 * cap is for a scroll that never finishes, so nothing is left waiting on it.
 */
const flashTabWhenScrolled = (strip: HTMLElement, key: string) => {
  clearTimeout(flashTimer);
  cancelAnimationFrame(flashFrame);

  const deadline = Date.now() + TAB_SCROLL_SETTLE_MAX_MS;

  const settle = () => {
    if (strip.scrollLeft > 1 && Date.now() < deadline) {
      flashFrame = requestAnimationFrame(settle);

      return;
    }

    flashTabId.value = key;
    flashTimer = setTimeout(() => {
      flashTabId.value = null;
    }, TAB_FLASH_MS);
  };

  settle();
};

/**
 * Keep the typed name. Blank, or unchanged, simply closes - there is nothing to record.
 */
const commitRename = () => {
  const id = renamingId.value;
  const name = (renameDraft.value || '').trim();
  const saved = savedViews.value.find((v) => v.id === id);

  renamingId.value = null;
  renameDraft.value = '';

  if (!name || !saved || name === saved.name) {
    return;
  }

  persist(savedViews.value.map((v) => (v.id === id ? { ...v, name } : v)));
};

const cancelRename = () => {
  renamingId.value = null;
  renameDraft.value = '';
};

/**
 * Export needs a format, which is more than belongs in a menu - ask in a modal.
 * `view` is only used to label it, the rows exported are whatever the view matches.
 */
const openExport = (saved?: SavedView | null) => {
  modal.value = { kind: 'export', view: saved || null };
};

const closeModal = () => {
  modal.value = null;
};

/**
 * Copy any tab, the default one included - copying it is how you start a view from the table
 * as it comes, since the default tab itself can never be saved over.
 */
const duplicateTab = (tab: Tab) => {
  duplicateView(tab.view || {
    name:         t('tableViews.tabs.all'),
    query:        '',
    columns:      null,
    columnOrder:  null,
    labelColumns: [],
    groupBy:      null,
  });
};

const duplicateCurrent = () => {
  const tab = tabs.value.find((candidate) => candidate.id === selectedViewId.value);

  if (tab) {
    duplicateTab(tab);
  }
};

/**
 * The view this list opens on. No toggle: choosing the default tab is itself how you go back
 * to opening on the table as it comes, which is what an empty default means.
 */
const setDefaultView = (tab: Tab) => {
  persistAll(savedViews.value, tab.isDefaultTab ? null : tab.view?.id || null);

  // The tab has just been moved to the head of the strip, which is no use if the strip is
  // scrolled somewhere else - so the strip goes back to the start to show it happening,
  // whether or not the tab that moved is the one being looked at.
  //
  // And then the tab itself is flashed, once the strip has stopped: a strip that jumps to its
  // start on its own says nothing about why, and the mark is the one a dragged tab wears, so
  // it reads as "this one" rather than as something new to learn.
  const key = tabKey(tab.isDefaultTab ? { id: null } : { id: tab.view?.id });

  nextTick(() => {
    const strip = tabStrip.value;

    if (!strip) {
      return;
    }

    strip.scrollTo({ left: 0, behavior: 'smooth' });
    flashTabWhenScrolled(strip, key);
  });
};

/** Is this the tab the list opens on? With nothing set, that is the default tab */
const isDefaultTab = (tab: Tab) => (tab.isDefaultTab ? !defaultViewId.value : defaultViewId.value === tab.view?.id);

/**
 * Delete a view, and offer it back.
 *
 * A view is a few minutes of somebody's arrangement and there is nothing else holding it, so
 * losing one to a misclick costs real work. Asking first would put a modal in front of every
 * delete, including the many that are meant; saying afterwards and offering it back costs
 * nothing when the delete was meant and everything when it was not.
 *
 * Everything the view had is kept, not just the view: where it sat in the strip, whether it was
 * the one the list opens on, and any unsaved edits being held for it. Undo that put the view
 * back on the end, unmarked, with its edits dropped would be a different view wearing its name.
 */
const deleteView = (saved?: SavedView) => {
  if (!saved) {
    return;
  }

  const wasSelected = selectedViewId.value === saved.id;
  const wasDefault = defaultViewId.value === saved.id;
  const at = savedViews.value.findIndex((v) => v.id === saved.id);
  const draft = drafts.value[draftKey(saved.id)];
  // The tab the keyboard falls back to. Taken before the view goes, because afterwards there
  // is nothing left to measure from - and it is the one in front of the gap, not the one
  // that slides into it, that the user was last looking at.
  const list = tabs.value || [];
  const before = list[Math.max(list.findIndex((tab) => tab.id === saved.id) - 1, 0)];

  persist(savedViews.value.filter((v) => v.id !== saved.id));
  forgetDraft(saved.id);

  if (wasSelected) {
    applyView(null);
  }

  if (before) {
    focusTab(before.id);
  }

  // `info` rather than `success`: a growl raised as a success is copied into the notification
  // centre, which is written down - and an undo cannot be. The offer only means anything while
  // the growl is on screen, so it lives and dies there.
  store.dispatch('growl/info', {
    title:   t('tableViews.tab.deleted', { name: saved.name }),
    message: t('tableViews.tab.deletedMessage'),
    timeout: UNDO_TIMEOUT,
    action:  {
      label: t('tableViews.tab.undo'),
      run:   () => {
        const views = [...savedViews.value];

        views.splice(Math.min(Math.max(at, 0), views.length), 0, saved);
        persistAll(views, wasDefault ? saved.id : defaultViewId.value);

        if (draft) {
          drafts.value = { ...drafts.value, [draftKey(saved.id)]: draft };
        }

        if (wasSelected) {
          applyView(saved);
        }
      },
    },
  });
};

const doExport = (format: string) => {
  // The name goes with it: the export is watched in the notification centre, and by the time
  // it finishes the modal that knew which view was picked is long gone
  const name = modal.value?.view?.name || t('tableViews.tabs.all');

  emit('export', { format, name });
  closeModal();
};

/** What each shortcut runs, by the name SHORTCUTS gives it */
const SHORTCUT_ACTIONS: Record<string, () => void> = {
  saveChanges, openSaveAsNew, duplicateCurrent
};

/**
 * ⌘/ctrl shortcuts for the saved view being edited. Ignored while the user is typing, so
 * ⌘S in the filter box still means whatever the browser makes of it.
 */
const onShortcut = (event: KeyboardEvent) => {
  if (!(event.metaKey || event.ctrlKey) || event.altKey) {
    return;
  }

  // Only for the list the keyboard is actually in - its toolbar, its filter box or its rows.
  // A page can carry two of these, each with its own views, and a shortcut has to name one of
  // them; the focus is what names it. It also keeps ⌘S out of whatever else on the page the
  // user might be writing in, which is what the old check was for.
  if (!ownsTarget(event.target)) {
    return;
  }

  const match = SHORTCUTS.find((s) => s.key === event.key.toLowerCase() && s.shift === event.shiftKey);

  if (!match) {
    return;
  }

  event.preventDefault();
  SHORTCUT_ACTIONS[match.action]();
};

watch(tabQueries, (queries) => emit('tab-queries', queries), { immediate: true });

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

  // Only the tabs instance listens, so a bar rendered as two parts doesn't act on each key twice
  if (props.part !== 'controls') {
    window.addEventListener('keydown', onShortcut);
  }
});

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onShortcut);
  clearTimeout(subMenuTimer);
  clearTimeout(flashTimer);
  cancelAnimationFrame(flashFrame);
  endColumnDrag(false);
  endTabDrag(false);
});
</script>

<template>
  <div
    ref="root"
    class="table-views"
    :class="{ 'part-controls': part === 'controls', 'part-tabs': part === 'tabs' }"
    data-testid="table-views-bar"
  >
    <!-- The rule under the tabs belongs to the row rather than to the strip that scrolls, so it
         spans the width however far along the tabs have been pushed. -->
    <div
      v-if="part !== 'controls'"
      class="view-tabs-row"
    >
      <div
        ref="tabStrip"
        class="view-tabs"
        @scroll="closeTabMenus"
      >
        <!-- One tab stop for the whole strip, the way the product's own tabs work: the arrows walk
             it, Tab leaves it for Add View. -->
        <!-- The tabs reorder under the pointer on the TransitionGroup's own FLIP move, the same
             way the column picker's rows do. -->
        <TransitionGroup
          tag="div"
          name="view-tab"
          class="view-tabs-list"
          :class="{ 'is-reordering': tabDragId !== null }"
          role="tablist"
          :aria-label="t('tableViews.tabs.label')"
        >
          <div
            v-for="tab in tabs"
            :key="tab.id || 'all'"
            :ref="(el) => keepRef(tabWraps, tab.id || 'all', el)"
            class="view-tab-wrap"
            :class="{
              active: selectedViewId === tab.id,
              held: tabDragId === (tab.id || 'all'),
              flash: flashTabId === (tab.id || 'all'),
            }"
            @mousedown="startTabDrag(tab, $event)"
          >
            <!-- Renaming happens on the tab itself, so the name is edited where it is read. The
                 default tab is excluded outright: it has no name of its own to change, and its id is
                 null, which is also what "nothing is being renamed" looks like. -->
            <input
              v-if="!tab.isDefaultTab && renamingId === tab.id"
              :ref="(el) => keepRef(renameInputs, tab.id || '', el)"
              v-model="renameDraft"
              type="text"
              class="view-tab rename-input"
              :size="Math.max(renameDraft.length, 4)"
              :aria-label="t('tableViews.tab.rename')"
              :data-testid="`table-views-rename-input-${ tab.id }`"
              @keydown.enter.prevent="commitRename"
              @keydown.esc.prevent="cancelRename"
              @blur="commitRename"
              @click.stop
            >
            <button
              v-else
              :ref="(el) => keepRef(tabButtons, tab.id || 'all', el)"
              type="button"
              role="tab"
              class="view-tab"
              :aria-selected="selectedViewId === tab.id"
              :tabindex="tab.id === focusableTabId ? 0 : -1"
              :data-testid="tab.isDefaultTab ? 'table-views-tab-all' : `table-views-tab-${ tab.id }`"
              @click="applyView(tab.view || null)"
              @keydown.left.prevent="stepTab(-1)"
              @keydown.right.prevent="stepTab(1)"
              @keydown.home.prevent="edgeTab('first')"
              @keydown.end.prevent="edgeTab('last')"
              @keydown.down.prevent="openTabMenu(tab)"
            >
              {{ tabLabel(tab) }}
              <span
                v-if="isTabDirty(tab)"
                v-clean-tooltip="t('tableViews.view.unsavedShort')"
                class="unsaved-dot"
                data-testid="table-views-unsaved"
              />
            </button>

            <!-- The menu belongs to the whole tab, not to the chevron that opens it, so it is
                 positioned against the tab: flush with the start of the name and 9 below the line the
                 tab draws under itself. -->
            <rc-dropdown
              :open="openTabMenuId === (tab.id || 'all')"
              :placement="'bottom-start'"
              :distance="9"
              :reference-node="() => tabWrap(tab)"
              @update:open="onTabMenuToggle(tab, $event)"
            >
              <!-- Out of the tab sequence: the strip is one stop, and the down arrow on the tab is
                   what opens this. The mouse still has the chevron to click. -->
              <rc-dropdown-trigger
                :ref="(el) => keepRef(tabCarets, tab.id || 'all', el)"
                variant="link"
                class="view-tab-caret"
                tabindex="-1"
                :aria-label="t('tableViews.tab.menu')"
                :data-testid="tab.isDefaultTab ? 'table-views-tab-menu-all' : `table-views-tab-menu-${ tab.id }`"
              >
                <i class="icon icon-chevron-down" />
              </rc-dropdown-trigger>
              <template #dropdownCollection>
                <div :class="['menu-panel', { 'has-notice': isTabDirty(tab) }]">
                  <!-- Unsaved changes, and the three ways out of them -->
                  <template v-if="isTabDirty(tab)">
                    <div class="menu-notice">
                      <span class="unsaved-dot" />
                      {{ t('tableViews.view.unsaved') }}
                    </div>
                    <rc-dropdown-item
                      v-if="!tab.isDefaultTab"
                      data-testid="table-views-save-changes"
                      @click="saveChanges()"
                    >
                      <template #before>
                        <i class="icon icon-download" />
                      </template>
                      {{ t('tableViews.view.saveChanges') }}
                      <template #after>
                        <span class="menu-shortcut">{{ shortcuts.save }}</span>
                      </template>
                    </rc-dropdown-item>
                    <rc-dropdown-item
                      data-testid="table-views-save-as-new"
                      @click="openSaveAsNew()"
                    >
                      <template #before>
                        <i class="menu-gutter" />
                      </template>
                      {{ t('tableViews.view.saveAsNew') }}
                      <template #after>
                        <span class="menu-shortcut">{{ shortcuts.saveAsNew }}</span>
                      </template>
                    </rc-dropdown-item>
                    <rc-dropdown-item
                      data-testid="table-views-discard"
                      @click="discardChanges()"
                    >
                      <template #before>
                        <i class="menu-gutter" />
                      </template>
                      {{ t('tableViews.view.discard') }}
                    </rc-dropdown-item>
                    <rc-dropdown-separator />
                  </template>

                  <!-- The default tab is the table as it comes: it can't be renamed, saved over or
                       deleted. Copying it is how you start a view from what it holds. -->
                  <rc-dropdown-item
                    v-if="!tab.isDefaultTab"
                    :data-testid="`table-views-rename-${ tab.id }`"
                    @click="openRename(tab.view)"
                  >
                    <template #before>
                      <i class="icon icon-edit" />
                    </template>
                    {{ t('tableViews.tab.rename') }}
                  </rc-dropdown-item>
                  <rc-dropdown-item
                    :data-testid="tab.isDefaultTab ? 'table-views-duplicate-all' : `table-views-duplicate-${ tab.id }`"
                    @click="duplicateTab(tab)"
                  >
                    <template #before>
                      <i class="icon icon-copy" />
                    </template>
                    {{ t('tableViews.tab.duplicate') }}
                    <template #after>
                      <span class="menu-shortcut">{{ shortcuts.duplicate }}</span>
                    </template>
                  </rc-dropdown-item>

                  <rc-dropdown-item
                    :data-testid="tab.isDefaultTab ? 'table-views-export-all' : `table-views-export-${ tab.id }`"
                    @click="openExport(tab.view)"
                  >
                    <template #before>
                      <i class="menu-gutter" />
                    </template>
                    {{ t('tableViews.export.label') }}
                  </rc-dropdown-item>

                  <rc-dropdown-item
                    :class="{ selected: isDefaultTab(tab) }"
                    :data-testid="tab.isDefaultTab ? 'table-views-set-default-all' : `table-views-set-default-${ tab.id }`"
                    @click="setDefaultView(tab)"
                  >
                    <template #before>
                      <i class="menu-gutter" />
                    </template>
                    {{ t('tableViews.tab.setDefault') }}
                    <template
                      v-if="isDefaultTab(tab)"
                      #after
                    >
                      <i class="icon icon-checkmark" />
                    </template>
                  </rc-dropdown-item>

                  <template v-if="!tab.isDefaultTab">
                    <rc-dropdown-separator />
                    <rc-dropdown-item
                      :data-testid="`table-views-delete-${ tab.id }`"
                      @click="deleteView(tab.view)"
                    >
                      <template #before>
                        <i class="icon icon-trash" />
                      </template>
                      {{ t('tableViews.tab.delete') }}
                    </rc-dropdown-item>
                  </template>
                </div>
              </template>
            </rc-dropdown>
          </div>
        </TransitionGroup>

        <button
          type="button"
          class="view-tab new-view-tab"
          data-testid="table-views-new-tab"
          @click="addView"
        >
          <i class="icon icon-plus" />
          {{ t('tableViews.tabs.newView') }}
        </button>
      </div>
    </div>

    <div
      v-if="part !== 'tabs'"
      class="view-controls"
    >
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
                    :class="{ 'is-reordering': dragId !== null }"
                  >
                    <rc-dropdown-item
                      v-for="field in orderedColumnFields"
                      :key="field.id"
                      :class="{ 'column-row': true, locked: isCoreColumn(field), shown: isColumnVisible(field), held: dragId === field.id }"
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

  <!-- The same modal a resource's own Export As... action opens, which is why it no longer brings
       its own frame: there it is put up by the modal manager. -->
  <app-modal
    v-if="modal && modal.kind === 'export'"
    name="tableViewsExportModal"
    :width="640"
    height="auto"
    :trigger-focus-trap="true"
    @close="closeModal"
  >
    <TableViewExportModal
      :count="matchCount"
      :view-name="modal.view ? modal.view.name : t('tableViews.tabs.all')"
      @close="closeModal"
      @export="doExport"
    />
  </app-modal>
</template>

<style lang="scss" scoped>
// Lifting and settling, and the shuffle of whatever is going past - the same curves and timings
// the pinned shelf in the side nav uses, so a drag feels the same wherever it is done. At the top
// of the sheet because both the column rows and the view tabs are dragged, and a variable declared
// inside one selector's block cannot be seen from another's.
$drag-displace-curve: cubic-bezier(0.2, 0, 0, 1);
$drag-drop-curve: cubic-bezier(0.2, 1, 0.1, 1);

// How close to an edge of that region a menu may come. The same number the script holds as
// MENU_GUTTER, which is what stops a menu being slid into the masthead - the two have to agree,
// or a menu is capped at one height and positioned as if it were another.
$menu-gutter: 16px;

// What the popper adds around a menu panel - its own padding and border, less the panel's
// negative margin. Measured off a running build rather than added up from the parts: the padding
// is the product's own popper styling, not this component's, and the two margins do not simply
// add.
//
// It is the popper that gets positioned, so this is what has to come off the cap. Too small a
// number and the popper ends up taller than the room it is being slid into, so it stops short of
// the gutter instead of reaching it - the menu ends further under the masthead than it should,
// with rows behind a scrollbar and the space above it going unused.
$menu-popper-chrome: 16px;

// The tab strip's scroll-edge shadow, the same shape the app bar's list uses for its own - see
// `cluster-scroll-shadow` in TopLevelMenu. Driven by `animation-timeline: scroll()`, so 0% is the
// start of the scroll and 100% the end: on the whole way along, gone once there is nothing left
// to reach.
@keyframes view-tab-scroll-shadow {
  0%, 88% {
    opacity: 1;
  }

  100% {
    opacity: 0;
  }
}

// An icon beside a label is drawn smaller than the square it occupies, so the labels sit in the
// same place whichever icon they are next to. The glyph is centred in that square both ways
// rather than left to the line box, whose metrics are the icon font's own.
@mixin toolbar-icon($box, $glyph) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: none;
  width: $box;
  height: $box;
  font-size: $glyph;
  line-height: 1;
}

// How narrow the toolbar is allowed to get.
//
// Two things want room, and the wider of them wins. The row itself needs the filter box at its
// own minimum (240), the gap (16) and the View button (80) - 336, without which the box carried
// on shrinking until it ran underneath the button. And the View menu needs to be able to open:
// it hangs off the button's right edge, 300 wide, with its sub menus opening another 240 to the
// left of it, and it does not flip to the other side when it runs out of room - it just goes
// under the nav, which is where the Group By list went on a narrow window.
//
// So the floor is that pair - 540, plus the 1px the menu sits inside the button's right edge,
// rounded up to the 8 the rest of the spacing works on. The table beside it already scrolls
// sideways, so there is somewhere for this to go.
//
// Written out rather than measured because the two rows of the toolbar are separate rows of the
// masthead grid, and a grid row cannot take its width from a sibling. The row that holds the box
// carries `min-content` as well, so a language with a longer word than "View" still gets a row
// wide enough - it just grows past this.
$toolbar-min-width: 544px;

.table-views {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: $toolbar-min-width;

  // Both parts are grid items in the table masthead, so they own neither the gap nor the margin
  &.part-controls,
  &.part-tabs {
    gap: 0;
    margin: 0;
    width: 100%;
  }

  // The floor for the whole toolbar. `min-content` rather than a number: it comes out as the
  // filter box at its own minimum, the gap, and the View button at whatever its label needs -
  // so it is right in every language rather than right in this one.
  //
  // Both parts are `width: 100%` of the same masthead column, so the tabs strip above takes the
  // same floor from this without being told. Without it the row kept shrinking after the box had
  // stopped, and the box carried on underneath the View button instead of the page admitting it
  // had run out of room. The table beside it already scrolls sideways, so there is somewhere for
  // this to go.
  &.part-controls .view-controls {
    flex-wrap: nowrap;
    width: 100%;
    min-width: min-content;
  }

  // Holds the rule the tabs sit on, so it runs the full width whatever the strip inside is doing
  .view-tabs-row {
    width: 100%;
    border-bottom: 1px solid var(--border);
  }

  .view-tabs {
    display: flex;
    align-items: stretch;
    gap: 24px;
    // More tabs than fit: they scroll sideways rather than running on under whatever is beside
    // them. Naming one axis leaves the other computing to `auto`, hence the explicit hidden.
    overflow-x: auto;
    overflow-y: hidden;
    // A scroll box clips whatever a tab draws outside itself, and a focus ring is drawn outside.
    // Three of room on every side, taken straight back off the outside, so the ring comes out
    // whole and the tabs sit where they always did - the bottom takes the extra 3 as well as the
    // 1 that puts an active tab's underline over the row's rule rather than a pixel above it.
    // No padding on the right. The other three sides keep it so a tab's focus ring is not clipped,
    // but on the right the padding sits outside what a scroll container clips to - so it is a band
    // nothing inside the strip can paint over, and a focused tab passing behind Add View showed
    // the edges of its ring in it. Nothing needs the room there: the only thing at that edge is
    // Add View, and its ring is drawn inside itself.
    padding: 3px 0 3px 3px;
    margin: -3px 0 -4px -3px;

    // A tab keeps its width - the strip scrolls instead of the tabs being squeezed
    > * {
      flex: none;
    }

    // A thin scrollbar rather than the platform's full width one, which would otherwise take a
    // bite out of a 33px row
    scrollbar-width: thin;

    &::-webkit-scrollbar {
      height: 4px;
    }

    &::-webkit-scrollbar-thumb {
      border-radius: 2px;
      background: var(--scrollbar-thumb, var(--border));
    }

    &::-webkit-scrollbar-track {
      background: transparent;
    }
  }

  // The tabs themselves, inside the strip that scrolls. A box of their own so the row that
  // holds them can carry Add View too without it counting as a tab.
  .view-tabs-list {
    display: flex;
    align-items: stretch;
    gap: 24px;

    > * {
      flex: none;
    }
  }

  // Only while a tab is actually being carried. TransitionGroup's FLIP writes a transform
  // whenever the tabs look to have moved - which they do every time the strip is rebuilt, a view
  // is renamed or a count changes - so easing it the rest of the time slid the whole strip about
  // for reasons that had nothing to do with dragging.
  .view-tabs-list.is-reordering {
    cursor: grabbing;

    .view-tab-move {
      transition: transform 0.2s $drag-displace-curve;
    }

    .view-tab,
    .view-tab-caret,
    .view-tab-wrap {
      cursor: grabbing;
    }

    // The one under the pointer leads: it travels over the tabs it is passing rather than through
    // them. Lifted the same way the column picker lifts a held row - the product's own tint, a
    // little bigger, and a shadow under it - so a drag looks the same wherever it is done.
    // The same lift the app bar's pinned shelf and the column list both use, so a drag looks the
    // same wherever it is done.
    //
    // The one addition is room around the name, given back as margin so the strip does not have
    // to re-lay itself out around a tab that has grown. Those rows sit in a list and carry their
    // own padding; a tab is only as wide as its own text, and a tint drawn to that edge reads as
    // the text being selected rather than as the tab being carried.
    .view-tab-wrap.held {
      position: relative;
      z-index: 1;
      transform: scale(1.02);
      transition: transform 0.2s $drag-displace-curve;

      // The active tab's rule would otherwise run across the bottom of the tint it is now sitting in
      border-bottom-color: transparent;

      // Painted behind the tab rather than given to it as padding. Padding and a negative margin
      // leave the strip's layout alone but not the tab's own box, which started 12px further
      // left the instant it was picked up - and the move transition eased it there, which is the
      // flick you saw on grabbing. Nothing here changes the box, so there is nothing to ease.
      &::before {
        content: '';
        position: absolute;
        inset: 0 -12px;
        z-index: -1;
        border-radius: var(--border-radius);
        background: color-mix(in srgb, var(--primary) 14%, transparent);
        box-shadow: 0 6px 16px rgba(0, 0, 0, 0.28);
      }
    }
  }

  // Saying "this one, here" after the strip has run back to its start on its own. The same card a
  // dragged tab wears, pulsed once - a mark already learned rather than a new one to read.
  // Arriving at the head of the strip, drawn the way the app bar draws a cluster arriving on the
  // pinned shelf: in from the left, with a wash of the same colour draining off it. Same curves,
  // same timings, same tint - a strip that has just run back to its start is saying "this one",
  // which is the thing the shelf says when something lands on it.
  @keyframes view-tab-arrive {
    0%   { opacity: 0; transform: translateX(-6px) scale(0.985); }
    100% { opacity: 1; transform: none; }
  }

  @keyframes view-tab-wash {
    0%   { background: color-mix(in srgb, var(--primary) 15%, transparent); }
    100% { background: transparent; }
  }

  .view-tab-wrap.flash {
    position: relative;
    animation: view-tab-arrive 0.16s ease-out;

    // Behind the tab, for the same reason the held one is - a mark that moved the tab as it
    // landed would be answering "why did this move" by moving it again
    &::before {
      content: '';
      position: absolute;
      inset: 0 -12px;
      z-index: -1;
      border-radius: var(--border-radius);
      animation: view-tab-wash 0.6s ease-out;
    }
  }

  // Someone who has asked not to be moved about keeps the wash and loses the travel
  @media (prefers-reduced-motion: reduce) {
    .view-tab-wrap.flash {
      animation: none;
    }
  }

  // A tab and its caret menu, sharing one active underline
  .view-tab-wrap {
    // Dragging one would otherwise select the names it passes over
    user-select: none;
    display: flex;
    align-items: center;
    gap: 8px;
    height: 32px;
    border-bottom: 2px solid transparent;

    // The tab is the name and the chevron together - one thing to the eye, and one thing to the
    // keyboard now that the strip is a single tab stop. So the ring goes round the pair rather
    // than round whichever of them happens to hold the focus.
    //
    // Two exceptions, and both are about what the ring is for - saying where the keyboard is.
    //
    // The chevron is `tabindex="-1"`, so the keyboard never arrives on it: anything that focuses
    // it is its own menu handing focus back on the way out, which is not somewhere the user has
    // navigated to. Ringing the tab then drew a keyboard mark around a tab that had been clicked.
    //
    // And renaming: the field is its own control with a border of its own, so ringing the whole
    // tab around it drew attention to the tab rather than to the thing being typed into.
    // Drawn rather than outlined. An outline is painted after everything else in its stacking
    // context, so no amount of layering puts it under anything - a focused tab passing behind Add
    // View drew its two rounded corners straight over the button's edge. A shadow paints with the
    // element it belongs to, so it goes under the button with the rest of the tab.
    //
    // The two rings together stand in for `outline-offset: 1px`: a pixel of the page's own colour,
    // then the ring itself.
    &:has(> .view-tab:focus-visible):not(:has(.rename-input)) {
      border-radius: var(--border-radius);
      outline: none;
      box-shadow: 0 0 0 1px var(--body-bg), 0 0 0 3px var(--primary-keyboard-focus);
    }

    // The wrap draws the ring for the pair, so neither half draws one of its own. Only the halves
    // inside a wrap: Add View wears the same class and has no wrap, so it keeps its own ring.
    //
    // `!important`, and `:focus` as well as `:focus-visible`: the chevron is an RcButton, whose
    // own rule (`&:focus-visible { @include focus-outline; outline-offset: 2px; }`) carries the
    // component's scope attribute and so outranks anything reachable from out here - which is
    // what put a blue ring around the chevron alone when it was clicked.
    .view-tab:focus,
    .view-tab:focus-visible,
    .view-tab-caret:focus,
    .view-tab-caret:focus-visible {
      outline: none !important;
    }

    // The same colours the tabs elsewhere in the product use: every tab reads as a link, and the
    // active one is told apart by the rule under it rather than by a colour of its own
    &.active {
      border-bottom-color: var(--active, var(--primary));

      .view-tab,
      .view-tab-caret {
        color: var(--active, var(--primary));
      }
    }
  }

  .view-tab {
    position: relative;
    display: flex;
    align-items: center;
    gap: 8px;
    height: 100%;

    // The unsaved mark is a superscript on the name, not a bullet beside it: it sits clear above
    // the capitals rather than on the middle of the word. The 2 puts its underside a couple of
    // pixels over the cap line, which measures 10.6 down from the top of a 32 tab.
    //
    // Out of the flow, so a view with changes in it is the same width as one without - carried
    // as a flex item it took its own width plus a gap either side, and pushed the chevron 14
    // along the moment anything was typed. It sits in the gap the chevron already stands off by.
    > .unsaved-dot {
      position: absolute;
      top: 2px;
      left: 100%;
      margin-left: 1px;
    }
    // The global button rule carries a 40px min-height, which `height` alone can't get under -
    // it was making the tabs row 8px taller than the tabs in it
    min-height: 32px;
    background: transparent;
    border: none;
    padding: 0;
    cursor: pointer;
    color: var(--link);
    font-size: 14px;
    line-height: 20px;
    white-space: nowrap;

    // Sits where the label was, but as a field rather than a label: it takes the spacing an input
    // has inside it, so the name being typed is not run up against its own border.
    &.rename-input {
      min-width: 60px;
      max-width: 220px;
      height: 28px;
      min-height: 28px;
      padding: 0 8px;
      border: 1px solid var(--primary);
      border-radius: var(--border-radius);
      background: var(--input-bg);
      color: var(--input-text);
      font: inherit;
      outline: none;

      // It is the thing being typed into, so it carries its own ring rather than borrowing the
      // tab's - which put a second, larger outline around a field that already has a border.
      //
      // `!important`, and written out rather than taken from the mixin, for the same reason the
      // cluster switcher's search box does it: the app's rule for text inputs
      // (`input[type="text"]:focus:not(…):not(…):not(…)`) sets `outline: none` at a specificity
      // nothing reachable from in here can beat, and the mixin no longer carries one - so the
      // ring was being declared and then thrown away. Inset by a pixel so it sits on the field's
      // own border rather than outside it.
      &:focus-visible {
        outline: 2px solid var(--primary-keyboard-focus) !important;
        outline-offset: -1px;
      }
    }

    // Standing in the tab row, it reads as a link the way the tabs beside it do
    // Held at the end of the strip while the tabs run under it, so the way to make a view is in
    // the same place whether there are three of them or thirty.
    //
    // It needs something to sit on, or the tabs show through it as they pass. And it casts the
    // shadow that says they are passing: the app bar's list does the same at its bottom edge, and
    // this is that rule turned on its side - hidden by default, so a strip with nothing to scroll
    // draws nothing, revealed by the scroll itself, and faded back out at the far end where there
    // is no longer anything behind it. Where scroll-driven animations aren't supported the shadow
    // simply stays on: less precise, but the strip never clips a tab silently.
    &.new-view-tab {
      position: sticky;
      // Sticky alone is not enough to win. With `z-index: auto` it is painted among its siblings,
      // and a tab whose box reaches under it comes out on top for those few pixels - which is a
      // bead of the active tab's underline showing through the button's own background. Naming a
      // layer settles it.
      z-index: 1;
      gap: 8px;
      height: auto;
      min-height: 32px;
      // Room on its left for a tab to disappear into, taken straight back off the outside so the
      // strip is laid out exactly as it was. The 24 of gap does nothing once the tabs pass
      // underneath rather than beside - a name ran right up to the `+` and stopped dead against
      // it. This is the button's own background reaching further left than its text does.
      padding: 3px 3px 3px 8px;
      // Standing in the strip's own box, top to bottom, which is what a tab's wrap stands in - so
      // a tab passing behind is covered for the whole of its height, its underline included. That
      // underline is the last thing to go: the strip hangs its final pixel over the row's rule so
      // an active tab's mark lands on the line rather than above it, and a button that stopped a
      // pixel short left a bead of green sliding past underneath.
      //
      // Covering that pixel means covering the row's rule too, so the button draws the rule back
      // along its own bottom edge. Inset, so it costs the box nothing.
      // Out to the strip's edge on both sides. `right: 0` pins a sticky element to the padding
      // edge, which left the strip's own 3 of padding uncovered - a slot the tabs slid through on
      // their way past. The padding is given back inside so the label does not move.
      right: 0;
      // Out to the strip's own edges, padding and all - not just its content box. The strip keeps
      // 3 of padding on every side precisely so a tab's focus ring, which is drawn outside the
      // tab, is not clipped. A button that stopped at the content box therefore left that ring a
      // pixel of room above and below it, and a focused tab scrolling behind drew its ring's top
      // and bottom edges straight past. The space is given back inside, so the label does not
      // move.
      margin: -3px 0 -3px -8px;
      align-self: stretch;
      // The page's colour, with the row's rule drawn back on top of it - one pixel, its underside
      // three up from this button's bottom edge, which is where the row's own rule runs before
      // the button covers it. Placed as a background layer rather than as an inset shadow: a
      // shadow's spread and offset have to be worked backwards from the edge it grows out of, and
      // getting that wrong puts the line a few pixels low, which is exactly what it did. A
      // position says where the line goes and nothing else.
      background-color: var(--body-bg);
      background-image: linear-gradient(var(--border), var(--border));
      background-repeat: no-repeat;
      background-position: left calc(100% - 3px);
      background-size: 100% 1px;
      color: var(--link);

      // The app bar's shadow turned on its side - the same 8, the same wash, the same reveal, and
      // nothing else. An opaque fade was layered under it for a while to hide what was passing
      // behind; what was showing turned out to be a focused tab's ring escaping above and below
      // the button, which the button covers itself now. Content showing faintly through a shadow
      // is what a shadow is.
      &::before {
        content: "";
        position: absolute;
        top: 0;
        // Down to the rule and no further. The rule is the row's, not the strip's - it does not
        // move - so a shadow laid over it tinted a line that never scrolls and made it look as
        // though it did. The 4 is the 3 this button reaches past the rule into the strip's
        // padding, plus the rule's own pixel.
        bottom: 4px;
        right: 100%;
        width: 8px;
        pointer-events: none;
        background: linear-gradient(90deg, transparent 0%, color-mix(in srgb, var(--body-text) 8%, transparent) 100%);
        opacity: 0;
        animation: view-tab-scroll-shadow linear both;
        animation-timeline: scroll(nearest inline);

        @supports not (animation-timeline: scroll()) {
          opacity: 1;
        }
      }

      // The ring is drawn rather than outlined. An outline follows the border box, and this
      // button's border box is the strip's whole height including the padding either side - so
      // an outline either sat outside it, where the scroller clipped it away, or inside it,
      // where it crossed the row's rule and touched the strip's edges.
      //
      // Drawn, it can stand exactly where a tab's ring stands: inside the strip's padding on
      // three sides, above the rule on the fourth, and carrying the same radius the tabs' rings
      // carry.
      &:focus-visible {
        outline: none;
      }

      &:focus-visible::after {
        content: "";
        position: absolute;
        inset: 3px 3px 4px 3px;
        pointer-events: none;
        border: 2px solid var(--primary-keyboard-focus);
        // Square for now, while the ring a tab wears behind this button is still showing its own
        // corners against the strip's right edge - two rounded shapes meeting there read as one
        // mistake rather than two.
        border-radius: 0;
      }

      .icon {
        @include toolbar-icon(14px, 14px);
      }
    }
  }

  // Two classes deep on purpose: the caret is an RcButton, and `.btn-medium` sets its own
  // horizontal padding. Left alone it pads the chevron by 12 either side, which both widens the
  // gap after the name and runs the active underline past the icon.
  .view-tab-wrap .view-tab-caret {
    display: flex;
    align-items: center;
    background: transparent;
    border: none;
    cursor: pointer;
    color: var(--link);
    height: 100%;
    min-height: 32px;
    padding: 0;

    .icon {
      font-size: 14px;
    }
  }

  .view-controls {
    display: flex;
    flex-wrap: wrap;
    // To the top, not the middle. The filter box can grow a line under it, and centring had the
    // View button drift down with it - the button belongs on the box's own line, which is the
    // top of this row whether the box has anything to say or not.
    align-items: flex-start;
    gap: 16px;
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

// Marks a view holding changes that aren't saved anywhere
.unsaved-dot {
  width: 6px;
  height: 6px;
  flex: none;
  border-radius: 50%;
  background: var(--error);
}

// A menu is 8 clear at the top and bottom, and that 8 is the panel's own. RcDropdown's target
// gives up its own 3 and its scrolling with it: the panel scrolls itself, and the 10 the popper
// keeps is pulled back below, which leaves the panel hanging outside the target - a scroller
// there turns that into a scrollbar with 10 to travel.
.table-views :deep(.dropdownTarget) {
  padding: 0;
  overflow: visible;
}

// Content of an RcDropdown menu. RcDropdown owns the popper, this is the list inside it.
.menu-panel {
  display: flex;
  flex-direction: column;
  min-width: 240px;

  // The View menu carries a value beside each row - the field grouped by, the columns preset -
  // so it is given more room than a menu of plain commands before those values start crowding
  // the labels they sit against.
  &.view-menu {
    min-width: 300px;
  }

  // As tall as the region the menu is allowed to stand in: the window less the masthead above and
  // the shell drawer below - the same three rows the app's own grid is built from - less the
  // gutter at each end and the popper this panel is wrapped in.
  //
  // Written out rather than left as `100%`: a percentage resolves against the popper's own box,
  // and the popper's height comes from this panel - so the cap was derived from the thing it was
  // capping and settled a few pixels short, which made a list scroll while it still had room.
  max-height: calc(
    100vh - var(--header-height) - var(--wm-height, 0px) - #{$menu-gutter * 2} - #{$menu-popper-chrome}
  );
  // Only ever downwards. Naming one axis leaves the other computing to `auto`, and a panel whose
  // width lands on a fraction is enough to raise a scrollbar along the bottom with nothing to
  // scroll to.
  overflow-x: hidden;
  overflow-y: auto;
  text-align: left;
  // The popper's own padding is the spacing. This used to cancel it with a negative margin and
  // supply its own, which made the panel render taller than the box the popper had measured - so
  // a panel pinned to the bottom of the screen bled its last 20px straight off it.
  //
  // The 3 up and down is the one exception: the panel scrolls, and a scroll box clips what a row
  // draws outside itself, which is where a focus ring goes - the top row's came out with its top
  // stroke shaved off. The margin gives the 3 straight back, so the rows stay exactly where the
  // popper's padding put them.
  margin: -3px 0;
  padding: 3px 0;

  // Nothing here restyles a menu row. Their height, padding, spacing and hover all come from
  // RcDropdownItem, so these menus are the same as the row action menu and each other - only the
  // width below is ours, so the labels have room beside the values they sit against.

  // The one exception, and it is about where you are rather than how a row looks: while the
  // pointer is inside a sub menu it is over none of the rows here, so the row that opened it
  // would go dark and the menu would stop saying which of them you are in. It keeps the same
  // highlight hovering gives, so the hand back is invisible.
  :deep([dropdown-menu-item].owns-sub-menu) {
    background-color: var(--dropdown-hover-bg);
  }

  // A row with no icon still holds the space one would take, so every label in a menu starts in
  // the same place. Not called anything with `icon-` in it: the icon font claims
  // `[class*=" icon-"]` with an !important and would set the whole row in it.
  .menu-gutter {
    display: inline-block;
    flex: none;
    width: 14px;
  }

  // The "you have unsaved changes" banner at the top of a dirty view's menu. A quiet tint, not a
  // solid block - it is telling the user where they stand, not asking them to act.
  // The dropdown pads its panel 10 top and bottom, which left the banner floating below a white
  // strip with its rounded corners nowhere near the menu's own. The panel is a scroll container,
  // so the banner can't be dragged up out of it - it is the whole panel that moves instead, which
  // costs the padding above without disturbing the padding below or anything inside.
  &.has-notice {
    // The 10 the popper pads by, plus the 3 this panel now holds for the focus rings
    margin-top: -13px;
  }

  .menu-notice {
    display: flex;
    align-items: center;
    gap: 8px;
    height: 40px;
    margin: 0 0 8px;
    // Sitting in the menu's top corners, it takes their rounding with them
    border-radius: var(--border-radius-lg) var(--border-radius-lg) 0 0;
    padding: 0 17px;
    // The same wash an informative state badge is drawn on - what this row says is news about the
    // tab, not a result of anything. Mixing it from `--primary` instead tied it to the brand, so
    // it came out green on a Prime install and read as a success message.
    background: var(--info-badge, var(--info-banner));
    color: var(--body-text);
    font-size: 14px;

    // The dot stands in the icons' column, so the notice reads off the same left edge as the
    // rows below it. A transparent border widens the box without growing the dot itself.
    .unsaved-dot {
      box-sizing: content-box;
      border: 5px solid transparent;
      background-clip: content-box;
    }
  }

  .menu-shortcut {
    margin-left: auto;
    padding-left: 24px;
    color: var(--dropdown-secondary-text);
    font-size: 12px;
    white-space: nowrap;
  }

  // A focus ring is drawn on the row's own box, so anything painted after it covers its edge -
  // the tint the row below takes under the cursor, most visibly. The focused row rises over them.
  [dropdown-menu-item]:focus-visible {
    position: relative;
    z-index: 1;
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

  // What is currently in force, marked the way the selected tab is. `--active` rather than
  // `--info`: an alert severity does not follow the brand, so it stayed Rancher blue on a Prime
  // install where everything around it had gone green - and it has no dark theme value of its own.
  [dropdown-menu-item].selected {
    color: var(--active, var(--primary));
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
