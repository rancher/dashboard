<script setup lang="ts">
/**
 * Search-first cluster switcher: a search box over the fixed `local` tile, RECENTLY USED and the estate.
 * Data comes from the parent; this owns the panel, the cursor and the keyboard.
 */
import {
  computed, nextTick, onBeforeUnmount, ref, watch
} from 'vue';
import { useStore } from 'vuex';
import { useI18n } from '@shell/composables/useI18n';
import ClusterSwitcherRow from '@shell/components/nav/ClusterSwitcherRow.vue';
import ClusterSwitcherSkeleton from '@shell/components/nav/ClusterSwitcherSkeleton.vue';
import type { TopLevelMenuCluster } from '@shell/components/nav/TopLevelMenu.helper';
import { reportPinWriteFailure } from '@shell/utils/cluster-pref-writer';
import { isMac } from '@shell/utils/platform';
import { SWITCHER_MAX_RECENT, SWITCHER_PAGE_SIZE } from '@shell/store/prefs';
import { SWITCHER_POPPER_CLASS } from '@shell/utils/dom';

type Props = {
  local?: TopLevelMenuCluster | null;
  all?: TopLevelMenuCluster[];
  recent?: TopLevelMenuCluster[];
  recentLoading?: boolean;
  searchResults?: TopLevelMenuCluster[];
  clusterCount?: number;
  searchCount?: number;
  listLoading?: boolean;
  listFailed?: boolean;
  recentCount?: number;
  currentClusterId?: string;
  search?: string;
  hasMore?: boolean;
  loadingMore?: boolean;
  routeCombo?: boolean;
  navExpanded?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  local:            null,
  all:              () => [],
  recent:           () => [],
  recentLoading:    false,
  searchResults:    () => [],
  clusterCount:     0,
  searchCount:      0,
  listLoading:      false,
  listFailed:       false,
  recentCount:      0,
  currentClusterId: '',
  search:           '',
  hasMore:          false,
  loadingMore:      false,
  routeCombo:       false,
  navExpanded:      false,
});

const emit = defineEmits(['update:search', 'select', 'update:open', 'load-more']);

// Timing contracts against floating-vue's show/hide, not arbitrary numbers: how long to wait for the
// teleported popper to actually leave the DOM, and how many frames to keep re-claiming focus while it
// grabs focus for its own container on show.
const POPPER_UNMOUNT_TIMEOUT_MS = 400;
const FOCUS_RETRY_ATTEMPTS = 6;
const FOCUS_RETRY_INTERVAL_MS = 30;

// How long a pin/unpin confirmation holds the live region before it is handed back to the result count.
// Long enough for a screen reader to get through the message, short enough that the next result-set
// change still announces.
const PIN_ANNOUNCEMENT_TIMEOUT_MS = 2000;

const store = useStore();
const { t } = useI18n(store);

// No row under the keyboard cursor: nothing is highlighted and focus is in the search box. Where the
// cursor starts, and where it returns to whenever the flyout opens.
const NO_ACTIVE_INDEX = -1;

const open = ref<boolean>(false);
const activeIndex = ref<number>(NO_ACTIVE_INDEX);
const keyboardActive = ref<boolean>(false);
const searchInput = ref<HTMLElement | null>(null);
const scroller = ref<HTMLElement | null>(null);
const flyout = ref<HTMLElement | null>(null);

const searching = computed<boolean>(() => !!props.search);

// The popper is teleported out of this component's scope, so its offset from the nav is carried by a
// class on the popper itself (see the unscoped block at the bottom).
// The panel is on its way OUT. Our own flag rather than floating-vue's `--hidden` / `--hide-to`, which it
// also sets while the popper is being CREATED — keying the closing wipe on those played it on the way in,
// so the panel flashed open, rolled shut and only then unrolled properly.
// Long enough to out-last the closing wipe. floating-vue's own default is 150ms, which unmounted the
// panel part-way through it.
const DISPOSE_TIMEOUT = 300;
const closing = ref<boolean>(false);
const popperClass = computed(() => [
  SWITCHER_POPPER_CLASS,
  props.navExpanded ? 'nav-expanded' : '',
  closing.value ? 'is-closing' : '',
].filter((c) => !!c).join(' '));

const directory = computed<TopLevelMenuCluster[]>(() => props.all.filter((c) => !c.isLocal));

// The flat list the ↑↓ cursor and Enter operate over: matches while searching, else the ALL directory.
// While a search is in flight the list on screen is the skeleton, not `searchResults` (those still
// describe the PREVIOUS query). Return nothing so the ↑↓ cursor and Enter can never target a row that
// is not rendered.
const rows = computed<TopLevelMenuCluster[]>(() => {
  if (!searching.value) {
    return directory.value;
  }

  return props.listLoading ? [] : props.searchResults;
});

const SKELETON_FALLBACK_ROWS = 3;
const estateSkeletonRows = computed<number>(() => Math.min(props.clusterCount || SKELETON_FALLBACK_ROWS, SWITCHER_PAGE_SIZE));
const recentSkeletonRows = computed<number>(() => Math.min(props.recentCount, SWITCHER_MAX_RECENT));

// How many rows the list was showing before this request started. Kept up to date whenever the list is
// actually on screen, because by the time one is in flight `rows` has already emptied.
const rowsOnScreen = ref<number>(0);

