<script setup lang="ts">
/**
 * The saved view tabs above a resource table: one per saved view, plus the table's own tab. The
 * applied view lives in the `view` prop; the filter and View menu below are TableViewControls
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
import { registerTableViewShortcuts } from '@shell/utils/table-views/shortcuts';
import type { TableViewShortcutAction } from '@shell/utils/table-views/shortcuts';
import { randomStr } from '@shell/utils/string';
import { isViewDirty, selectedViewIdFor } from '@shell/utils/table-views/views';
import type { TableViewSaved, TableViewState } from '@shell/types/table-views';
import { RcDropdown, RcDropdownItem, RcDropdownSeparator, RcDropdownTrigger } from '@components/RcDropdown';


/** How close to an end of the strip a held tab has to be before the strip scrolls that way */
const TAB_SCROLL_EDGE = 56;

const TAB_SCROLL_STEP = 12;

const TAB_SCROLL_SETTLE_MAX_MS = 1200;

const TAB_FLASH_MS = 600;

/** Longer than a growl's usual 5s: it is the only way back */
const UNDO_TIMEOUT = 10000;

interface Tab {
  id: string | null;
  name: string;
  view?: TableViewSaved;
  isDefaultTab?: boolean;
}

/** The table's own tab has no id, and null also means "nothing" */
function tabKey(tab: { id?: string | null }) {
  return tab.id || 'all';
}

