<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue';
import { useStore } from 'vuex';
import { useI18n } from '@shell/composables/useI18n';
import ClusterSwitcherRow from '@shell/components/nav/ClusterSwitcherRow.vue';
import type { TopLevelMenuCluster } from '@shell/components/nav/TopLevelMenu.helper';
import { SEARCH_ECHO_MAX } from '@shell/store/prefs';

/**
 * Search-first cluster-switcher popover for the collapsed app-bar. Data (local / all / searchResults /
 * clusterCount) comes from the parent's sideNavService, keeping this component presentational.
 */
type Props = {
  /** The `local` management cluster — a FIXED tile at the top, never in the groups (or null). */
  local?: TopLevelMenuCluster | null;
  /** The complete browsable estate (helper railAll) — local excluded, shown under ALL CLUSTERS. */
  all?: TopLevelMenuCluster[];
  /** Flat match list while searching — the shared, filtered ALL-list results (helper.clustersOthers). */
  searchResults?: TopLevelMenuCluster[];
  /** Estate size — shown in the ALL CLUSTERS count and the search placeholder. */
  clusterCount?: number;
  /** Total clusters matching the search (from the page-1 response), so MATCHES shows the real total, not
   * just the loaded page. */
  searchCount?: number;
  /** A search request is in flight — drives the initial search skeleton. */
  searchLoading?: boolean;
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
  searchResults:    () => [],
  clusterCount:     0,
  searchCount:      0,
  searchLoading:    false,
  currentClusterId: '',
  search:           '',
  hasMore:          false,
  loadingMore:      false,
  routeCombo:       false,
  navExpanded:      false,
});

const emit = defineEmits(['update:search', 'select', 'update:open', 'load-more']);

const store = useStore();
const { t } = useI18n(store);

const open = ref<boolean>(false);
const activeIndex = ref<number>(0);
const searchInput = ref<HTMLElement | null>(null);
const scroller = ref<HTMLElement | null>(null);
const flyout = ref<HTMLElement | null>(null);

const searching = computed<boolean>(() => !!props.search);

// The popper is teleported out of this component's scope, so its offset from the nav is carried by a
// class on the popper itself (see the unscoped block at the bottom).
const popperClass = computed(() => [
  'cluster-switcher-popper',
  props.navExpanded ? 'nav-expanded' : '',
  // Without the fixed `local` tile the flyout is two rows shorter at the top, so it starts lower to keep
  // its search box on the same line as the trigger button that opened it.
  props.local ? '' : 'no-local',
].filter((c) => !!c).join(' '));

// The ALL directory (local is a separate fixed tile, never listed here).
const directory = computed<TopLevelMenuCluster[]>(() => props.all.filter((c) => !c.isLocal));

// The flat list the ↑↓ cursor and Enter operate over: matches while searching, else the ALL directory.
const rows = computed<TopLevelMenuCluster[]>(() => (searching.value ? props.searchResults.filter((c) => !c.isLocal) : directory.value));

// `local` is a fixed tile above the search door, but the combobox must own it for the keyboard — so nav
// puts it at index 0 while the listbox renders only `rows`, offset by `localOffset` to stay in lock-step.
// `activeIndex` is the KEYBOARD cursor only — the pointer gets its own CSS `:hover` on the row, so moving
// the mouse never moves what Enter would open (and never strands a highlight behind the pointer).
const localOffset = computed<number>(() => (props.local ? 1 : 0));
const navRows = computed<TopLevelMenuCluster[]>(() => (props.local ? [props.local, ...rows.value] : rows.value));

// Land the cursor on the first result row, not the fixed `local` tile, so Enter opens a searched cluster;
// `local` is one ArrowUp away. Clamp for a local-only list.
const firstResultIndex = () => Math.min(localOffset.value, Math.max(0, navRows.value.length - 1));

// Estate clusters not currently shown — drives the "… N more" foot. Only meaningful in the resting list.
const moreCount = computed(() => (searching.value ? 0 : Math.max(0, props.clusterCount - directory.value.length)));

// One fixed placeholder — the flyout is the only place a search lives, and it always searches the whole
// estate.
const placeholder = computed(() => t('nav.switcher.searchAllClusters'));