watch([() => props.listLoading, rows], () => {
  if (!props.listLoading) {
    rowsOnScreen.value = rows.value.length;
  }
}, { immediate: true });

// A search is a REFINEMENT of what is already there, so the skeleton stands in at that size: narrowing
// three matches to one should move the panel once, not send it through the height of the whole estate and
// back. The estate's own count is still right for the resting list, which is what the skeleton replaces
// when the panel opens or the list is refetched.
const skeletonRows = computed<number>(() => (searching.value ? Math.max(1, Math.min(rowsOnScreen.value || SKELETON_FALLBACK_ROWS, SWITCHER_PAGE_SIZE)) : estateSkeletonRows.value));

const showingSkeleton = computed<boolean>(() => props.listLoading);

// Nothing for `fillViewport` to measure — topping up here would ask for page 2 of a list whose page 1
// never arrived.
const noListOnScreen = computed<boolean>(() => showingSkeleton.value || props.listFailed || !rows.value.length);

const localTile = computed<TopLevelMenuCluster | null>(() => (props.local && !searching.value ? props.local : null));

const recentRows = computed<TopLevelMenuCluster[]>(() => (searching.value || props.recentLoading ? [] : props.recent));

const showRecent = computed<boolean>(() => !searching.value &&
  ((props.recentLoading && recentSkeletonRows.value > 0) || !!recentRows.value.length));

// The panel owns all three sections for the keyboard: nav runs the fixed tile, then RECENTLY USED, then
// the list, while each section renders only its own rows — `resultsOffset` keeps the rendered order and
// the flat model in lock-step, which is what lets focus be addressed by index.
// Where the current cluster FIRST appears in the flat list. It can be on screen up to three times — the
// fixed tile, a RECENTLY USED shortcut and its row in the estate — and `aria-current` marks one thing, so
// announcing all three tells a screen-reader user there are three current clusters. The first occurrence
// carries it; the others still render as current, which is what a sighted user is reading.
const currentAnnouncedAt = computed<number>(() => navRows.value.findIndex((c) => c.id === props.currentClusterId));

const localOffset = computed<number>(() => (localTile.value ? 1 : 0));
const resultsOffset = computed<number>(() => localOffset.value + recentRows.value.length);
const navRows = computed<TopLevelMenuCluster[]>(() => [
  ...(localTile.value ? [localTile.value] : []),
  ...recentRows.value,
  ...rows.value,
]);

const restingIndex = () => (searching.value && navRows.value.length ? 0 : NO_ACTIVE_INDEX);

const pinShortcut = isMac ? 'Meta+Shift+P' : 'Alt+P';

const placeholder = computed(() => t('nav.switcher.jumpTo'));

// Row ids. Not an ARIA wiring any more — the rows are buttons that take focus themselves — but the list
// still addresses rows by id to scroll one into view, and the search box names the region it searches.
const listboxId = 'cluster-switcher-listbox';
const optionId = (c: TopLevelMenuCluster) => `cluster-switcher-opt-${ c.id }`;
// RECENTLY USED repeats clusters that are also the fixed tile or rows of the estate, so its rows carry
// their own ids — two elements answering to one id would give Vue duplicate keys.
const recentOptionId = (c: TopLevelMenuCluster) => `cluster-switcher-opt-recent-${ c.id }`;

const optionIdAt = (index: number): string | undefined => {
  const c = navRows.value[index];

  if (!c) {
    return undefined;
  }

  const inRecent = index >= localOffset.value && index < resultsOffset.value;

  return inRecent ? recentOptionId(c) : optionId(c);
};

const indexByOptionId = computed<Record<string, number>>(() => navRows.value.reduce((acc, _c, i) => {
  const id = optionIdAt(i);

  if (id) {
    acc[id] = i;
  }

  return acc;
}, {} as Record<string, number>));

// A pin toggle has nothing else to announce it — the pin control is `aria-hidden` inside the option and
// the pin shortcut is the only keyboard route to it — so route a one-line confirmation through this live
// region. Cleared whenever the result set is re-announced (search change / reopen).
const pinAnnouncement = ref<string>('');

const statusMessage = computed(() => {
  if (pinAnnouncement.value) {
    return pinAnnouncement.value;
  }
  // The failure outranks the counts below it: they would otherwise go on reporting an estate total for a
  // list that failed to load. Announced HERE rather than as an alert beside the rows, because this panel's
  // one listbox may only contain options and groups — a live region is where a status belongs anyway.
  if (props.listFailed) {
    return t('nav.switcher.loadError');
  }
  if (props.listLoading && searching.value) {
    return t('nav.switcher.aria.searching');
  }
  if (searching.value && !rows.value.length) {
    return t('nav.switcher.aria.noResults');
  }
  const count = searching.value ? (props.searchCount || rows.value.length) : (props.clusterCount || directory.value.length);

  return t('nav.switcher.aria.results', { count });
});

const onPointerMove = (e: MouseEvent) => {
  const row = (e.target as HTMLElement)?.closest?.('.cluster-switcher-row');

  if (!row) {
    return;
  }

  const index = indexByOptionId.value[row.id] ?? NO_ACTIVE_INDEX;

  if (index < 0) {
    return;
  }

  keyboardActive.value = false;

  if (index !== activeIndex.value) {
    activeIndex.value = index;
    cursorMoved.value = true;
  }
};

