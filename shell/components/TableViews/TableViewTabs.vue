<script setup lang="ts">
/**
 * The saved view tabs above a resource table - one for each view, and one for the table itself.
 *
 * Picking a tab applies its view; each tab's menu saves, copies, renames, exports or deletes it,
 * or makes it the one the list opens on. The views are kept as a user preference. What is applied
 * lives in the `view` prop, so the owning table is what actually shows it.
 *
 * The filter and the View menu beneath are TableViewControls. The two share nothing but that prop
 * and the preference, so they are two components rather than one drawn twice.
 */
import {
  computed, nextTick, onBeforeUnmount, onMounted, ref, watch
} from 'vue';
import type { ComponentPublicInstance } from 'vue';
import { useStore } from 'vuex';

import AppModal from '@shell/components/AppModal.vue';
import TableViewExportModal from '@shell/components/TableViews/TableViewExportModal.vue';
import { useDragReorder } from '@shell/composables/useDragReorder';
import { useI18n } from '@shell/composables/useI18n';
import { useSavedTableViews } from '@shell/composables/useSavedTableViews';
import { isMac, shortcutLabel } from '@shell/utils/platform';
import { randomStr } from '@shell/utils/string';
import { isViewDirty, selectedViewIdFor } from '@shell/utils/table-views/views';
import type { TableViewSaved, TableViewState } from '@shell/types/table-views';
import { RcDropdown, RcDropdownItem, RcDropdownSeparator, RcDropdownTrigger } from '@components/RcDropdown';

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

interface Tab {
  id: string | null;
  name: string;
  view?: TableViewSaved;
  isDefaultTab?: boolean;
}

/** The table's own tab has no id, and null is also what "nothing" looks like - so it is named */
function tabKey(tab: { id?: string | null }) {
  return tab.id || 'all';
}

const props = withDefaults(defineProps<{
  /** What the table is showing: the query, the columns, the grouping and the sort */
  view: TableViewState,
  /**
   * query -> how many rows it matches, counted by the owning table in its own right rather
   * than read off the rows on screen. Shown on the tabs, so someone can see what a view holds
   * without opening it.
   */
  viewCounts?: Record<string, number | null>,
  /** How many rows the view on screen holds, for the export modal when that is the one exported */
  matchCount?: number,
  /** Key the saved views are stored under, normally the resource type */
  resourceType?: string,
  /**
   * The saved view the list opened on, when it opened on the user's default. It is the tab to
   * light up first - the config the list opened with can't say, see the mixin's openedViewId.
   */
  initialViewId?: string,
}>(), {
  viewCounts:   () => ({}),
  matchCount:   0,
  resourceType: '',
});

const emit = defineEmits<{
  'update:view': [view: TableViewState],
  export: [args: { format: string, name: string, view?: TableViewState }],
  'tab-queries': [queries: string[]],
}>();

const store = useStore();

const { t } = useI18n(store);

const {
  savedViews, defaultViewId, allTabIndex, persistAll, persist, unusedViewName
} = useSavedTableViews(() => props.resourceType);

const root = ref<HTMLElement | null>(null);

const tabStrip = ref<HTMLElement | null>(null);

/**
 * The tab-level elements, by tab key. Function refs rather than named ones because there is a
 * set of them per tab and they are looked up by whichever tab is being acted on.
 */
const tabWraps = new Map<string, HTMLElement>();

const tabButtons = new Map<string, HTMLElement>();

const tabCarets = new Map<string, Element | ComponentPublicInstance>();

const renameInputs = new Map<string, HTMLInputElement>();

const keepRef = <T, >(map: Map<string, T>, key: string, el: T | null) => {
  if (el) {
    map.set(key, el);
  } else {
    map.delete(key);
  }
};