const props = withDefaults(defineProps<{
  view: TableViewState,
  /** query -> rows matched, counted by the table rather than read off the rows on screen */
  viewCounts?: Record<string, number | null>,
  matchCount?: number,
  resourceType?: string,
  /** A page keeping views of its own for the type - see useSavedTableViews */
  tableViewsPage?: string | null,
  /** The saved view the list opened on - see the mixin's openedViewId */
  initialViewId?: string,
}>(), {
  viewCounts:     () => ({}),
  matchCount:     0,
  resourceType:   '',
  tableViewsPage: null,
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
} = useSavedTableViews(() => props.resourceType, () => props.tableViewsPage);

const root = ref<HTMLElement | null>(null);

const tabStrip = ref<HTMLElement | null>(null);

/** Function refs, as there is a set per tab */
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
 * `undefined` if nothing is picked yet, `null` for the table's own tab, else a saved view's id. The
 * first two must differ, or a saved view holding the same config would be matched instead
 */
const pickedViewId = ref<string | null | undefined>(props.initialViewId);

/** Unsaved edits per tab, kept while the page is open so leaving a tab doesn't lose them */
const drafts = ref<Record<string, TableViewState>>({});

/** For an export: the tab's name, its row count (null if unknown) and, for a tab not on screen, its view */
const modal = ref<{ kind: 'export', name: string, count: number | null, view?: TableViewState } | null>(null);

const renamingId = ref<string | null>(null);

const renameDraft = ref('');

const tabBounds = ref<number[] | null>(null);

const openTabMenuId = ref<string | null>(null);

const flashTabId = ref<string | null>(null);

let flashTimer: ReturnType<typeof setTimeout> | undefined;

let flashFrame = 0;

let tabScrollFrame = 0;

const shortcuts = computed(() => {
  const modifier = isMac ? '⌘' : 'Ctrl';

  return {
    save:      shortcutLabel([modifier, 'S']),
    saveAsNew: shortcutLabel([modifier, 'Shift', 'S']),
    duplicate: shortcutLabel([modifier, 'D']),
  };
});

/** The saved strip: the view the list opens on leads, then the table's own tab and the other views */
const baseTabs = computed<Tab[]>(() => {
  const all: Tab = {
    id: null, name: t('tableViews.tabs.all'), isDefaultTab: true
  };
  const tabs: Tab[] = savedViews.value.map((view) => ({
    id: view.id, name: view.name, view
  }));

  tabs.splice(allTabIndex.value, 0, all);

  // With no default set, the table's own tab leads
  const lead = tabs.findIndex((tab) => (defaultViewId.value ? tab.view?.id === defaultViewId.value : tab.isDefaultTab));

  if (lead <= 0) {
    return tabs;
  }

  return [tabs[lead]].concat(tabs.filter((_, i) => i !== lead));
});

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

/** The tab the list opens on can't be dragged out of the front, nor anything dropped before it */
const LOCKED_TAB_COUNT = 1;

const selectedViewId = computed(() => selectedViewIdFor(savedViews.value, props.view, pickedViewId.value));

/** The one tab Tab can land on (roving tabindex); the first if the current view isn't among them */
const focusableTabId = computed(() => {
  const list = tabs.value || [];
  const selected = list.find((tab) => tab.id === selectedViewId.value);

  return (selected || list[0])?.id;
});

const isDirty = computed(() => isViewDirty(savedViews.value, props.view, pickedViewId.value));


const draftKey = (id: string | null | undefined) => id || '__default';

/**
 * What a tab is filtering by: the box for the tab on screen, else its held edits or saved query.
 * Counts are looked up by query, so they survive the list fetching a page
 */
const tabQuery = (tab: Tab) => {
  if (tab.id === selectedViewId.value) {
    return props.view.query || '';
  }

  const draft = drafts.value[draftKey(tab.id)];

  return (draft ? draft.query : tab.view?.query) || '';
};

const tabQueries = computed(() => Array.from(new Set(tabs.value.map((tab) => tabQuery(tab)))));

const tabCount = (tab: Tab) => props.viewCounts[tabQuery(tab)];

const tabLabel = (tab: Tab) => {
  const count = tabCount(tab);

  // undefined: not counted yet. null: the api wouldn't say
  return count === undefined || count === null ? tab.name : t('tableViews.tabs.count', { name: tab.name, count });
};

const isTabDirty = (tab: Tab) => {
  if (tab.id === selectedViewId.value) {
    return isDirty.value;
  }

  return !!drafts.value[draftKey(tab.id)];
};

/** Compared by table masthead, so a second table on the page keeps its own shortcuts */
const ownsTarget = (target: EventTarget | null) => {
  // The root is a fragment (the modal is beside the tabs), so it has a ref of its own
  const el = root.value;

  if (!el?.closest || !(target instanceof Element)) {
    return false;
  }

  // The rows count as the list too; the masthead is the fallback outside table views layout
  const listOf = (node: Element) => node.closest('.has-table-views') || node.closest('.fixed-header-actions');
  const mine = listOf(el);

  return !!mine && listOf(target) === mine;
};

const tabWrap = (tab: Tab) => tabWraps.get(tabKey(tab));

const tabButton = (tab: Tab) => tabButtons.get(tabKey(tab));

/** A component, so its element is one step down */
const tabCaret = (tab: Tab) => {
  const cmp = tabCarets.get(tabKey(tab));

  return cmp instanceof Element ? cmp : cmp?.$el;
};

/** The menu is positioned against its tab, so it closes when the tab moves */
const closeTabMenus = () => {
  openTabMenuId.value = null;
};

/**
 * Measured once as the drag begins, relative to the list: measuring the live order swaps tabs back
 * and forth
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

  // The middle of the gap between two tabs
  tabBounds.value = boxes.slice(0, -1).map((box, i) => (box.right + boxes[i + 1].left) / 2);
};

const tabIndexAt = (clientX: number) => {
  const list = tabStrip.value?.querySelector('.view-tabs-list');

  if (!list) {
    return 0;
  }

  const x = clientX - list.getBoundingClientRect().left;
  const bounds = tabBounds.value || [];
  let i = 0;

  while (i < bounds.length && x >= bounds[i]) {
    i++;
  }

  return i;
};

/** A frame loop, so holding still at the edge keeps it scrolling */
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

/** The table's own tab isn't a saved view, so its place is kept beside them */
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
    // Otherwise the pointer selects the tab names it crosses
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

const rememberDraft = (id: string | null | undefined) => {
  const key = draftKey(id);

  if (isDirty.value) {
    drafts.value = { ...drafts.value, [key]: { ...props.view } };

    return;
  }

  forgetDraft(id);
};

/** The state a saved view applies, or the table's own tab's - always the table as it comes - for none */
const viewStateOf = (saved?: Partial<TableViewState> | null): TableViewState => ({
  query:          saved?.query || '',
  columns:        saved?.columns || null,
  columnOrder:    saved?.columnOrder || null,
  labelColumns:   saved?.labelColumns || [],
  groupBy:        saved?.groupBy || null,
  sort:           saved?.sort || null,
  sortDescending: saved?.sortDescending || false,
});

/**
 * @param saved the view to show, or null for the table's own tab
 * @param useDraft bring back unsaved edits left on the tab; off when putting it back as saved
 */
const applyView = (saved: TableViewSaved | null, useDraft = true) => {
  const from = selectedViewId.value;
  const to = saved?.id || null;
  const moving = from !== to;

  // Clicking the tab already on screen doesn't throw its edits away
  if (!moving && useDraft) {
    pickedViewId.value = to;

    return;
  }

  // Before the pick moves: unsaved changes are measured against the tab being left
  if (moving) {
    rememberDraft(from);
  }

  pickedViewId.value = to;

  const draft = useDraft ? drafts.value[draftKey(to)] : null;

  if (draft) {
    emit('update:view', { ...draft });

    return;
  }

  emit('update:view', viewStateOf(saved));
};

/** The tab in front of the user */
const selectedTab = () => (tabs.value || []).find((tab) => tab.id === selectedViewId.value);

/** A tab's state as it stands: what is on screen for the tab in front, its held edits for the rest */
const tabState = (tab: Tab): TableViewState => {
  if (tab.id === selectedViewId.value) {
    return { ...props.view };
  }

  return drafts.value[draftKey(tab.id)] || viewStateOf(tab.view);
};

/** Put a tab in front as it was left, without keeping anything for the one it replaces */
const showTab = (tab?: Tab) => {
  const id = tab?.id || null;
  const draft = drafts.value[draftKey(id)];

  pickedViewId.value = id;
  emit('update:view', draft ? { ...draft } : viewStateOf(tab?.view));
};

// The menu's actions are for the tab it was opened on, which need not be the one in front
const discardChanges = (tab = selectedTab()) => {
  if (!tab) {
    return;
  }

  forgetDraft(tab.id);

  if (tab.id === selectedViewId.value) {
    applyView(tab.view || null, false);
  }
};

/**
 * Focus a view's tab and bring it into sight. `toEnd` runs the strip to its end, where a new tab is
 * before the strip has laid it out
 */
const focusTab = (id: string | null, toEnd = false) => {
  nextTick(() => {
    const tab = (tabs.value || []).find((candidate) => candidate.id === id);
    const btn = tab && tabButton(tab);

    if (!btn) {
      return;
    }

    // Focus would scroll the strip itself, fighting the run to the end
    btn.focus({ preventScroll: !!toEnd });

    if (!toEnd) {
      btn.scrollIntoView({ block: 'nearest', inline: 'nearest' });

      return;
    }

    requestAnimationFrame(() => {
      const strip = tabStrip.value;

      if (strip) {
        strip.scrollLeft = strip.scrollWidth;
      }
    });
  });
};

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

const duplicateView = (saved: Omit<TableViewSaved, 'id'>) => {
  const name = unusedViewName(`${ saved.name } ${ t('tableViews.tab.copySuffix') }`, 2);
  const copy = {
    ...saved, id: randomStr(8), name
  };

  persist(savedViews.value.concat([copy]));
  applyView(copy);
  focusTab(copy.id, true);
  nextTick(() => openRename(copy));
};

/**
 * Saves the tab with its unsaved changes as a new view, landing like a copy: in front, its name
 * open for typing. The tab they were copied from keeps them
 */
const openSaveAsNew = (tab = selectedTab()) => {
  if (!tab || (!isTabDirty(tab) && pickedViewId.value === undefined)) {
    return;
  }

  duplicateView({ ...viewStateOf(tabState(tab)), name: tab.name });
};

const saveChanges = (tab = selectedTab()) => {
  // The table's own tab can't be saved over; keeping its changes is Save as New, not this
  if (!tab?.view || !isTabDirty(tab)) {
    return;
  }

  const state = viewStateOf(tabState(tab));

  persist(savedViews.value.map((v) => (v.id === tab.view?.id ? { ...v, ...state } : v)));
  forgetDraft(tab.id);
};

/** Saved straight away with the table's defaults, and renamed once it is worth naming */
const addView = () => {
  const view: TableViewSaved = {
    ...viewStateOf(), id: randomStr(8), name: nextNewViewName()
  };

  persist(savedViews.value.concat([view]));
  applyView(view);
  focusTab(view.id, true);
};

/** Focus follows: with a roving tabindex, the tab left behind is no longer reachable */
const goToTab = (tab: Tab) => {
  applyView(tab.view || null);
  focusTab(tab.id);
};

/** Moving focus picks the view too, as the product's other tabs do */
const stepTab = (delta: number) => {
  const list = tabs.value || [];

  if (list.length < 2) {
    return;
  }

  // Not always the tab in force: deleting a view leaves focus on the one before
  const focused = list.findIndex((tab) => tabButton(tab) === document.activeElement);
  const at = focused >= 0 ? focused : list.findIndex((tab) => tab.id === focusableTabId.value);
  const next = list[((at < 0 ? 0 : at) + delta + list.length) % list.length];

  goToTab(next);
};

const edgeTab = (which: string) => {
  const list = tabs.value || [];
  const next = which === 'first' ? list[0] : list[list.length - 1];

  if (next) {
    goToTab(next);
  }
};

/**
 * The chevron is out of the tab sequence, so the down arrow opens the menu. Flagged as a key press
 * first, so the menu focuses its first row
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
 * The chevron takes focus back on close, but it answers no arrows - return it to the tab, unless a
 * click has moved focus elsewhere
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

/** Waits for the scroll to finish rather than a fixed delay; the cap covers one that never does */
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

const openExport = (tab: Tab) => {
  // The tab on screen is exported as it stands; another as it would open, with any held edits
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
    view:  draft ? { ...draft } : viewStateOf(saved),
  };
};