const cursorMoved = ref<boolean>(false);

watch(() => props.search, () => {
  activeIndex.value = restingIndex();
  keyboardActive.value = false;
  cursorMoved.value = false;
  pinAnnouncement.value = '';
});

watch(() => rows.value.length, (len) => {
  if (len && !cursorMoved.value && searching.value) {
    activeIndex.value = restingIndex();
  }
});

// The list can shrink without the search term changing (unpinning a row that only appeared via the
// parent's pinned/recent tail), which would strand the cursor past the end and leave Enter dead. Clamp
// only when it is actually out of range, so a normal pin/load-more never moves it.
watch(() => navRows.value.length, (len) => {
  if (activeIndex.value > len - 1) {
    activeIndex.value = Math.max(0, len - 1);
  }
});

const focusOrigin = ref<HTMLElement | null>(null);

const setOpen = (value: boolean) => {
  const wasOpen = open.value;

  // Only an OPEN clears it. Closing arrives twice on some paths — our own toggle, then floating-vue's
  // `apply-hide` behind it — and the second call finds `wasOpen` already false, so deriving the flag from
  // it wiped the class mid-close: the overrides went with it, and swapping the animation name back
  // restarted the OPENING wipe on a panel that was by then hidden.
  if (value) {
    closing.value = false;
  } else if (wasOpen) {
    closing.value = true;
  }

  open.value = value;
  emit('update:open', value);

  if (value) {
    focusOrigin.value = document.activeElement as HTMLElement | null;
    activeIndex.value = restingIndex();
    keyboardActive.value = false;
    cursorMoved.value = false;
    pinAnnouncement.value = '';
    // Focus happens on the dropdown's `apply-show` (focusSearchInput) — here is too early, the teleported
    // input isn't mounted yet.
  } else if (wasOpen) {
    const active = document.activeElement;

    if (!active || active === document.body || active.closest('.cluster-switcher-popper')) {
      focusOrigin.value?.focus?.();
    }

    focusOrigin.value = null;
  }
};

const toggle = () => {
  setOpen(!open.value);
};

// Close the flyout and resolve once it has ACTUALLY left the screen. floating-vue's `apply-hide` fires
// when the hide *starts* — the popper stays mounted through its fade — so it can't answer "is it gone
// yet?". The teleported element leaving the DOM can, so poll for that, bounded by a deadline so a caller
// is never left waiting. Resolves immediately when nothing is open.
const closeAndWait = (): Promise<void> => {
  setOpen(false);

  if (!document.querySelector('.cluster-switcher-popper')) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    const deadline = Date.now() + POPPER_UNMOUNT_TIMEOUT_MS;
    const check = () => {
      if (!document.querySelector('.cluster-switcher-popper') || Date.now() > deadline) {
        resolve();

        return;
      }
      requestAnimationFrame(check);
    };

    requestAnimationFrame(check);
  });
};

// Focus the search once the popper is mounted (floating-vue's `apply-show`). It grabs focus for its own
// container on show, so retry a few frames until the input keeps focus.
const focusSearchInput = () => {
  const tryFocus = (attempts: number) => {
    const el = searchInput.value;

    if (el) {
      el.focus();
      if (document.activeElement === el || attempts <= 0) {
        return;
      }
    }
    if (attempts > 0) {
      setTimeout(() => tryFocus(attempts - 1), FOCUS_RETRY_INTERVAL_MS);
    }
  };

  nextTick(() => {
    // floating-vue stamps `role="tooltip"` on the teleported popper root, which then wraps this panel —
    // a tooltip may not own interactive content. Neutralise the wrapper; the dialog inside carries the
    // real semantics.
    document.querySelector('.cluster-switcher-popper')?.setAttribute('role', 'presentation');

    tryFocus(FOCUS_RETRY_ATTEMPTS);
  });
};

const onInput = (e: Event) => {
  emit('update:search', (e.target as HTMLInputElement).value);
};

// Empty the search box and keep focus in it (Escape's first press; the box has no clear button).
const clearSearch = () => {
  emit('update:search', '');
  searchInput.value?.focus();
};

// Escape peels one layer at a time: it empties a search that has something in it, and only closes the
// flyout once there is nothing left to clear.
//
// This has to run before anything else sees the key. floating-vue closes the dropdown on Escape through
// its own listener, which a handler on the flyout cannot head off — the search would clear AND the panel
// would shut in the same press. So take Escape at the window, in the capture phase, and consume it
// outright while there is a query to clear; with the field already empty it passes through untouched and
// the close path in `onKeydown` runs as before.
// One press is two events, and the field is empty again by the time the second arrives — so the keyup
// has to be swallowed on the strength of what the keydown did, not on whether there is still a query.
// Letting it through is what closed the flyout: floating-vue acts on the keyup.
let swallowEscapeKeyup = false;