/**
 * The tab the user picked, so we can offer save/discard against it and light it up.
 *
 * Three states: `undefined` if nothing has been picked here yet, `null` for the default
 * tab, or the id of a saved view. The default tab has to be distinguishable from "nothing
 * picked", or a saved view holding the same config as it is matched instead. A list that opens
 * on the user's default view starts with that view picked, for the same reason.
 */
const pickedViewId = ref<string | null | undefined>(props.initialViewId);

/**
 * Unsaved edits, per tab, for as long as the page is open. Leaving a tab with changes on it
 * holds on to them so coming back finds them where they were, and the tab keeps its mark
 * while you are elsewhere. A reload is where they end - nothing here is written down.
 */
const drafts = ref<Record<string, TableViewState>>({});

/**
 * Which modal is open, if any. For an export: the name of the tab being exported, how many rows
 * it holds - null when that is not known - and, for a tab other than the one on screen, its view.
 */
const modal = ref<{ kind: 'export', name: string, count: number | null, view?: TableViewState } | null>(null);

/** id of the view being renamed in place, and the name being typed for it */
const renamingId = ref<string | null>(null);

const renameDraft = ref('');

/** The lines between one tab and the next, measured as a tab drag begins - see captureTabSlots */
const tabBounds = ref<number[] | null>(null);

/** Which tab's own menu is open, so it can be closed when the strip moves under it */
const openTabMenuId = ref<string | null>(null);

/** The tab to draw attention to once the strip has finished running back to it */
const flashTabId = ref<string | null>(null);

let flashTimer: ReturnType<typeof setTimeout> | undefined;

let flashFrame = 0;

let tabScrollFrame = 0;

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

/**
 * The strip as it is saved, before a drag in progress rearranges it - see `tabs`.
 *
 * The table as it comes, then the saved views - except that the view the list opens on leads,
 * and the table's own tab follows it. The first tab is the one you land on, so the one that is
 * actually applied on arrival belongs there - and having marked a view as the default, watching
 * it stay wherever it happened to sit was the menu saying one thing and the strip another.
 * The one it opens on can't be dragged out of the front; see `LOCKED_TAB_COUNT`.
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
  // eslint-disable-next-line @typescript-eslint/no-use-before-define
  if (!tabDragOrder.value) {
    return baseTabs.value;
  }

  const byKey: Record<string, Tab> = {};

  baseTabs.value.forEach((tab) => {
    byKey[tabKey(tab)] = tab;
  });

  // eslint-disable-next-line @typescript-eslint/no-use-before-define
  return tabDragOrder.value.map((key) => byKey[key]).filter(Boolean);
});

/**
 * How many tabs at the head of the strip are held there: the one the list opens on, and only
 * that one. It leads because it is the tab you arrive at, so it cannot be dragged out of the
 * front and nothing can be dropped in front of it. Everything else moves freely, the table's
 * own tab included - it is only pinned to the front while it is itself the default.
 */
const LOCKED_TAB_COUNT = 1;

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

/**
 * Is `target` part of this table's toolbar - its tabs, its filter, or its View menu?
 *
 * The tabs and the controls under them share one table masthead, so that is what is compared. A
 * second table on the page has its own, and keeps its own shortcuts.
 */
const ownsTarget = (target: EventTarget | null) => {
  // The component has a modal beside its tabs, so its root is a fragment whose first node may
  // not be an element at all - hence a ref of its own rather than the root node
  const el = root.value;

  if (!el?.closest || !(target instanceof Element)) {
    return false;
  }

  // The toolbar and the table under it together: they are one list as far as the user is
  // concerned, and a shortcut pressed while reading the rows belongs to the list being read.
  // The masthead is the fallback for a table that is not in table views layout.
  const listOf = (node: Element) => node.closest('.has-table-views') || node.closest('.fixed-header-actions');
  const mine = listOf(el);

  return !!mine && listOf(target) === mine;
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

  return cmp instanceof Element ? cmp : cmp?.$el;
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
  tabBounds.value = boxes.slice(0, -1).map((box, i) => (box.right + boxes[i + 1].left) / 2);
};