// The "no clusters match" line echoes the query back; cap a very long query with an ellipsis so it can't
// overflow the popover.
const truncatedSearch = computed(() => {
  const s = props.search || '';

  return s.length > SEARCH_ECHO_MAX ? `${ s.slice(0, SEARCH_ECHO_MAX) }…` : s;
});

// Accessibility: the search input is a combobox owning the results listbox; each row is an `option` the
// input points at via aria-activedescendant, so a screen reader announces the highlighted cluster without
// moving DOM focus off the input.
const listboxId = 'cluster-switcher-listbox';
// `local` sits in its own single-option listbox above the door; the combobox references both via
// aria-controls so it owns the local option too.
const localListboxId = 'cluster-switcher-local-listbox';
const optionId = (c: TopLevelMenuCluster) => `cluster-switcher-opt-${ c.id }`;
const activeDescendant = computed(() => {
  const c = navRows.value[activeIndex.value];

  return c ? optionId(c) : undefined;
});
const statusMessage = computed(() => {
  if (props.searchLoading && !rows.value.length) {
    return t('nav.switcher.aria.searching');
  }
  if (searching.value && !rows.value.length) {
    return t('nav.switcher.aria.noResults');
  }
  const count = searching.value ? (props.searchCount || rows.value.length) : (props.clusterCount || directory.value.length);

  return t('nav.switcher.aria.results', { count });
});

// Reset the cursor to the top on SEARCH change only — not on every `rows` change, or a pin toggle or
// load-more would yank the highlight to the top. Open resets via setOpen.
watch(() => props.search, () => {
  activeIndex.value = firstResultIndex();
});

// Where focus was when the flyout opened, so closing can hand it back (the trigger, normally).
const focusOrigin = ref<HTMLElement | null>(null);

const setOpen = (value: boolean) => {
  const wasOpen = open.value;

  open.value = value;
  emit('update:open', value);

  if (value) {
    focusOrigin.value = document.activeElement as HTMLElement | null;
    activeIndex.value = firstResultIndex();
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
    const deadline = Date.now() + 400;
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
      setTimeout(() => tryFocus(attempts - 1), 30);
    }
  };

  nextTick(() => tryFocus(6));
};

const onInput = (e: Event) => {
  emit('update:search', (e.target as HTMLInputElement).value);
};

// Clear the search (the X), then keep focus in the input.
const clearSearch = () => {
  emit('update:search', '');
  searchInput.value?.focus();
};

// The flyout now grows to the bottom of the viewport, so one page of rows often doesn't reach the
// bottom — and a list that can't scroll never fires @scroll, leaving the user stranded on page 1. Top up
// whenever the loaded rows come up short of the viewport. The `hasMore`/`loadingMore` guards (and the
// parent flipping `hasMore` off once everything is loaded) end the chain.
const fillViewport = () => {
  nextTick(() => {
    const el = scroller.value;

    if (!open.value || !el || !props.hasMore || props.loadingMore) {
      return;
    }

    if (el.scrollHeight <= el.clientHeight) {
      emit('load-more');
    }
  });
};

watch(() => [rows.value.length, props.hasMore, props.loadingMore, open.value], fillViewport);

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
    const c = navRows.value[activeIndex.value];

    if (c) {
      document.getElementById(optionId(c))?.scrollIntoView({ block: 'nearest' });
    }
  });
};

// What Tab can land on inside the popover. The rows are `option`s the combobox drives via
// aria-activedescendant, so in practice this is the search box and the clear X.
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
 * Pin/unpin the row under the keyboard cursor. The pin itself has to stay OUT of the tab order (a
 * focusable control inside `role="option"` is invalid ARIA), so the combobox owns the keyboard path —
 * without it the flyout, the only surface where a cluster outside PINNED/RECENT can be pinned, is
 * mouse-only. `local` is never pinnable.
 */
const togglePin = (cluster?: TopLevelMenuCluster | null) => {
  if (!cluster || cluster.isLocal) {
    return;
  }

  if (cluster.pinned) {
    cluster.unpin();
  } else {
    cluster.pin();
  }
};

const onKeydown = (e: KeyboardEvent) => {
  // Alt+P toggles the pin on the cursor row. Matched on `code`, not `key`: Option+P emits `π` on a Mac
  // layout, so `e.key` would never see a `p`.
  if (e.altKey && e.code === 'KeyP') {
    e.preventDefault();
    togglePin(navRows.value[activeIndex.value]);

    return;
  }

  switch (e.key) {
  case 'ArrowDown':
    e.preventDefault();
    activeIndex.value = Math.min(activeIndex.value + 1, navRows.value.length - 1);
    revealActive();
    break;
  case 'ArrowUp':
    e.preventDefault();
    activeIndex.value = Math.max(activeIndex.value - 1, 0);
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
    setOpen(false);
    break;
  default:
    break;
  }
};