const onKeyCapture = (e: Event) => {
  if (!open.value) {
    return;
  }

  const key = e as KeyboardEvent;
  const consume = () => {
    e.preventDefault();
    e.stopImmediatePropagation();
  };

  if (key.code === 'KeyJ' && (key.metaKey || key.ctrlKey) && !key.altKey && !key.shiftKey) {
    consume();

    if (e.type === 'keydown') {
      setOpen(false);
    }

    return;
  }

  if (key.code === 'KeyP' && ((key.metaKey && key.shiftKey) || key.altKey)) {
    consume();

    if (e.type === 'keydown') {
      togglePin(navRows.value[activeIndex.value]);
    }

    return;
  }

  // Everything else the panel owns — ↑/↓, Enter, Tab — is taken here too, not on the flyout element.
  // Clicking the panel's own chrome parks focus on floating-vue's popper ROOT, which is an ANCESTOR of
  // that element, so a handler on it never sees the key and the arrows went dead until the user clicked
  // back into the search box. An open panel answers its keys wherever focus sits.
  if (e.type === 'keydown' && ['ArrowDown', 'ArrowUp', 'Enter', 'Tab'].includes(key.key)) {
    onKeydown(key);

    return;
  }

  if (e.type === 'keydown' && key.key.length === 1 && !key.metaKey && !key.ctrlKey && !key.altKey &&
    document.activeElement !== searchInput.value) {
    searchInput.value?.focus();
  }

  if (key.key !== 'Escape') {
    return;
  }

  if (e.type === 'keyup' && swallowEscapeKeyup) {
    swallowEscapeKeyup = false;
    consume();

    return;
  }

  if (e.type === 'keydown' && props.search) {
    swallowEscapeKeyup = true;
    consume();
    clearSearch();
  }
};

const listenForKeys = (on: boolean) => {
  const fn = on ? window.addEventListener : window.removeEventListener;

  // A close can land between a consumed keydown and its keyup (auto-repeat Escape, or focus leaving
  // the window), stranding the flag so it swallows the NEXT press's keyup.
  if (!on) {
    swallowEscapeKeyup = false;
  }

  fn('keydown', onKeyCapture, true);
  fn('keyup', onKeyCapture, true);
};

watch(open, (isOpen) => listenForKeys(isOpen));
onBeforeUnmount(() => listenForKeys(false));

let lastFilledCount = -1;

const fillViewport = () => {
  nextTick(() => {
    const el = scroller.value;

    if (!open.value || !el || !props.hasMore || props.loadingMore || noListOnScreen.value || rows.value.length === lastFilledCount) {
      return;
    }

    if (el.scrollHeight <= el.clientHeight) {
      lastFilledCount = rows.value.length;
      emit('load-more');
    }
  });
};

watch(() => [props.search, open.value], () => {
  lastFilledCount = -1;
});

watch(() => [rows.value.length, props.hasMore, props.loadingMore, noListOnScreen.value, open.value], fillViewport);

const onScroll = (e: Event) => {
  if (!props.hasMore || props.loadingMore) {
    return;
  }

  const el = e.target as HTMLElement;

  if (el.scrollHeight - el.scrollTop - el.clientHeight < 80) {
    emit('load-more');
  }
};

const explore = (cluster?: TopLevelMenuCluster | null) => {
  if (!cluster?.ready) {
    return;
  }
  emit('select', cluster);
  setOpen(false);
};

/** The rows' own controls, in the order they are rendered — the same order `navRows` is in. */
const rowControls = (): HTMLElement[] => Array.from(
  scroller.value?.querySelectorAll<HTMLElement>('.cluster-switcher-row .row-main') || []
);

/**
 * Move the cursor AND the focus. The rows are real buttons now, so the cursor is simply where focus is;
 * `nearest` scrolls as little as it can, so it does nothing while the row is already on screen.
 */
const focusRow = (index: number) => {
  activeIndex.value = index;

  nextTick(() => {
    const el = rowControls()[index];

    el?.focus();
    el?.scrollIntoView({ block: 'nearest' });
  });
};

/**
 * The one row Tab can reach. While the cursor is still outside the list nothing is highlighted, but Tab
 * has to land somewhere — so the FIRST row holds the tab stop until the cursor takes it.
 */
const isTabbable = (index: number): boolean => (activeIndex.value === NO_ACTIVE_INDEX ? index === 0 : activeIndex.value === index);

/** A row took focus on its own — by Tab, or by a click. Keep the cursor with it rather than fighting it. */
const onRowFocused = (index: number) => {
  activeIndex.value = index;
  keyboardActive.value = true;
};

/**
 * Keep focus on the pin the user just pressed. Unlike the nav shelf — which lists ONLY pinned clusters, so
 * unpinning destroys the row and focus has to be handed on — this list holds every cluster whatever its
 * pinned state, so the row and its pin are still there. Moving focus here would take it off the control
 * the user is operating, and make unpin behave differently from pin.
 */
const onRowUnpinned = (index: number) => {
  nextTick(() => {
    // The row survived: the pin keeps focus and its own `aria-pressed` reports the change.
    if (rowControls()[index]) {
      return;
    }

    searchInput.value?.focus();
  });
};

// What Tab can land on inside the popover: the search box, and the cursor row's two controls — the row
// itself and its pin. Everything else is `tabindex="-1"`, so Tab walks the row a user is actually on and
// cannot wander the whole estate, while the pin stays reachable without knowing its shortcut.
// Every clause excludes `tabindex="-1"`: a `<button>` still matches `button:not([disabled])` after it has
// been taken out of the tab order, so without this Tab walked every row in the estate instead of the two
// controls on the row the cursor is actually on.
const TABBABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  '[tabindex]',
].map((sel) => `${ sel }:not([tabindex="-1"])`).join(', ');