/** How many of the lines measured at the start a point along the strip has crossed */
const tabIndexAt = (clientX: number) => {
  const list = tabStrip.value?.querySelector('.view-tabs-list');

  if (!list) {
    return 0;
  }

  // In the strip's own scrolled-out width, so the strip running under a held tab moves nothing
  const x = clientX - list.getBoundingClientRect().left;
  const bounds = tabBounds.value || [];
  let i = 0;

  while (i < bounds.length && x >= bounds[i]) {
    i++;
  }

  return i;
};

/**
 * Carrying a tab to an end of the strip runs the strip that way, so a tab can be taken
 * somewhere that is not on screen yet. A frame loop rather than something driven by the
 * pointer: holding still at the edge should keep going.
 */
const runTabScroll = () => {
  const step = () => {
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    if (!tabDragMoved.value) {
      return;
    }

    const strip = tabStrip.value;

    if (strip) {
      const rect = strip.getBoundingClientRect();

      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      if (tabDragPointer.value < rect.left + TAB_SCROLL_EDGE) {
        strip.scrollLeft -= TAB_SCROLL_STEP;
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        placeDraggedTab();
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      } else if (tabDragPointer.value > rect.right - TAB_SCROLL_EDGE) {
        strip.scrollLeft += TAB_SCROLL_STEP;
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        placeDraggedTab();
      }
    }

    tabScrollFrame = requestAnimationFrame(step);
  };

  cancelAnimationFrame(tabScrollFrame);
  tabScrollFrame = requestAnimationFrame(step);
};

/**
 * The strip's drag, the same as the column picker's but along the strip rather than down a list.
 *
 * The table's own tab is not one of the saved views, so its place is kept beside them.
 */
const {
  heldId: heldTabKey, order: tabDragOrder, moved: tabDragMoved, pointer: tabDragPointer, start: armTabDrag, place: placeDraggedTab
} = useDragReorder({
  axis:         'x',
  initialOrder: () => baseTabs.value.map(tabKey),
  measure:      captureTabSlots,
  indexAt:      tabIndexAt,
  firstMovable: () => LOCKED_TAB_COUNT,
  onBegin:      () => {
    closeTabMenus();
    // Otherwise the pointer selects the tab names it crosses on the way
    window.getSelection()?.removeAllRanges();
    runTabScroll();
  },
  onEnd: () => {
    cancelAnimationFrame(tabScrollFrame);
    tabBounds.value = null;
  },
  onCommit: (order) => {
    const byId: Record<string, TableViewSaved> = {};

    savedViews.value.forEach((view) => {
      byId[view.id] = view;
    });

    persistAll(order.map((key) => byId[key]).filter(Boolean), defaultViewId.value, order.indexOf('all'));
  },
});

/**
 * Press on a tab: arm a possible drag.
 *
 * Nothing is picked up here. A press on a tab is far more often the start of a click that
 * selects the view, so the tab is only taken once the pointer has travelled far enough with it
 * held - and the click that would follow the drop is swallowed.
 */