// Exposed for the unit tests, which drive these internals directly.
defineExpose({
  searching,
  rows,
  navRows,
  placeholder,
  activeIndex,
  open,
  setOpen,
  toggle,
  closeAndWait,
  onInput,
  onKeydown,
  explore,
  togglePin,
});
</script>

<template>
  <v-dropdown
    :shown="open"
    :triggers="[]"
    :auto-hide="true"
    :distance="16"
    :arrow-padding="0"
    :no-auto-focus="true"
    placement="right-start"
    :popper-class="popperClass"
    @apply-show="focusSearchInput"
    @apply-hide="setOpen(false)"
  >
    <!-- Trigger: the parent supplies it via #trigger to reuse the app-bar's own cluster-button structure;
         the bare-count button is only a fallback for standalone use. -->
    <slot
      name="trigger"
      :toggle="toggle"
      :open="open"
      :count="clusterCount"
    >
      <button
        type="button"
        class="cluster-count-trigger"
        :aria-label="t('nav.switcher.ariaLabel')"
        :aria-expanded="open"
        aria-haspopup="listbox"
        @click="toggle"
      >
        <span class="count">{{ clusterCount }}</span>
        <i class="icon icon-chevron-right" />
      </button>
    </slot>

    <template #popper>
      <div
        ref="flyout"
        class="cluster-switcher-flyout"
        role="none"
        @keydown="onKeydown"
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

        <!-- local — fixed tile above the search door, shown even while searching. Its own single-option
             listbox so the option is never orphaned outside a listbox. -->
        <div
          v-if="local"
          :id="localListboxId"
          class="switcher-local"
          role="listbox"
          :aria-label="t('nav.switcher.managementCluster')"
        >
          <ClusterSwitcherRow
            :id="optionId(local)"
            :cluster="local"
            :subtitle="t('nav.switcher.managementCluster')"
            :pinnable="false"
            :route-combo="routeCombo"
            :active="activeIndex === 0"
            :current="local.id === currentClusterId"
            @select="explore"
          />
        </div>

        <!-- Group caption — ALL CLUSTERS at rest, MATCHES while searching. It sits ABOVE the search box
             so the list's identity reads before the box that filters it. -->
        <div
          class="switcher-group-label"
          aria-hidden="true"
        >
          <template v-if="searching">
            {{ t('nav.switcher.matches') }}
            <span class="switcher-group-count">{{ searchCount }}</span>
          </template>
          <template v-else>
            {{ t('nav.switcher.allClusters') }}
            <span class="switcher-group-count">{{ clusterCount }}</span>
          </template>
        </div>

        <!-- Search "door" — a combobox that owns the results listbox below. -->
        <div class="switcher-search">
          <input
            ref="searchInput"
            :value="search"
            type="text"
            role="combobox"
            class="switcher-search-input"
            :placeholder="placeholder"
            :aria-label="t('nav.switcher.searchAllClusters')"
            :aria-expanded="open ? 'true' : 'false'"
            aria-haspopup="listbox"
            aria-autocomplete="list"
            aria-keyshortcuts="Alt+P"
            :aria-controls="local ? `${ localListboxId } ${ listboxId }` : listboxId"
            :aria-activedescendant="activeDescendant"
            @input="onInput"
          >
          <i
            class="magnifier icon icon-search"
            :class="{ active: search }"
            aria-hidden="true"
          />
          <button
            v-if="search"
            type="button"
            class="icon icon-close switcher-clear"
            :aria-label="t('nav.search.clear')"
            @mousedown.prevent
            @click="clearSearch"
          />
        </div>

        <div
          :id="listboxId"
          ref="scroller"
          class="switcher-scroll"
          role="listbox"
          :aria-label="t('nav.switcher.aria.clusterList')"
          @scroll="onScroll"
        >
          <!-- Searching: a single flat match list over the whole estate -->
          <template v-if="searching">
            <!-- Skeleton while the search request is in flight (and there's nothing to show yet). -->
            <div
              v-if="searchLoading && !rows.length"
              class="switcher-loading"
              aria-hidden="true"
            >
              <div
                v-for="n in 3"
                :key="n"
                class="skeleton-row"
              >
                <div class="skeleton-badge shimmer" />
                <div class="skeleton-lines">
                  <div class="skeleton-line shimmer" />
                  <div class="skeleton-line short shimmer" />
                </div>
              </div>
            </div>
            <div
              v-else-if="rows.length"
              class="switcher-group"
              role="group"
              :aria-label="t('nav.switcher.matches')"
            >
              <ClusterSwitcherRow
                v-for="(c, i) in rows"
                :id="optionId(c)"
                :key="c.id"
                :cluster="c"
                :active="activeIndex === i + localOffset"
                :current="c.id === currentClusterId"
                :route-combo="routeCombo"
                @select="explore"
              />
            </div>
            <div
              v-else
              class="switcher-empty"
              aria-hidden="true"
            >
              {{ t('nav.switcher.noMatch', { query: truncatedSearch }) }}
            </div>
          </template>

          <!-- Resting: the ALL CLUSTERS directory only, lazy-loaded via @scroll → load-more. -->
          <template v-else>
            <div
              v-if="clusterCount"
              class="switcher-group"
              role="group"
              :aria-label="t('nav.switcher.allClusters')"
            >
              <ClusterSwitcherRow
                v-for="(c, i) in directory"
                :id="optionId(c)"
                :key="c.id"
                :cluster="c"
                :active="activeIndex === i + localOffset"
                :current="c.id === currentClusterId"
                :route-combo="routeCombo"
                @select="explore"
              />
            </div>
          </template>

          <!-- Infinite-scroll loading skeleton — shimmer placeholder rows while the next page loads. -->
          <div
            v-if="loadingMore"
            class="switcher-loading"
            aria-hidden="true"
          >
            <div
              v-for="n in 2"
              :key="n"
              class="skeleton-row"
            >
              <div class="skeleton-badge shimmer" />
              <div class="skeleton-lines">
                <div class="skeleton-line shimmer" />
                <div class="skeleton-line short shimmer" />
              </div>
            </div>
          </div>
        </div>

        <!-- Foot: "… N more — type to narrow" when the list is capped. -->
        <div
          v-if="moreCount > 0"
          class="switcher-footer"
        >
          {{ t('nav.switcher.moreTypeToNarrow', { count: moreCount }) }}
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
// Fallback trigger for standalone use (the app-bar supplies its own via #trigger): a compact "N ›" badge.
.cluster-count-trigger {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 2px;
  width: 42px;
  min-width: 42px;
  padding: 0;
  background: transparent;
  border: 1px solid var(--border);
  border-radius: var(--border-radius);
  color: var(--body-text);
  cursor: pointer;

  .count {
    font-size: 12px;
    font-weight: 600;
    line-height: 1;
  }

  .icon {
    font-size: 11px;
  }
}

.cluster-switcher-flyout {
  display: flex;
  flex-direction: column;
  width: 380px;
  // Height is capped in the unscoped popper block below, where the matching `top` offset lives — the two
  // have to move together for the bottom gutter to hold.
  background: var(--dropdown-bg, var(--body-bg));
  color: var(--body-text);

  // Exactly the expanded-nav search: 32px input, magnifier left, clear X right. Mirror the nav-bar's
  // centering technique — a flex row exactly as tall as the input, with the overlaid icons positioned via
  // `top: auto` (their static flex-centred position) rather than `top: 50%` on the asymmetrically-padded
  // container, which sat the icons ~1px high.
  .switcher-search {
    flex: 0 0 auto;
    display: flex;
    align-items: center;
    position: relative;
    padding: 4px 14px 8px;

    .switcher-search-input {
      flex: 1;
      height: 32px;
      padding: 0 35px 0 25px;
      border: 1px solid var(--border);
      border-radius: var(--border-radius);
      background: var(--input-bg);
      color: var(--input-text);

      &:focus {
        border-color: var(--primary);
        outline: none;
      }
    }

    // Magnifier: left, vertically centred on the input (flex align-items), faint until there's a term.
    .magnifier {
      position: absolute;
      left: 20px;
      top: auto;
      width: 12px;
      height: 12px;
      font-size: 12px;
      opacity: 0.4;

      &.active {
        opacity: 1;
      }
    }

    // Clear (X): a real button (keyboard-operable), positioned right; black while shown, primary on hover.
    .icon-close {
      position: absolute;
      right: 20px;
      top: auto;
      // Button resets so the icon-font glyph sits like the old <i>.
      appearance: none;
      border: none;
      background: transparent;
      padding: 0;
      line-height: 1;
      font-size: 12px;
      cursor: pointer;
      color: var(--body-text);

      &:hover {
        color: var(--primary);
      }

      &:focus-visible {
        outline: 2px solid var(--primary);
        outline-offset: 2px;
        border-radius: 2px;
      }
    }
  }

  // local: fixed, non-scrolling. Its divider comes from the row's own border-bottom (full width).
  .switcher-local {
    flex: 0 0 auto;

    // The local row (#cluster-switcher-opt-local) carries 14px on every side — the extra 5px over the
    // scrolling rows' 9px now lives INSIDE the row, so its highlight covers it instead of the old wrapper
    // padding-top leaving a clipped gap above the highlight when local is active.
    .cluster-switcher-row {
      padding: 14px;
    }
  }

  .switcher-scroll {
    flex: 1 1 auto;
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
    flex: 0 0 auto;
    background: var(--dropdown-bg, var(--body-bg));
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 10px 16px 2px;
    line-height: 18px;
    font-size: 11px;
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
    padding: 18px 14px 10px;
    text-align: left;
    font-size: 12px;
    color: var(--muted);
    // A long, unbroken query must wrap inside the popover rather than overflow its edge.
    overflow-wrap: anywhere;
  }

  // Infinite-scroll loading skeleton — shimmer placeholder rows mirroring the real row layout.
  .switcher-loading {
    .skeleton-row {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px 16px;
    }

    .skeleton-badge {
      flex: 0 0 auto;
      width: 40px;
      height: 32px;
      border-radius: var(--border-radius);
    }

    .skeleton-lines {
      flex: 1 1 auto;
      display: flex;
      flex-direction: column;
      gap: 7px;
    }

    .skeleton-line {
      height: 10px;
      width: 55%;
      border-radius: 4px;

      &.short {
        width: 32%;
      }
    }
  }

  .shimmer {
    background-image: linear-gradient(
      90deg,
      color-mix(in srgb, var(--body-text) 7%, transparent) 25%,
      color-mix(in srgb, var(--body-text) 15%, transparent) 37%,
      color-mix(in srgb, var(--body-text) 7%, transparent) 63%
    );
    background-size: 400% 100%;
    animation: switcher-shimmer 1.4s ease infinite;
  }

  @keyframes switcher-shimmer {
    0% {
      background-position: 100% 0;
    }
    100% {
      background-position: 0 0;
    }
  }

  // Foot: a single muted "… N more — type to narrow" line, no border.
  .switcher-footer {
    // Left inset (81px) aligns the footer text with the row names (past the badge lane).
    padding: 8px 14px 14px 81px;
    font-size: 12px;
    color: var(--muted);
  }
}
</style>

<style lang="scss">
// The expanded nav's width (`.side-menu.menu-open` in TopLevelMenu). The flyout opens beside the nav in
// EITHER state, so it needs both widths.
$app-bar-expanded-width: 300px;

// Where the flyout starts, chosen so its search box lands on the same line as the trigger button that
// opened it: the flyout leads with the fixed `local` tile, and so does the nav above the button — drop
// both and everything moves up, hence the second offset. The flyout then runs to the bottom of the
// viewport, less a fixed gutter.
$flyout-top: 50px;
$flyout-top-no-local: 65px;
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

  .cluster-switcher-flyout {
    max-height: calc(100vh - #{$flyout-top} - #{$flyout-gutter});
  }
}

// Expanded nav: the same 16px gap, measured from the wider nav's edge.
.cluster-switcher-popper.nav-expanded.v-popper__popper {
  left: calc(#{$app-bar-expanded-width} + 16px) !important;
}

// No `local`: neither the nav nor the flyout carries the tile, so both the button and the flyout's
// search box move up — the flyout starts lower to meet it again, and gives back the same height.
.cluster-switcher-popper.no-local.v-popper__popper {
  top: $flyout-top-no-local !important;

  .cluster-switcher-flyout {
    max-height: calc(100vh - #{$flyout-top-no-local} - #{$flyout-gutter});
  }
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