const trapFocus = (e: KeyboardEvent) => {
  const items = Array.from(flyout.value?.querySelectorAll<HTMLElement>(TABBABLE) || []);

  if (!items.length) {
    return;
  }

  e.preventDefault();

  const last = items.length - 1;
  const current = items.indexOf(document.activeElement as HTMLElement);
  const next = e.shiftKey ? (current <= 0 ? last : current - 1) : (current === -1 || current === last ? 0 : current + 1);

  items[next].focus();
};

/**
 * Keep the caret in the search box when the user mousedowns on the popover's non-interactive chrome (the
 * group captions, the foot, the padding between rows). Without this the browser moves focus to
 * floating-vue's popper ROOT — an ancestor of the element carrying `@keydown` — so ↑/↓, Enter and the pin
 * silently stop working until the user clicks back into the search box. Same trick as the pin's
 * `@mousedown.prevent`, applied once at the container.
 */
const keepSearchFocus = (e: MouseEvent) => {
  if (!(e.target as HTMLElement)?.closest?.(TABBABLE)) {
    e.preventDefault();
  }
};

/**
 * Pin/unpin the row under the keyboard cursor. The pin is reachable with Tab now, so this shortcut is a
 * second route rather than the only one — it pins without leaving the row. `local` is never pinnable.
 */
const togglePin = (cluster?: TopLevelMenuCluster | null) => {
  if (!cluster || cluster.isLocal) {
    return;
  }

  const announcement = t(
    cluster.pinned ? 'nav.switcher.aria.unpinnedCluster' : 'nav.switcher.aria.pinnedCluster',
    { cluster: cluster.label }
  );

  pinAnnouncement.value = announcement;
  setTimeout(() => {
    if (pinAnnouncement.value === announcement) {
      pinAnnouncement.value = '';
    }
  }, PIN_ANNOUNCEMENT_TIMEOUT_MS);

  reportPinWriteFailure(store, t, cluster.pinned ? cluster.unpin() : cluster.pin());
};

const onKeydown = (e: KeyboardEvent) => {
  switch (e.key) {
  case 'ArrowDown':
    e.preventDefault();
    cursorMoved.value = true;
    keyboardActive.value = true;
    focusRow(Math.min(activeIndex.value + 1, navRows.value.length - 1));
    break;
  case 'ArrowUp':
    e.preventDefault();
    cursorMoved.value = true;
    keyboardActive.value = true;

    if (activeIndex.value === NO_ACTIVE_INDEX) {
      // The other way in: from nothing highlighted, Up enters the list at the bottom.
      focusRow(navRows.value.length - 1);
    } else if (activeIndex.value === 0) {
      // Up off the FIRST row goes back to the search box rather than stopping dead — the field is where
      // the panel starts, so it is where Up should end.
      activeIndex.value = NO_ACTIVE_INDEX;
      searchInput.value?.focus();
    } else {
      focusRow(activeIndex.value - 1);
    }
    break;
  case 'Enter': {
    // A focused row is a real button, so the platform already turns Enter into a click on it — handling
    // it here as well would explore the same cluster twice. Anywhere else in the panel, Enter belongs to
    // the cursor.
    if (!(document.activeElement as HTMLElement)?.closest?.('.row-main, .row-pin')) {
      e.preventDefault();
      // Inert while nothing is highlighted: a row the user never moved to is not a choice they made.
      explore(navRows.value[activeIndex.value]);
    }
    break;
  }
  case 'Tab':
    trapFocus(e);
    break;
  case 'Escape':
    e.preventDefault();
    // Only reached with an empty field — a query is cleared by `onEscapeCapture`, which consumes the
    // key before it ever gets here.
    setOpen(false);
    break;
  default:
    break;
  }
};

defineExpose({
  searching,
  rows,
  navRows,
  localTile,
  recentRows,
  showRecent,
  resultsOffset,
  localOffset,
  placeholder,
  activeIndex,
  open,
  setOpen,
  toggle,
  closeAndWait,
  onInput,
  onKeydown,
  onPointerMove,
  onRowFocused,
  onRowUnpinned,
  isTabbable,
  focusRow,
  explore,
});
</script>