const closeModal = () => {
  modal.value = null;
};

/** The table's own tab included: copying it is how to start a view from the table as it comes */
const duplicateTab = (tab: Tab) => {
  duplicateView(tab.view || { ...viewStateOf(), name: t('tableViews.tabs.all') });
};

const duplicateCurrent = () => {
  const tab = tabs.value.find((candidate) => candidate.id === selectedViewId.value);

  if (tab) {
    duplicateTab(tab);
  }
};

/** Picking the table's own tab is how to go back to no default */
const setDefaultView = (tab: Tab) => {
  persistAll(savedViews.value, tab.isDefaultTab ? null : tab.view?.id || null);

  // The tab just moved to the front, so scroll there and flash it to say why the strip moved
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

const isDefaultTab = (tab: Tab) => (tab.isDefaultTab ? !defaultViewId.value : defaultViewId.value === tab.view?.id);

/**
 * Deleted at once and offered back, rather than confirmed first. Undo restores its place, default
 * and held edits too
 */
const deleteView = (saved?: TableViewSaved) => {
  if (!saved) {
    return;
  }

  const wasSelected = selectedViewId.value === saved.id;
  const wasDefault = defaultViewId.value === saved.id;
  const at = savedViews.value.findIndex((v) => v.id === saved.id);
  const draft = drafts.value[draftKey(saved.id)];
  // Taken before the view goes: the tab to its left, or to its right when it was the first
  const list = tabs.value || [];
  const index = list.findIndex((tab) => tab.id === saved.id);
  const neighbour = list[index > 0 ? index - 1 : index + 1];

  // Its edits go with it, so nothing of it is left on screen for the tab taking its place
  forgetDraft(saved.id);
  persist(savedViews.value.filter((v) => v.id !== saved.id));

  if (wasSelected) {
    showTab(neighbour);
  }

  if (neighbour) {
    focusTab(neighbour.id);
  }

  // The undo only lives on the growl: the notification centre stores a copy, and a callback can't
  // be stored
  store.dispatch('growl/success', {
    title:   t('tableViews.tab.deleted'),
    // Raw, since the growl renders text: escaped, the quotes would show as `&quot;`
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
  // Kept for the notification, which outlives the modal
  const name = modal.value?.name || t('tableViews.tabs.all');

  emit('export', {
    format, name, view: modal.value?.view
  });
  closeModal();
};

const SHORTCUT_ACTIONS: Record<TableViewShortcutAction, () => void> = {
  saveChanges, openSaveAsNew, duplicateCurrent
};

watch(tabQueries, (queries) => emit('tab-queries', queries), { immediate: true });

/** The keys are bound in ResourceTable's shortkeys template; the list the focus is in answers them */
let unregisterShortcuts: (() => void) | null = null;

onMounted(() => {
  unregisterShortcuts = registerTableViewShortcuts({
    owns: ownsTarget,
    run:  (action) => SHORTCUT_ACTIONS[action](),
  });
});

onBeforeUnmount(() => {
  unregisterShortcuts?.();
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
    <!-- The rule belongs to the row, so it spans the width however far the tabs scroll -->
    <div class="view-tabs-row">
      <div
        ref="tabStrip"
        class="view-tabs"
        @scroll="closeTabMenus"
      >
        <!-- One tab stop for the strip: arrows walk it, Tab leaves for Add View -->
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
            <!-- Not for the table's own tab: it has no name, and its null id means "nothing being renamed" -->
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

            <!-- Positioned against the whole tab, not the chevron -->
            <rc-dropdown
              :open="openTabMenuId === (tab.id || 'all')"
              :placement="'bottom-start'"
              :distance="9"
              :reference-node="() => tabWrap(tab)"
              @update:open="onTabMenuToggle(tab, $event)"
            >
              <!-- Out of the tab sequence: the down arrow on the tab opens this -->
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
                  <template v-if="isTabDirty(tab)">
                    <div class="menu-notice">
                      <span class="unsaved-dot" />
                      {{ t('tableViews.view.unsaved') }}
                    </div>
                    <rc-dropdown-item
                      v-if="!tab.isDefaultTab"
                      data-testid="table-views-save-changes"
                      @click="saveChanges(tab)"
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
                      @click="openSaveAsNew(tab)"
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
                      @click="discardChanges(tab)"
                    >
                      <template #before>
                        <i class="menu-gutter" />
                      </template>
                      {{ t('tableViews.view.discard') }}
                    </rc-dropdown-item>
                    <rc-dropdown-separator />
                  </template>

                  <!-- The table's own tab can't be renamed, saved over or deleted -->
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

  <!-- The same modal the Export As... action opens through the modal manager, hence no frame of its own -->
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

// Same as `cluster-scroll-shadow` in TopLevelMenu: shown along the scroll, gone at the end
@keyframes view-tab-scroll-shadow {
  0%, 88% {
    opacity: 1;
  }

  100% {
    opacity: 0;
  }
}

.table-views {
  .view-tabs-row {
    width: 100%;
    border-bottom: 1px solid var(--border);
  }

  .view-tabs {
    display: flex;
    align-items: stretch;
    gap: 24px;
    // Naming one axis sets the other to `auto`
    overflow-x: auto;
    overflow-y: hidden;
    // Room for focus rings, which a scroll box clips. None on the right, where it would show a ring
    // passing behind Add View
    padding: 3px 0 3px 3px;
    margin: -3px 0 -4px -3px;

    > * {
      flex: none;
    }

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

  .view-tabs-list {
    display: flex;
    align-items: stretch;
    gap: 24px;

    > * {
      flex: none;
    }
  }

  // Only while carrying: FLIP also fires on renames and count changes
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

    // Lifted like the app bar's pinned shelf rows; the extra room is given back as margin so the
    // strip doesn't reflow
    .view-tab-wrap.held {
      position: relative;
      z-index: 1;
      transform: scale(1.02);
      transition: transform 0.2s $drag-displace-curve;

      border-bottom-color: transparent;

      // Painted behind rather than padded, so the tab's box doesn't move when it is picked up
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

  // Drawn the way the app bar marks a cluster arriving on the pinned shelf
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

    // Behind the tab, so the mark doesn't move it
    &::before {
      content: '';
      position: absolute;
      inset: 0 -12px;
      z-index: -1;
      border-radius: var(--border-radius);
      animation: view-tab-wash 0.6s ease-out;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .view-tab-wrap.flash {
      animation: none;
    }
  }

  .view-tab-wrap {
    user-select: none;
    display: flex;
    align-items: center;
    gap: 8px;
    height: 32px;
    border-bottom: 2px solid transparent;

    // One ring around the name and chevron together, drawn as a shadow so it passes under Add View.
    // Not while renaming: the field has its own
    &:has(> .view-tab:focus-visible):not(:has(.rename-input)) {
      border-radius: var(--border-radius);
      outline: none;
      box-shadow: 0 0 0 1px var(--body-bg), 0 0 0 3px var(--primary-keyboard-focus);
    }

    // The wrap rings the pair, so neither half does. `!important` and `:focus`: RcButton's own
    // scoped rule would otherwise ring the chevron on click
    .view-tab:focus,
    .view-tab:focus-visible,
    .view-tab-caret:focus,
    .view-tab-caret:focus-visible {
      outline: none !important;
    }

    // Like the product's other tabs: every tab a link, the active one marked by its rule
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

    // Out of the flow, so a dirty tab is no wider than a clean one
    > .unsaved-dot {
      position: absolute;
      top: 2px;
      left: 100%;
      margin-left: 1px;
    }
    // The global button rule's 40px min-height
    min-height: 32px;
    background: transparent;
    border: none;
    padding: 0;
    cursor: pointer;
    color: var(--link);
    font-size: 14px;
    line-height: 20px;
    white-space: nowrap;

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

      // Its own ring, written out with `!important`: the global text input rule removes outlines
      &:focus-visible {
        outline: 2px solid var(--primary-keyboard-focus) !important;
        outline-offset: -1px;
      }
    }

    // Sticky at the end of the strip, casting the scroll shadow over the tabs passing under it
    &.new-view-tab {
      position: sticky;
      // Painted above the tabs passing under it
      z-index: 1;
      gap: 8px;
      height: auto;
      min-height: 32px;
      // Room on its left for tabs to pass under, given back as margin
      padding: 3px 3px 3px 8px;
      // Covers the strip's full height and padding, including the pixel an active tab's underline
      // hangs over the rule
      right: 0;
      margin: -3px 0 -3px -8px;
      align-self: stretch;
      // Square, so tabs don't show through rounded corners
      border-radius: 0;
      // The row's rule drawn back over the page colour, as a background layer
      background-color: var(--body-bg);
      background-image: linear-gradient(var(--border), var(--border));
      background-repeat: no-repeat;
      background-position: left calc(100% - 3px);
      background-size: 100% 1px;
      color: var(--link);

      &::before {
        content: "";
        position: absolute;
        top: 0;
        // Stops at the row's rule, which doesn't scroll
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

      // Drawn, since the scroller would clip an outline
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

  // Two classes deep to beat `.btn-medium`'s padding
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

.unsaved-dot {
  width: 6px;
  height: 6px;
  flex: none;
  border-radius: 50%;
  background: var(--error);
}

.menu-panel {
  // Pulled up over the popper's padding, so the banner meets the menu's rounded top
  &.has-notice {
    // The popper's 10, the menu's 3 and the panel's own 3
    margin-top: -16px;
  }

  .menu-notice {
    display: flex;
    align-items: center;
    gap: 8px;
    height: 40px;
    margin: 0 0 8px;
    border-radius: var(--border-radius-lg) var(--border-radius-lg) 0 0;
    padding: 0 17px;
    // The informative badge wash: `--primary` goes green on Prime and reads as success
    background: var(--info-badge, var(--info-banner));
    color: var(--body-text);
    font-size: 14px;

    // In the icons' column, so the notice lines up with the rows below
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
