<script setup lang="ts">
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
import { SWITCHER_POPPER_CLASS } from '@shell/utils/dom';

/**
 * Search-first cluster-switcher popover for the collapsed app-bar. Data (local / all / searchResults /
 * clusterCount) comes from the parent's sideNavService, keeping this component presentational.
 */
type Props = {
  /** The `local` management cluster — a FIXED tile at the top, never in the groups (or null). */
  local?: TopLevelMenuCluster | null;
  /** The complete browsable estate (helper railAll) — local excluded, shown under ALL CLUSTERS. */
  all?: TopLevelMenuCluster[];
  /** The last few clusters visited, already capped by the parent. Shown above ALL CLUSTERS and NOT
   * de-duplicated against it or against `local` — it is a shortcut to where the user just was. */
  recent?: TopLevelMenuCluster[];
  /** RECENTLY USED is being fetched (it is read on open, not kept live). Shows the same skeleton the list
   * does, so the section does not pop in beside a shimmering one. */
  recentLoading?: boolean;
  /** Flat match list while searching — the shared, filtered ALL-list results (helper.clustersOthers). */
  searchResults?: TopLevelMenuCluster[];
  /** Estate size — the ALL CLUSTERS count, and the total a screen reader is told. */
  clusterCount?: number;
  /** Total clusters matching the search (from the page-1 response), so MATCHES shows the real total, not
   * just the loaded page. */
  searchCount?: number;
  /** Page 1 of the list is in flight — a search, or the whole directory on open / on clearing the box.
   * Drives the skeleton, so a list about to be replaced is never left sitting there looking current. */
  listLoading?: boolean;
  /** Id of the cluster currently being explored (marked `current`). */
  currentClusterId?: string;
  /** Current search term (v-model:search). */
  search?: string;
  /** Infinite scroll: whether more rows can be loaded for the currently-shown list. */
  hasMore?: boolean;
  /** Infinite scroll: a load-more fetch is in flight (drives the skeleton shimmer). */
  loadingMore?: boolean;
  /** Option/Alt is held on a cluster-explorer route — every row shows the "keep this view" combo arrow. */
  routeCombo?: boolean;
  /** The nav is expanded (300px) rather than the collapsed rail — the flyout and its scrim shift right so
   * they clear the wider nav. */
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

// No row under the keyboard cursor: `aria-activedescendant` is dropped and nothing is highlighted, so
// the search box alone holds the user's attention. Where the cursor starts, and where it returns to
// whenever the flyout opens.
const NO_ACTIVE_INDEX = -1;

const open = ref<boolean>(false);
const activeIndex = ref<number>(NO_ACTIVE_INDEX);
const searchInput = ref<HTMLElement | null>(null);
const scroller = ref<HTMLElement | null>(null);
const flyout = ref<HTMLElement | null>(null);

const searching = computed<boolean>(() => !!props.search);

// The popper is teleported out of this component's scope, so its offset from the nav is carried by a
// class on the popper itself (see the unscoped block at the bottom).
const popperClass = computed(() => [SWITCHER_POPPER_CLASS, props.navExpanded ? 'nav-expanded' : ''].filter((c) => !!c).join(' '));

// The ALL directory (at rest `local` is the fixed tile above, so it is not listed here as well).
const directory = computed<TopLevelMenuCluster[]>(() => props.all.filter((c) => !c.isLocal));

// The flat list the ↑↓ cursor and Enter operate over: matches while searching, else the ALL directory.
// While a search is in flight the list on screen is the skeleton, not `searchResults` (those still
// describe the PREVIOUS query). Return nothing so the ↑↓ cursor, Enter and `aria-activedescendant`
// can never target a row that is not rendered.
const rows = computed<TopLevelMenuCluster[]>(() => {
  if (!searching.value) {
    return directory.value;
  }

  // `local` is NOT filtered out here: a search hides its fixed tile, and it then has to earn its place
  // in the results like any other cluster — typing "local" has to be able to find it.
  return props.listLoading ? [] : props.searchResults;
});

// Page 1 replaces the list wholesale, so while it is in flight the skeleton stands in for the rows — and
// an estate that has not paged in yet is the same state under a different trigger. Named once because the
// template and `fillViewport` both need it: what is on screen then is three placeholder rows, which is
// not the list, and must not be measured as if it were.
const showingSkeleton = computed<boolean>(() => props.listLoading || (!searching.value && !rows.value.length));

// The fixed `local` tile belongs to the resting state only — a search takes it down, and `local` then
// competes for a place in the results like anything else. Resolved to the cluster (or null) rather than a
// flag so the template narrows `local` off it: everything below reads this one value.
const localTile = computed<TopLevelMenuCluster | null>(() => (props.local && !searching.value ? props.local : null));

// RECENTLY USED sits between the tile and the estate, and goes down with the tile while searching: the
// results ARE the answer to the query, and a shortcut list beside them is just noise to scroll past.
const recentRows = computed<TopLevelMenuCluster[]>(() => (searching.value || props.recentLoading ? [] : props.recent));

// On screen while it is being fetched too, with the skeleton standing in for its rows, so the panel does
// not reflow as they land.
const showRecent = computed<boolean>(() => !searching.value && (props.recentLoading || !!recentRows.value.length));

// The combobox owns all three sections for the keyboard: nav runs the fixed tile, then RECENTLY USED,
// then the list, while each section renders only its own rows — `resultsOffset` keeps the listbox's
// indices in lock-step with the flat model.
const localOffset = computed<number>(() => (localTile.value ? 1 : 0));
const resultsOffset = computed<number>(() => localOffset.value + recentRows.value.length);
const navRows = computed<TopLevelMenuCluster[]>(() => [
  ...(localTile.value ? [localTile.value] : []),
  ...recentRows.value,
  ...rows.value,
]);

// Where the cursor sits when the user has not driven it: on a search, the first match, so Enter opens the
// best answer to what was typed. At rest, nowhere — an open flyout highlights nothing, and the first ↓
// picks the top row. A highlight nobody asked for reads as a selection, and Enter would act on it.
const restingIndex = () => (searching.value && navRows.value.length ? 0 : NO_ACTIVE_INDEX);

// The pin shortcut, in the form `aria-keyshortcuts` is defined to take.
const pinShortcut = isMac ? 'Meta+Shift+P' : 'Alt+P';

// One fixed placeholder — the flyout is the only place a search lives, and it always searches the whole
// estate.
const placeholder = computed(() => t('nav.switcher.jumpTo'));

// Accessibility: the search input is a combobox owning the results listbox; each row is an `option` the
// input points at via aria-activedescendant, so a screen reader announces the highlighted cluster without
// moving DOM focus off the input.
const listboxId = 'cluster-switcher-listbox';
const optionId = (c: TopLevelMenuCluster) => `cluster-switcher-opt-${ c.id }`;
// RECENTLY USED repeats clusters that are also the fixed tile or rows of the estate, so its options carry
// their own ids — two elements answering to one id would make `aria-activedescendant` ambiguous and give
// Vue duplicate keys.
const recentOptionId = (c: TopLevelMenuCluster) => `cluster-switcher-opt-recent-${ c.id }`;

// The id of the option at a position in the flat nav model, which is what the cursor moves over.
const optionIdAt = (index: number): string | undefined => {
  const c = navRows.value[index];

  if (!c) {
    return undefined;
  }

  const inRecent = index >= localOffset.value && index < resultsOffset.value;

  return inRecent ? recentOptionId(c) : optionId(c);
};

// The reverse — option id back to its position — built once per list rather than per pointer move, which
// fires at screen rate.
const indexByOptionId = computed<Record<string, number>>(() => navRows.value.reduce((acc, _c, i) => {
  const id = optionIdAt(i);

  if (id) {
    acc[id] = i;
  }

  return acc;
}, {} as Record<string, number>));

const activeDescendant = computed(() => optionIdAt(activeIndex.value));
// A pin toggle has nothing else to announce it — the pin control is `aria-hidden` inside the option and
// the pin shortcut is the only keyboard route to it — so route a one-line confirmation through this live
// region. Cleared whenever the result set is re-announced (search change / reopen).
const pinAnnouncement = ref<string>('');

const statusMessage = computed(() => {
  if (pinAnnouncement.value) {
    return pinAnnouncement.value;
  }
  // Only a SEARCH announces itself as searching; a resting refresh keeps the count it already reported.
  if (props.listLoading && searching.value) {
    return t('nav.switcher.aria.searching');
  }
  if (searching.value && !rows.value.length) {
    return t('nav.switcher.aria.noResults');
  }
  const count = searching.value ? (props.searchCount || rows.value.length) : (props.clusterCount || directory.value.length);

  return t('nav.switcher.aria.results', { count });
});

/**
 * The pointer owns the cursor as much as ↑/↓ do: the row under the mouse becomes the highlighted row, so
 * the list shows exactly ONE highlight and arrowing on from a hovered row carries on from where the
 * pointer left it.
 *
 * Driven by `mousemove` rather than `mouseenter`, and delegated at the panel: a move means the pointer
 * really moved, whereas an enter also fires when ↑/↓ scroll a row underneath a stationary mouse — which
 * would drag the cursor back to wherever the mouse happened to be resting.
 */
const onPointerMove = (e: MouseEvent) => {
  const row = (e.target as HTMLElement)?.closest?.('.cluster-switcher-row');

  if (!row) {
    return;
  }

  const index = indexByOptionId.value[row.id] ?? NO_ACTIVE_INDEX;

  if (index >= 0 && index !== activeIndex.value) {
    activeIndex.value = index;
    cursorMoved.value = true;
  }
};

// Whether the user has driven the cursor with ↑/↓ since the last search change or open. While they have,
// only a clamp may move it — the auto-placement below is for a cursor the user hasn't touched.
const cursorMoved = ref<boolean>(false);

// Reset the cursor to the top on SEARCH change only — not on every `rows` change, or a pin toggle or
// load-more would yank the highlight to the top. Open resets via setOpen.
watch(() => props.search, () => {
  activeIndex.value = restingIndex();
  cursorMoved.value = false;
  pinAnnouncement.value = '';
});

// A search's results arrive AFTER the keystroke that asked for them, so the placement above ran against
// an empty list and left the cursor off-list. Put it on the first match as the rows render. Only while
// searching — at rest there is deliberately no cursor — and never once the user has moved it themselves,
// so a later page of results cannot take it off the row they chose.
watch(() => rows.value.length, (len) => {
  if (len && !cursorMoved.value && searching.value) {
    activeIndex.value = restingIndex();
  }
});

// The list can shrink without the search term changing (unpinning a row that only appeared via the
// parent's pinned/recent tail), which would strand the cursor past the end — no aria-activedescendant and
// a dead Enter. Clamp only when it is actually out of range, so a normal pin/load-more never moves it.
watch(() => navRows.value.length, (len) => {
  if (activeIndex.value > len - 1) {
    activeIndex.value = Math.max(0, len - 1);
  }
});

// Where focus was when the flyout opened, so closing can hand it back (the trigger, normally).
const focusOrigin = ref<HTMLElement | null>(null);

const setOpen = (value: boolean) => {
  const wasOpen = open.value;

  open.value = value;
  emit('update:open', value);

  if (value) {
    focusOrigin.value = document.activeElement as HTMLElement | null;
    activeIndex.value = restingIndex();
    cursorMoved.value = false;
    pinAnnouncement.value = '';
    // Focus happens on the dropdown's `apply-show` (focusSearchInput) — here is too early, the teleported
    // input isn't mounted yet.
  } else if (wasOpen) {
    // Hand focus back to whatever opened us, so Esc doesn't strand a keyboard user on <body>. Only while
    // the flyout still owns focus: an outside click has already moved focus to what the user clicked, and
    // stealing it back would fight them.
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
    // floating-vue stamps `role="tooltip"` on the teleported popper root, which then wraps this
    // combobox and its listbox — a tooltip may not own interactive content. Neutralise the wrapper;
    // the combobox/listbox inside carry the real semantics.
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

  // The flyout is registered as a shortcut-silencing container, like a modal, so while it is open the
  // app's `v-shortkey` bindings stand down — including the one that opened it. It therefore has to own
  // its own toggle: Cmd/Ctrl+J closes it from here.
  if (key.code === 'KeyJ' && (key.metaKey || key.ctrlKey) && !key.altKey && !key.shiftKey) {
    consume();

    if (e.type === 'keydown') {
      setOpen(false);
    }

    return;
  }

  // The pin shortcut acts on the row under the cursor, wherever focus happens to sit inside the panel.
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

  // A character typed at the panel belongs in its search box, wherever focus drifted to. Focusing during
  // the keydown is early enough for the character itself to land in the input.
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

// A list too short to scroll never fires @scroll, so top up until the rows fill the viewport.
// `lastFilledCount` guards the case where a top-up brings nothing new (RBAC-filtered rows, a moving
// count), which would otherwise re-request forever.
let lastFilledCount = -1;

const fillViewport = () => {
  nextTick(() => {
    const el = scroller.value;

    // The skeleton is shorter than any real page, so measuring it always reads as "not filled" and tops
    // up a list that is about to be replaced anyway — page 1 lands, this watcher fires, and the rows are
    // in `props` a tick before they are on screen. Wait for them: the watcher re-runs when it clears.
    if (!open.value || !el || !props.hasMore || props.loadingMore || showingSkeleton.value || rows.value.length === lastFilledCount) {
      return;
    }

    if (el.scrollHeight <= el.clientHeight) {
      lastFilledCount = rows.value.length;
      emit('load-more');
    }
  });
};

// A new search term or a reopen rebuilds the list from page 1, so the same row count can legitimately need
// topping up again — forget the mark. Declared first so it runs before the watcher below in the same flush.
watch(() => [props.search, open.value], () => {
  lastFilledCount = -1;
});

watch(() => [rows.value.length, props.hasMore, props.loadingMore, showingSkeleton.value, open.value], fillViewport);

// Infinite scroll — ask the parent for the next window as the list nears the bottom.
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

/**
 * Keep the keyboard cursor visible: the listbox scrolls (and pages in) independently, so moving the
 * cursor has to bring its option back into view or the user loses track of it entirely. `nearest`
 * scrolls as little as it can, so it does nothing while the option is already on screen.
 */
const revealActive = () => {
  // After the render that moved the highlight, so the option to scroll to exists.
  nextTick(() => {
    const id = optionIdAt(activeIndex.value);

    if (id) {
      document.getElementById(id)?.scrollIntoView({ block: 'nearest' });
    }
  });
};

// What Tab can land on inside the popover. The rows are `option`s the combobox drives via
// aria-activedescendant, so in practice this is the search box alone — which is the point: Tab has
// nowhere to go, so it cannot walk out from behind the scrim.
const TABBABLE = 'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Keep Tab inside the popover. The flyout is a modal surface — it puts up a full-page scrim — so letting
 * Tab walk out leaves a keyboard user driving content that is behind, and click-blocked by, that scrim.
 * `setOpen` already handles the return trip (focus restore) and Esc; this is the containment half.
 */
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
 * Pin/unpin the row under the keyboard cursor. The pin itself has to stay OUT of the tab order (a
 * focusable control inside `role="option"` is invalid ARIA), so the combobox owns the keyboard path
 * (Cmd+Shift+P / Alt+P) — without it the flyout, the only surface where a cluster outside PINNED/RECENT
 * can be pinned, is mouse-only. `local` is never pinnable.
 */
const togglePin = (cluster?: TopLevelMenuCluster | null) => {
  if (!cluster || cluster.isLocal) {
    return;
  }

  // Read BEFORE the toggle: `cluster.pinned` is still the old state here, so this names the new one.
  const announcement = t(
    cluster.pinned ? 'nav.switcher.aria.unpinnedCluster' : 'nav.switcher.aria.pinnedCluster',
    { cluster: cluster.label }
  );

  pinAnnouncement.value = announcement;
  // Transient: hand the live region back to the result count once this has been read, or every later
  // announcement on the same query is swallowed (it otherwise only clears on a search change / reopen).
  // Guarded on identity so a newer pin's message is never cleared by an older pin's timer.
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
    activeIndex.value = Math.min(activeIndex.value + 1, navRows.value.length - 1);
    revealActive();
    break;
  case 'ArrowUp':
    e.preventDefault();
    cursorMoved.value = true;
    // From nothing highlighted, ↑ enters the list at the bottom — ↓ enters it at the top.
    activeIndex.value = activeIndex.value === NO_ACTIVE_INDEX ? navRows.value.length - 1 : Math.max(activeIndex.value - 1, 0);
    revealActive();
    break;
  case 'Enter': {
    e.preventDefault();
    explore(navRows.value[activeIndex.value]);
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

// `toggle` and `closeAndWait` are the parent's API (TopLevelMenu drives both via `$refs.switcher`); the
// rest are exposed for the unit tests, which drive these internals directly. Nothing is listed here that
// no one outside the component reads.
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
  explore,
});
</script>

<template>
  <v-dropdown
    :shown="open"
    :triggers="[]"
    :auto-hide="true"
    :no-auto-focus="true"
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
        role="none"
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

        <!-- Search — a combobox that owns the results listbox below, and the first thing in the panel. -->
        <div class="switcher-search">
          <input
            ref="searchInput"
            :value="search"
            type="text"
            role="combobox"
            class="switcher-search-input"
            :placeholder="placeholder"
            :aria-label="t('nav.switcher.aria.search')"
            :aria-expanded="open ? 'true' : 'false'"
            aria-haspopup="listbox"
            aria-autocomplete="list"
            :aria-keyshortcuts="pinShortcut"
            :aria-controls="listboxId"
            :aria-activedescendant="activeDescendant"
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
          role="listbox"
          :aria-busy="listLoading ? 'true' : 'false'"
          :aria-label="t('nav.switcher.aria.clusterList')"
          @scroll="onScroll"
        >
          <!-- local — a tile at the head of the list, at rest only: a search takes it down and `local`
               competes in the results like any other cluster. Its own single-option listbox so the option
               is never orphaned outside a listbox. -->
          <div
            v-if="localTile"
            class="switcher-local"
            role="group"
            :aria-label="t('nav.switcher.managementCluster')"
          >
            <ClusterSwitcherRow
              :id="optionId(localTile)"
              :cluster="localTile"
              :subtitle="t('nav.switcher.managementCluster')"
              :pinnable="false"
              :route-combo="routeCombo"
              :active="activeIndex === 0"
              :current="localTile.id === currentClusterId"
              @select="explore"
            />
          </div>

          <!-- RECENTLY USED — the last few clusters visited, at rest only. Its own listbox so its options
               are never orphaned outside one, and its own ids because the same cluster may also be the
               fixed tile above or a row of the estate below. -->
          <template v-if="showRecent">
            <div
              class="switcher-group-label"
              aria-hidden="true"
            >
              {{ t('nav.switcher.recent') }}
            </div>
            <ClusterSwitcherSkeleton
              v-if="recentLoading"
              :rows="2"
            />
            <div
              v-else
              class="switcher-recent"
              role="group"
              :aria-label="t('nav.switcher.recent')"
            >
              <ClusterSwitcherRow
                v-for="(c, i) in recentRows"
                :id="recentOptionId(c)"
                :key="c.id"
                :cluster="c"
                :active="activeIndex === i + localOffset"
                :current="c.id === currentClusterId"
                :route-combo="routeCombo"
                :pinnable="!c.isLocal"
                @select="explore"
              />
            </div>
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
            :rows="3"
          />
          <!-- One list, whichever it is: the estate at rest, the matches while searching. `rows` is
                 already whichever of the two applies, so there is nothing to branch on here. -->
          <div
            v-else-if="rows.length"
            class="switcher-group"
            role="group"
            :aria-label="t(searching ? 'nav.switcher.matches' : 'nav.switcher.allClusters')"
          >
            <ClusterSwitcherRow
              v-for="(c, i) in rows"
              :id="optionId(c)"
              :key="c.id"
              :cluster="c"
              :active="activeIndex === i + resultsOffset"
              :current="c.id === currentClusterId"
              :route-combo="routeCombo"
              :pinnable="!c.isLocal"
              @select="explore"
            />
          </div>
          <!-- Only a search can legitimately come back empty: an empty estate means page 1 has not
                 landed yet, which the skeleton above covers. -->
          <div
            v-else
            class="switcher-empty"
            aria-hidden="true"
          >
            {{ t('nav.switcher.noMatch') }}
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
  // The panel's own chrome, moved off the popper wrappers so it scales with the roll-out. `overflow`
  // keeps the rows clipped to the rounded corners now that the radius lives here.
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

      &:focus-visible {
        border-color: var(--primary);
        @include focus-outline;
        outline-offset: 1px;
      }
    }
  }

  // RECENTLY USED heads the scrolling region, above ALL CLUSTERS. Its last row drops the divider, the
  // caption below being the separator.
  .switcher-recent {
    .cluster-switcher-row:last-child {
      border-bottom: none;
    }
  }

  // Same box as every scrolling row — ClusterSwitcherRow owns the padding.
  .switcher-local {
    // No hairline under it: the ALL CLUSTERS caption below already separates the tile from the list, and
    // the divider's job is to part one row from the next — this tile has no next.
    .cluster-switcher-row {
      border-bottom: none;
    }
  }

  // The panel's own edge closes the list, so the last row's divider would read as a double line.
  .switcher-group .cluster-switcher-row:last-child {
    border-bottom: none;
  }

  // The one scrolling region: everything below the search box, so the tile and the section headings
  // travel with the rows rather than staying put over them.
  .switcher-scroll {
    flex: 1 1 auto;
    min-height: 0;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;

    // Bottom scroll-edge shadow painting OVER the rows: a sticky pseudo-element (a `background` gradient
    // would sit behind the opaque badge chips). `margin-top` pulls it back so it adds no scroll height;
    // `pointer-events: none` keeps rows clickable. A scroll-driven animation fades it at the bottom.
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

  // Scroll-edge shadow fade (see `.switcher-scroll::after`): 0% = top of scroll, 100% = bottom.
  @keyframes switcher-scroll-shadow {
    0%, 88% {
      opacity: 1;
    }
    100% {
      opacity: 0;
    }
  }

  // Group header (ALL CLUSTERS / MATCHES): a static caption above the search box, matching the expanded
  // nav's section label.
  .switcher-group-label {
    display: flex;
    // A fixed 32px band: the caption and its count pill are centred in it rather than pushed around by
    // line-height, so the text, the pill and the rows below all share one vertical centre line.
    align-items: center;
    height: 32px;
    gap: 6px;
    // Only the 8px above (separating it from the local tile) is spacing — the height owns the rest, so
    // the caption sits tight to the list it heads.
    margin-top: 8px;
    padding: 0 16px;
    line-height: 1;
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    color: var(--muted);

    // Count badge: a neutral pill (Figma rev 2), shared by ALL CLUSTERS + MATCHES.
    .switcher-group-count {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 22px;
      height: 20px;
      padding: 0 7px;
      border-radius: 10px;
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
    padding: 18px 16px 10px;
    text-align: left;
    font-size: 12px;
    color: var(--muted);
  }

}
</style>

<style lang="scss">
// Where the flyout starts, and how much room it leaves at the bottom of the viewport.
$flyout-top: 85px;
$flyout-gutter: 12px;

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
  // Above the scrim (100) and the lifted rail (101).
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

  // Unroll from the top-left corner the flyout hangs off, alongside the shared popper's own .15s
  // opacity fade (see _tooltip.scss). A clip wipe rather than a scale, so nothing is distorted on the
  // way in — the panel is drawn at its final size throughout and simply uncovered.
  .cluster-switcher-flyout {
    // Both edges are driven off ONE distance, so they advance at exactly the same pixels-per-ms and the
    // short side lands first by construction — no ratio to tune, and it holds for any panel height.
    // The resting value has to out-reach the panel: once the animation is over the property falls back to
    // what is declared here, and anything smaller leaves the clip permanently cutting the bottom off.
    // `100vh` is the bound — the panel is capped at the viewport height minus its insets — so this holds
    // on a tall screen, where a fixed pixel figure quietly truncated the list.
    --unroll: 100vh;
    clip-path: inset(0 calc(100% - var(--unroll)) calc(100% - var(--unroll)) 0);
    // `backwards` pins the first keyframe from the moment the element exists, so the panel can never be
    // caught at its resting size in the frames before the animation takes hold.
    animation: cluster-switcher-unroll 0.25s linear backwards;
  }

  .cluster-switcher-flyout {
    max-height: calc(100vh - #{$flyout-top} - #{$flyout-gutter});
  }
}

// The unroll distance, as a real length so it interpolates — an unregistered custom property would
// animate discretely and the panel would jump open instead.
@property --unroll {
  syntax: '<length>';
  inherits: false;
  initial-value: 0px;
}

// One distance, both edges: the clip travels the same number of pixels right and down each frame, so
// the panel shoots out to its full 380px width, is momentarily square, then carries on unrolling to the
// bottom. `linear` is what holds the two rates equal — easing would bend them apart. The end value has to
// out-reach the tallest the flyout can get, which is bounded by the viewport; past the panel's own size
// the clip is simply off the element.
@keyframes cluster-switcher-unroll {
  from {
    --unroll: 0px;
  }
  to {
    --unroll: 100vh;
  }
}

// Motion is decoration here — the flyout is just as usable arriving instantly.
@media (prefers-reduced-motion: reduce) {
  .cluster-switcher-popper.v-popper__popper .cluster-switcher-flyout {
    animation: none;
  }
}

// Expanded nav: the same 16px gap, measured from the wider nav's edge.
.cluster-switcher-popper.nav-expanded.v-popper__popper {
  left: calc(#{$app-bar-expanded-width} + 16px) !important;
}

// No connector arrow (the flyout floats free of the rail).
.cluster-switcher-popper .v-popper__arrow-container {
  display: none;
}

// Drop floating-vue's default 10px inner padding — the flyout manages its own edge-to-edge spacing.
.cluster-switcher-popper .v-popper__inner {
  padding: 0;
}
</style>