<template>
  <v-dropdown
    :shown="open"
    :triggers="[]"
    :auto-hide="true"
    :no-auto-focus="true"
    :dispose-timeout="DISPOSE_TIMEOUT"
    :popper-class="popperClass"
    @apply-show="focusSearchInput"
    @apply-hide="setOpen(false)"
  >
    <!-- Trigger: supplied by the parent via #trigger, so the app-bar's own cluster button IS the trigger
         rather than something this component draws to match it. -->
    <slot
      name="trigger"
      :toggle="toggle"
      :open="open"
      :count="clusterCount"
    />

    <template #popper>
      <div
        ref="flyout"
        class="cluster-switcher-flyout"
        role="dialog"
        :aria-label="t('nav.switcher.ariaLabel')"
        @mousemove="onPointerMove"
        @mousedown="keepSearchFocus"
      >
        <!-- Polite live region: announces result count / empty / loading as the user types, without
             stealing focus. Visually hidden. -->
        <div
          class="sr-only"
          role="status"
          aria-live="polite"
        >
          {{ statusMessage }}
        </div>

        <!-- A plain search box, not a combobox: the rows below are real buttons that take focus, which a
             combobox forbids (its focus has to stay in the field). Typing anywhere in the panel comes
             back here, so the field is still where a search starts from wherever you are. -->
        <div class="switcher-search">
          <input
            ref="searchInput"
            :value="search"
            type="text"
            class="switcher-search-input"
            :placeholder="placeholder"
            :aria-label="t('nav.switcher.aria.search')"
            :aria-keyshortcuts="pinShortcut"
            :aria-controls="listboxId"
            @input="onInput"
          >
        </div>

        <!-- Only the search box is fixed. Everything under it — the tile, RECENTLY USED and the estate —
             scrolls as one region, so a long list is read by scrolling the panel rather than a strip of
             it while headings stay put. -->
        <div
          :id="listboxId"
          ref="scroller"
          class="switcher-scroll"
          :aria-busy="listLoading ? 'true' : 'false'"
          @scroll="onScroll"
        >
          <!-- local — a tile at the head of the list, at rest only: a search takes it down and `local`
               competes in the results like any other cluster. -->
          <ul
            v-if="localTile"
            class="switcher-local"
            :aria-label="t('nav.switcher.managementCluster')"
          >
            <ClusterSwitcherRow
              :id="optionId(localTile)"
              :cluster="localTile"
              :subtitle="t('nav.switcher.managementCluster')"
              :pinnable="false"
              :route-combo="routeCombo"
              :active="activeIndex === 0"
              :tabbable="isTabbable(0)"
              :current="localTile.id === currentClusterId"
              :announce-current="currentAnnouncedAt === 0"
              @select="explore"
              @focus-row="onRowFocused(0)"
              @unpinned="onRowUnpinned(0)"
            />
          </ul>

          <!-- RECENTLY USED — the last few clusters visited, at rest only. Its own ids because the same
               cluster may also be the fixed tile above or a row of the estate below. -->
          <template v-if="showRecent">
            <div
              class="switcher-group-label"
              aria-hidden="true"
            >
              {{ t('nav.switcher.recent') }}
            </div>
            <ClusterSwitcherSkeleton
              v-if="recentLoading"
              :rows="recentSkeletonRows"
            />
            <ul
              v-else
              class="switcher-recent"
              :aria-label="t('nav.switcher.recent')"
            >
              <ClusterSwitcherRow
                v-for="(c, i) in recentRows"
                :id="recentOptionId(c)"
                :key="c.id"
                :cluster="c"
                :active="activeIndex === i + localOffset"
                :tabbable="isTabbable(i + localOffset)"
                :current="c.id === currentClusterId"
                :announce-current="currentAnnouncedAt === i + localOffset"
                :route-combo="routeCombo"
                :pinnable="!c.isLocal"
                @select="explore"
                @focus-row="onRowFocused(i + localOffset)"
                @unpinned="onRowUnpinned(i + localOffset)"
              />
            </ul>
          </template>

          <!-- Group caption — ALL CLUSTERS at rest, MATCHES while searching. It heads the list it counts,
               directly above it. -->
          <div
            class="switcher-group-label"
            aria-hidden="true"
          >
            <template v-if="searching">
              {{ t('nav.switcher.matches') }}
              <!-- While a search is in flight the count still describes the PREVIOUS query, so show a dash
                   rather than assert a total the list below is no longer showing — the pill itself always
                   renders, so the caption never flickers between having a count and not. -->
              <span class="switcher-group-count">{{ listLoading ? '—' : searchCount }}</span>
            </template>
            <template v-else>
              {{ t('nav.switcher.allClusters') }}
              <span class="switcher-group-count">{{ clusterCount }}</span>
            </template>
          </div>

          <!-- Page 1 in flight — a search's debounce + request, or the estate being (re)read. The
                 skeleton deliberately replaces whatever is on screen: those rows are about to be thrown
                 away, and a list about to be replaced should not sit there looking like the answer. -->
          <ClusterSwitcherSkeleton
            v-if="showingSkeleton"
            :rows="skeletonRows"
          />
          <!-- Page 1 failed. Said plainly, because the alternative — the skeleton, forever — reads as a
               slow request that is still coming, and the caption above goes on asserting a total for a
               list that is not there. -->
          <div
            v-else-if="listFailed"
            class="switcher-empty"
            aria-hidden="true"
          >
            {{ t('nav.switcher.loadError') }}
          </div>
          <!-- One list, whichever it is: the estate at rest, the matches while searching. `rows` is
                 already whichever of the two applies, so there is nothing to branch on here. -->
          <ul
            v-else-if="rows.length"
            class="switcher-group"
            :aria-label="t(searching ? 'nav.switcher.matches' : 'nav.switcher.allClusters')"
          >
            <ClusterSwitcherRow
              v-for="(c, i) in rows"
              :id="optionId(c)"
              :key="c.id"
              :cluster="c"
              :active="activeIndex === i + resultsOffset"
              :tabbable="isTabbable(i + resultsOffset)"
              :current="c.id === currentClusterId"
              :announce-current="currentAnnouncedAt === i + resultsOffset"
              :route-combo="routeCombo"
              :pinnable="!c.isLocal"
              @select="explore"
              @focus-row="onRowFocused(i + resultsOffset)"
              @unpinned="onRowUnpinned(i + resultsOffset)"
            />
          </ul>
          <!-- Empty for one of two reasons now that the skeleton means IN FLIGHT and nothing else: a
                 search that matched nothing, or an estate that genuinely came back with no clusters. They
                 are not the same sentence. -->
          <div
            v-else
            class="switcher-empty"
            aria-hidden="true"
          >
            {{ searching ? t('nav.switcher.noMatch') : t('nav.switcher.noClusters') }}
          </div>

          <!-- Infinite-scroll loading skeleton — shimmer placeholder rows while the next page loads. -->
          <ClusterSwitcherSkeleton
            v-if="loadingMore"
            :rows="2"
          />
        </div>
      </div>
    </template>
  </v-dropdown>

  <!-- Page scrim while the flyout is open; click to close. Teleported to <body> so it sits above the app
       but below the fixed-positioned flyout popper. -->
  <Teleport to="body">
    <div
      v-if="open"
      class="cluster-switcher-overlay"
      :class="{ 'nav-expanded': navExpanded }"
      @click="setOpen(false)"
    />
  </Teleport>