const startTabDrag = (tab: Tab, event: MouseEvent) => {
  const key = tabKey(tab);

  if (event.button !== 0 || renamingId.value || baseTabs.value.findIndex((t) => tabKey(t) === key) < LOCKED_TAB_COUNT) {
    return;
  }

  armTabDrag(key, event);
};

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
const applyView = (saved: TableViewSaved | null, useDraft = true) => {
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

const nextNewViewName = () => unusedViewName(t('tableViews.tab.newViewName'), 1);

/**
 * Copy a saved view, so a variation can be built without losing the original
 */
const duplicateView = (saved: Omit<TableViewSaved, 'id'>) => {
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

const updateView = (saved: TableViewSaved) => persist(savedViews.value.map((v) => (v.id === saved.id ? { ...v, ...viewToSave.value } : v)));

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
 * A new tab is saved straight away, holding the table's defaults under a name no other view has,
 * and put in front of you - so it is built up in place, and renamed once it is worth naming
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
  } as unknown as TableViewSaved;

  persist(savedViews.value.concat([view]));
  applyView(view);
  focusTab(view.id, true);
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
const openExport = (tab: Tab) => {
  // The tab on screen is what the table is showing, and is exported as it stands, unsaved
  // changes and all. Any other tab is exported as it would open: with the edits held for it if
  // it was left with some, which is also what its count on the strip is counting.
  if (tab.id === selectedViewId.value) {
    modal.value = {
      kind: 'export', name: tab.name, count: props.matchCount
    };

    return;
  }

  const draft = drafts.value[draftKey(tab.id)];
  const saved = tab.view;
  const count = tabCount(tab);

  modal.value = {
    kind:  'export',
    name:  tab.name,
    count: typeof count === 'number' ? count : null,
    view:  draft ? { ...draft } : {
      query:          saved?.query || '',
      columns:        saved?.columns || null,
      columnOrder:    saved?.columnOrder || null,
      labelColumns:   saved?.labelColumns || [],
      groupBy:        saved?.groupBy || null,
      sort:           saved?.sort || null,
      sortDescending: saved?.sortDescending || false,
    },
  };
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
const deleteView = (saved?: TableViewSaved) => {
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

  // The undo rides on the growl and nowhere else: the copy of this kept in the notification
  // centre is written down, and a callback cannot be. So the offer lives and dies on screen,
  // and what is read back later is the plain report that the view was deleted.
  store.dispatch('growl/success', {
    title:   t('tableViews.tab.deleted'),
    // Raw, because the growl prints its message as text: escaped, the quotes around the name
    // would arrive as `&quot;` and be shown as that. Vue escapes it again on the way in.
    message: t('tableViews.tab.deletedMessage', { name: saved.name }, true),
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
  const name = modal.value?.name || t('tableViews.tabs.all');

  emit('export', {
    format, name, view: modal.value?.view
  });
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

onMounted(() => {
  window.addEventListener('keydown', onShortcut);
});

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onShortcut);
  clearTimeout(flashTimer);
  cancelAnimationFrame(flashFrame);
});
</script>

<template>
  <div
    ref="root"
    class="table-views"
    data-testid="table-views-tabs"
  >
    <!-- The rule under the tabs belongs to the row rather than to the strip that scrolls, so it
         spans the width however far along the tabs have been pushed. -->
    <div class="view-tabs-row">
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
          :class="{ 'is-reordering': heldTabKey !== null }"
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
              held: heldTabKey === (tab.id || 'all'),
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
              flush
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
                    @click="openExport(tab)"
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
      :count="modal.count"
      :view-name="modal.name"
      @close="closeModal"
      @export="doExport"
    />
  </app-modal>
</template>

<style lang="scss" scoped>
@import '@shell/components/TableViews/_table-views.scss';

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

.table-views {
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
      // Square, because this is a cover as much as it is a button. The product rounds every
      // `button` by default, which left its background not quite filling its own corners - and a
      // tab passing behind showed through the four little arcs that were left, most visibly as
      // the ends of a focused tab's ring against the strip's edge.
      border-radius: 0;
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

      // The ring is drawn rather than outlined, because an outline sits outside the border box
      // and the scroller clipped it away at the strip's edge. Drawn on top, it follows the
      // button's own box and carries the same radius every other focus ring carries.
      &:focus-visible {
        outline: none;
      }

      &:focus-visible::after {
        content: "";
        position: absolute;
        inset: 0;
        pointer-events: none;
        border: 2px solid var(--primary-keyboard-focus);
        border-radius: var(--border-radius);
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
}

// Marks a view holding changes that aren't saved anywhere
.unsaved-dot {
  width: 6px;
  height: 6px;
  flex: none;
  border-radius: 50%;
  background: var(--error);
}

.menu-panel {
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
}
</style>