</template>

<style lang="scss" scoped>
.cluster-switcher-flyout {
  display: flex;
  flex-direction: column;
  width: 380px;
  // Height is capped in the unscoped popper block below, where the matching `top` offset lives — the two
  // have to move together for the bottom gutter to hold.
  background: var(--topmenu-bg);
  color: var(--body-text);
  border: 1px solid var(--border);
  border-radius: var(--border-radius-md);
  // Same shadow floating-vue's dropdown theme would have drawn, moved here so it scales with the panel.
  box-shadow: 0 6px 30px rgba(0, 0, 0, 0.1);
  overflow: hidden;

  .switcher-search {
    flex: 0 0 auto;
    display: flex;
    align-items: center;
    padding: 16px 16px 12px;

    .switcher-search-input {
      flex: 1;
      height: 32px;
      padding: 0 12px;
      border: 1px solid var(--border);
      border-radius: var(--border-radius);
      background: var(--input-bg);
      color: var(--input-text);

      // The ring needs `!important` to land at all: the app's rule for text inputs
      // (`input[type="text"]:focus:not(…):not(…):not(…)`) sets `outline: none` at a specificity nothing
      // reachable from in here can beat, which is what the shared mixin's own note about `!important` is
      // for — the mixin itself no longer carries one. The border is left to that rule as well: its focused
      // tint is the one every other input in the product wears, and this box should not be the exception.
      &:focus-visible {
        outline: 2px solid var(--primary-keyboard-focus) !important;
        outline-offset: -1px;
      }
    }
  }

  // These are real `<ul>`s now, so the browser's own list indent and bullets have to go.
  .switcher-local,
  .switcher-recent,
  .switcher-group {
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .switcher-recent {
    .cluster-switcher-row:last-child {
      border-bottom: none;
    }
  }

  .switcher-local {
    .cluster-switcher-row {
      border-bottom: none;
    }
  }

  .switcher-group .cluster-switcher-row:last-child {
    border-bottom: none;
  }

  .switcher-scroll {
    flex: 1 1 auto;
    min-height: 0;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;

    &::after {
      content: "";
      position: sticky;
      bottom: 0;
      display: block;
      height: 8px;
      margin-top: -8px;
      pointer-events: none;
      background: linear-gradient(180deg, transparent 0%, color-mix(in srgb, var(--body-text) 8%, transparent) 100%);
      // Hidden by default; only the scroll-driven animation reveals it. On a non-scrollable list the
      // timeline is inactive and this base value wins — no stray shadow on a short list.
      opacity: 0;
      // Scroll position drives the fade. Where scroll-driven animations aren't supported (e.g. Safari) the
      // timeline is ignored and base opacity:0 wins — the shadow just never shows (no breakage).
      animation: switcher-scroll-shadow linear both;
      animation-timeline: scroll(nearest block);
    }
  }

  @keyframes switcher-scroll-shadow {
    0%, 88% {
      opacity: 1;
    }
    100% {
      opacity: 0;
    }
  }

  .switcher-group-label {
    display: flex;
    align-items: center;
    height: 32px;
    gap: 6px;
    margin-top: 8px;
    padding: 0 16px;
    line-height: 1;
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    color: var(--muted);

    .switcher-group-count {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 22px;
      height: 20px;
      padding: 0 8px;
      border-radius: 999px;
      background: color-mix(in srgb, var(--body-text) 10%, transparent);
      font-size: 11px;
      font-weight: 600;
      line-height: 1;
      letter-spacing: 0;
      text-transform: none;
      color: var(--body-text);
    }
  }

  .switcher-empty {
    padding: 16px 16px 8px;
    text-align: left;
    font-size: 12px;
    color: var(--muted);
  }

}
</style>

<style lang="scss">
$flyout-top: 85px;
$flyout-gutter: 12px;
$flyout-reach: calc(100vh - #{$flyout-top} - #{$flyout-gutter});
// The close is the quicker of the two: opening is an arrival worth watching, closing is an acknowledgement.
// `dispose-timeout` on the dropdown has to out-last it, or floating-vue unmounts the panel mid-roll — its
// 150ms default is exactly what used to cut this short.
$flyout-open-duration: 0.25s;
$flyout-close-duration: 0.2s;

// The popper is teleported to <body>, out of reach of scoped styles, so target it here (namespaced by
// popper-class). `!important` overrides floating-ui's inline transform, which it re-applies on
// scroll/resize. The overlay starts at the nav's right edge so the nav bar isn't dimmed — the nav sits
// in a nested stacking context and can't be lifted above a body-level overlay.
.cluster-switcher-overlay {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: $app-bar-collapsed-width;
  z-index: 100;
  background: var(--overlay-bg);

  &.nav-expanded {
    left: $app-bar-expanded-width;
  }
}

.cluster-switcher-popper.v-popper__popper {
  position: fixed !important;
  left: calc(#{$app-bar-collapsed-width} + 16px) !important;
  top: $flyout-top !important;
  transform: none !important;
  z-index: 102 !important;

  // These two wrappers only POSITION the flyout — the visible panel (border, corners, background) is
  // the flyout itself. That is what lets the roll-out below scale the whole thing: animating the
  // innermost element while the frame around it sat at full size grew the contents inside a box that
  // had already arrived, which read as wrong. The popper can't be the animated element itself, since
  // it is pinned with `transform: none !important` above to stop floating-ui re-applying its
  // positioning transform.
  border: none;
  background: transparent;

  .v-popper__inner {
    background: transparent;
    border-radius: 0;
    // floating-vue's dropdown theme drops its shadow here. Left on, it hangs at full size behind the
    // scaling panel — a rectangle of shadow that never moves. It belongs on the flyout with the rest
    // of the chrome, so it scales too.
    box-shadow: none;
  }

  .cluster-switcher-flyout {
    --unroll: #{$flyout-reach};
    clip-path: inset(0 calc(100% - var(--unroll)) calc(100% - var(--unroll)) 0);
    animation: cluster-switcher-unroll $flyout-open-duration linear backwards;
    max-height: $flyout-reach;
  }

  // The panel has to stay PAINTED for as long as it is rolling. floating-vue hides it with `visibility`
  // as well as opacity, on a transition of its own, and that transition is tied to its own fade — so any
  // close longer than that fade left the wipe animating something nobody could see.
  //
  // It holds full opacity too: a fade running alongside means the wipe does its work half-transparent and
  // reads as a vanish rather than a roll. Nothing is lost by dropping it — the clip has hidden the panel
  // completely by the time the animation ends.
  &.is-closing {
    visibility: visible !important;
    opacity: 1 !important;
    transition: none !important;
  }

  // Closing rolls the same wipe BACKWARDS, so the panel leaves by the corner it arrived from rather than
  // simply ceasing to be there. Keyed on our own `is-closing` — floating-vue sets its `--hidden` and
  // `--hide-to` classes while CREATING the popper too, so hanging this on those ran it on the way in.
  //
  // Its own keyframes rather than the opening ones reversed: an animation whose NAME is unchanged at its
  // index is not restarted, so reusing the opening name left the finished animation sitting there and
  // nothing happened. `forwards` holds the panel shut for the frames between the wipe ending and
  // floating-vue letting go of the element.
  &.is-closing .cluster-switcher-flyout {
    animation: cluster-switcher-reroll $flyout-close-duration linear forwards;
  }
}

@property --unroll {
  syntax: '<length>';
  inherits: false;
  initial-value: 0px;
}

// The closing wipe: the opening one, backwards. Written out under its own name rather than played with
// `animation-direction: reverse`, because an animation whose NAME is unchanged at its index is not
// restarted — reusing the opening name left the finished animation sitting there and nothing happened.
@keyframes cluster-switcher-reroll {
  from {
    --unroll: #{$flyout-reach};
  }
  to {
    --unroll: 0px;
  }
}

@keyframes cluster-switcher-unroll {
  from {
    --unroll: 0px;
  }
  to {
    --unroll: #{$flyout-reach};
  }
}

@media (prefers-reduced-motion: reduce) {
  // Both wipes. The closing one is nested a class deeper than the opening one, so it needs naming here in
  // its own right — matched on specificity, the shorter selector alone left the panel still rolling shut
  // for a reader who asked for less motion.
  .cluster-switcher-popper.v-popper__popper .cluster-switcher-flyout,
  .cluster-switcher-popper.v-popper__popper.is-closing .cluster-switcher-flyout {
    animation: none;
  }

  // With the wipe cancelled there is nothing left to keep painted. The hold-open overrides would only pin
  // the panel fully opaque and motionless for the whole dispose timeout and then blink it away — more
  // jarring than the roll they replace, and slower to dismiss than the reader asked for.
  .cluster-switcher-popper.v-popper__popper.is-closing {
    visibility: hidden !important;
    opacity: 0 !important;
  }
}

.cluster-switcher-popper.nav-expanded.v-popper__popper {
  left: calc(#{$app-bar-expanded-width} + 16px) !important;
}

.cluster-switcher-popper .v-popper__arrow-container {
  display: none;
}

// Drop floating-vue's default 10px inner padding — the flyout manages its own edge-to-edge spacing.
.cluster-switcher-popper .v-popper__inner {
  padding: 0;
}
</style>
