<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue';
import { useStore } from 'vuex';
import { useI18n } from '@shell/composables/useI18n';
import ClusterSwitcherRow from '@shell/components/nav/ClusterSwitcherRow.vue';
import type { TopLevelMenuCluster } from '@shell/components/nav/TopLevelMenu.helper';
import { SEARCH_ECHO_MAX } from '@shell/store/prefs';

/**
 * The cluster-switcher flyout (SURE-8192 / rancher/dashboard#11043).
 *
 * A search-first popover for the COLLAPSED app-bar that mirrors the EXPANDED nav's cluster area 1:1 —
 * search box, the fixed `local` (management-cluster) tile, then the ALL CLUSTERS directory. Typing
 * narrows to a flat match list over the whole estate. A row click (or Enter on the ↑↓ cursor) EXPLORES
 * the cluster without leaving the page. Pin/unpin happens inline on each row.
 *
 * Data (local / all / searchResults / clusterCount) is supplied by the parent from
 * sideNavService, so this component stays presentational and testable.
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
  /** Total number of clusters matching the current search (from the page-1 response), so MATCHES shows
   * the real total, not just the loaded page. SURE-8192 (v2). */
  searchCount?: number;
  /** A search request is in flight — drives the initial search skeleton. SURE-8192 (v2). */
  searchLoading?: boolean;
  /** Id of the cluster currently being explored (marked `current`). */
  currentClusterId?: string;
  /** Current search term (v-model:search). */
  search?: string;
  /** Infinite scroll: whether more rows can be loaded for the currently-shown list. */
  hasMore?: boolean;
  /** Infinite scroll: a load-more fetch is in flight (drives the skeleton shimmer). */
  loadingMore?: boolean;
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
});

const emit = defineEmits(['update:search', 'select', 'update:open', 'load-more']);

const store = useStore();
const { t } = useI18n(store);

const open = ref<boolean>(false);
const activeIndex = ref<number>(0);
const searchInput = ref<HTMLElement | null>(null);

const searching = computed<boolean>(() => !!props.search);

// The ALL directory (local is a separate fixed tile, never listed here).
const directory = computed<TopLevelMenuCluster[]>(() => props.all.filter((c) => !c.isLocal));

// The flat, top-to-bottom list the ↑↓ cursor and Enter operate over: the match list while searching,
// else the ALL CLUSTERS directory (v2 — no PINNED/RECENT groups in the flyout). SURE-8192.
const rows = computed<TopLevelMenuCluster[]>(() => (searching.value ? props.searchResults.filter((c) => !c.isLocal) : directory.value));

// `local` stays a FIXED tile ABOVE the search door (visual layout unchanged), but the combobox must still
// OWN it for the keyboard — otherwise ↑↓ + Enter skip the row most people switch to. So the NAVIGATION
// model puts `local` at the head (index 0); the results listbox below still renders only `rows`, and the
// template offsets each results row by `localOffset` so highlight + activeIndex stay in lock-step.
// SURE-8192
const localOffset = computed<number>(() => (props.local ? 1 : 0));
const navRows = computed<TopLevelMenuCluster[]>(() => (props.local ? [props.local, ...rows.value] : rows.value));

// Land the cursor on the first ALL/MATCH row, not the fixed `local` tile, so Enter opens a cluster you
// actually searched for; `local` is one ArrowUp away. Clamp for a local-only list. SURE-8192.
const firstResultIndex = () => Math.min(localOffset.value, Math.max(0, navRows.value.length - 1));

// How many estate clusters are NOT currently shown — drives the "… N more — type to narrow" foot.
// Only meaningful in the resting list (a search narrows to matches). SURE-8192 (v2).
const moreCount = computed(() => (searching.value ? 0 : Math.max(0, props.clusterCount - directory.value.length)));

const placeholder = computed(() => (props.clusterCount ? t('nav.switcher.searchPlaceholder', { count: props.clusterCount }) : t('nav.switcher.searchPlaceholderSimple')));

// The "no clusters match" line echoes the query back; a very long query would overflow the popover, so
// cap it with an ellipsis (the closing quote stays put). Limit shared with the expanded nav. SURE-8192.
const truncatedSearch = computed(() => {
  const s = props.search || '';

  return s.length > SEARCH_ECHO_MAX ? `${ s.slice(0, SEARCH_ECHO_MAX) }…` : s;
});

// ── Accessibility: WAI-ARIA combobox + listbox ────────────────────────────────────────────────────
// The search input is a combobox that owns the results listbox; each row is an `option` the input points
// at via aria-activedescendant, so a screen reader announces the ↑↓-highlighted cluster WITHOUT moving
// DOM focus off the input. A polite live region echoes the result count / empty / loading state. v2.
const listboxId = 'cluster-switcher-listbox';
// `local` sits in its own single-option listbox above the door; the combobox references BOTH via
// aria-controls so it legitimately owns the local option too. SURE-8192.
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

// Reset the ↑↓ cursor to the top when the SEARCH term changes. NOT on every `rows` change: a pin
// toggle or an infinite-scroll load-more mutates `rows` without changing what the user is looking at,
// and resetting then would yank the highlight up to the top row. Open resets via setOpen. SURE-8192.
watch(() => props.search, () => {
  activeIndex.value = firstResultIndex();
});

const setOpen = (value: boolean) => {
  open.value = value;
  emit('update:open', value);

  if (value) {
    activeIndex.value = firstResultIndex();
    // Actual focus happens on the dropdown's `apply-show` (see focusSearchInput) — by then the
    // teleported popper is mounted. Focusing here is too early (the input doesn't exist yet).
  }
};

const toggle = () => {
  setOpen(!open.value);
};

// Focus the search once the popper is actually shown/mounted (floating-vue's `apply-show`). It
// grabs focus for its own container on show, so we retry a few frames until the input keeps focus.
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

// Clear the flyout search (the X), then keep focus in the input. SURE-8192 (v2).
const clearSearch = () => {
  emit('update:search', '');
  searchInput.value?.focus();
};

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

const onKeydown = (e: KeyboardEvent) => {
  switch (e.key) {
  case 'ArrowDown':
    e.preventDefault();
    activeIndex.value = Math.min(activeIndex.value + 1, navRows.value.length - 1);
    break;
  case 'ArrowUp':
    e.preventDefault();
    activeIndex.value = Math.max(activeIndex.value - 1, 0);
    break;
  case 'Enter': {
    e.preventDefault();
    explore(navRows.value[activeIndex.value]);
    break;
  }
  case 'Escape':
    e.preventDefault();
    setOpen(false);
    break;
  default:
    break;
  }
};

// Exposed for the unit tests, which drive these internals directly. SURE-8192.
defineExpose({
  searching,
  rows,
  navRows,
  placeholder,
  activeIndex,
  open,
  setOpen,
  toggle,
  onInput,
  onKeydown,
  explore,
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
    popper-class="cluster-switcher-popper"
    @apply-show="focusSearchInput"
    @apply-hide="setOpen(false)"
  >
    <!-- Trigger: the parent supplies it via #trigger so it reuses the app-bar's own cluster-button
         structure (`.option.cluster.selector`) rather than a bespoke control. The bare-count button is
         only a fallback for standalone use. SURE-8192 (v2). -->
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
        class="cluster-switcher-flyout"
        role="none"
        @keydown="onKeydown"
      >
        <!-- Polite live region: announces the result count / empty / loading state as the user types,
             without stealing focus. Visually hidden. SURE-8192 (v2). -->
        <div
          class="sr-only"
          role="status"
          aria-live="polite"
        >
          {{ statusMessage }}
        </div>

        <!-- local — FIXED tile ABOVE the search "door", mirroring the expanded nav (local → door). Always
             shown when the user has access to it (even while searching). Its own single-option listbox so
             the option is never orphaned outside a listbox. SURE-8192 (v2). -->
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
            :active="activeIndex === 0"
            :current="local.id === currentClusterId"
            @select="explore"
            @hover="activeIndex = 0"
          />
        </div>

        <!-- Search "door" — a combobox that owns the results listbox below. SURE-8192 (v2). -->
        <div class="switcher-search">
          <input
            ref="searchInput"
            :value="search"
            type="text"
            role="combobox"
            class="switcher-search-input"
            :placeholder="placeholder"
            :aria-label="t('nav.switcher.searchPlaceholderSimple')"
            aria-expanded="true"
            aria-haspopup="listbox"
            aria-autocomplete="list"
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
              <div
                class="switcher-group-label static"
                aria-hidden="true"
              >
                {{ t('nav.switcher.matches') }}
                <span class="switcher-group-count">{{ searchCount }}</span>
              </div>
              <ClusterSwitcherRow
                v-for="(c, i) in rows"
                :id="optionId(c)"
                :key="c.id"
                :cluster="c"
                :active="activeIndex === i + localOffset"
                :current="c.id === currentClusterId"
                @select="explore"
                @hover="activeIndex = i + localOffset"
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

          <!-- Resting: the ALL CLUSTERS directory only (v2 — no PINNED/RECENT in the flyout). Always
               shown; lazy-loaded via @scroll → load-more. -->
          <template v-else>
            <div
              v-if="clusterCount"
              class="switcher-group"
              role="group"
              :aria-label="t('nav.switcher.allClusters')"
            >
              <div
                class="switcher-group-label static"
                aria-hidden="true"
              >
                {{ t('nav.switcher.allClusters') }}
                <span class="switcher-group-count">{{ clusterCount }}</span>
              </div>
              <ClusterSwitcherRow
                v-for="(c, i) in directory"
                :id="optionId(c)"
                :key="c.id"
                :cluster="c"
                :active="activeIndex === i + localOffset"
                :current="c.id === currentClusterId"
                @select="explore"
                @hover="activeIndex = i + localOffset"
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

        <!-- Foot: "… N more — type to narrow" when the list is capped (there are clusters not shown).
             The searching-with-no-results case shows its own empty message in the body above. SURE-8192 (v2). -->
        <div
          v-if="moreCount > 0"
          class="switcher-footer"
        >
          {{ t('nav.switcher.moreTypeToNarrow', { count: moreCount }) }}
        </div>
      </div>
    </template>
  </v-dropdown>

  <!-- Page overlay while the flyout is open — the app's standard scrim; clicking it closes the flyout.
       Teleported to <body> so it sits above the app but below the (fixed-positioned) flyout popper.
       SURE-8192 (v2). -->
  <Teleport to="body">
    <div
      v-if="open"
      class="cluster-switcher-overlay"
      @click="setOpen(false)"
    />
  </Teleport>
</template>

<style lang="scss" scoped>
// Fallback trigger for standalone use (the app-bar supplies its own via #trigger): a compact "N ›"
// count badge. SURE-8192 (v2).
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
  // 660px cap, but never taller than the viewport minus the flyout's 60px top offset + 16px breathing
  // room, so the footer stays on-screen on short viewports (the popper is position:fixed, can't scroll).
  max-height: min(660px, calc(100vh - 76px));
  background: var(--dropdown-bg, var(--body-bg));
  color: var(--body-text);

  // Exactly the expanded-nav search: 32px input, magnifier on the left, clear X on the right. SURE-8192.
  .switcher-search {
    position: relative;
    padding: 8px 14px 6px;

    .switcher-search-input {
      width: 100%;
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

    // Magnifier: left, vertically centred on the input, faint until there's a term.
    .magnifier {
      position: absolute;
      left: 20px;
      top: 50%;
      transform: translateY(-50%);
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
      top: 50%;
      transform: translateY(-50%);
      // Button resets so the icon-font glyph sits like the old <i>. SURE-8192 (v2).
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
    // 14px above the first (local) row — the local row itself carries 9px, so top it up by 5. SURE-8192.
    padding-top: 5px;
  }

  .switcher-scroll {
    flex: 1 1 auto;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;

    // Bottom scroll-edge shadow that paints OVER the rows (identical overlay to the expanded nav's
    // `.clusters::after`). A `background` gradient sits behind the element's content, so the opaque badge
    // chips occlude it; instead a sticky pseudo-element pinned to the bottom of the scroll viewport
    // renders after the rows and layers on top. A CSS scroll-driven animation fades it out as the list
    // reaches the bottom — no JS. `margin-top` pulls it back over content so it adds no scroll height;
    // `pointer-events: none` keeps the rows/pins clickable. SURE-8192.
    &::after {
      content: "";
      position: sticky;
      bottom: 0;
      display: block;
      height: 8px;
      margin-top: -8px;
      pointer-events: none;
      background: linear-gradient(180deg, transparent 0%, color-mix(in srgb, var(--body-text) 8%, transparent) 100%);
      // Hidden by default; only the scroll-driven animation (below) reveals it. When the list ISN'T
      // scrollable the scroll timeline is inactive, the animation doesn't apply, and this base value wins
      // — so no stray shadow on a short list. SURE-8192.
      opacity: 0;
      // Scroll position drives the fade: visible while scrolling, gone at the bottom. Where scroll-driven
      // animations aren't supported (e.g. Safari) the timeline is ignored and the base opacity:0 wins —
      // the shadow simply never shows (no breakage). SURE-8192.
      animation: switcher-scroll-shadow linear both;
      animation-timeline: scroll(nearest block);
    }
  }

  // Scroll-edge shadow fade (see `.switcher-scroll::after`): visible while scrolling, gone at the bottom.
  // Driven by animation-timeline: scroll(), so 0% = top of scroll, 100% = bottom. SURE-8192.
  @keyframes switcher-scroll-shadow {
    0%, 88% {
      opacity: 1;
    }
    100% {
      opacity: 0;
    }
  }

  // Group header (ALL CLUSTERS / MATCHES): a static caption. Metrics match the expanded nav's section
  // label (6 top / 4 bottom / 16 sides, 18px content). SURE-8192.
  .switcher-group-label {
    // Pinned to the top of the scroll viewport so the ALL CLUSTERS / MATCHES caption never scrolls away
    // (opaque background so the rows scroll under it). SURE-8192 (v2).
    position: sticky;
    top: 0;
    z-index: 1;
    background: var(--dropdown-bg, var(--body-bg));
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 16px 4px;
    line-height: 18px;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    color: var(--muted);

    // The label always renders static (no accordion toggle) — no chevron, not clickable.
    &.static {
      cursor: default;

      &:hover {
        color: var(--muted);
      }
    }

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
    // A long, unbroken query must wrap inside the popover rather than overflow its edge. SURE-8192 (v2).
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

  // Foot: a single muted "… N more — type to narrow" line. No border (v2 — the flyout has no lines).
  .switcher-footer {
    // Left inset (81px) aligns the footer text with the row names (past the badge lane). SURE-8192 (v2).
    padding: 8px 14px 14px 81px;
    font-size: 12px;
    color: var(--muted);
  }
}
</style>

<style lang="scss">
// The switcher popper is teleported to <body>, out of reach of scoped styles, so target it here
// (namespaced by popper-class so nothing else is affected). Figma rev 2: the flyout floats free of
// the rail — 16px off the collapsed app-bar and vertically centred in the viewport — rather than
// anchoring to the small "N ›" trigger. `!important` overrides floating-ui's inline transform (it
// sets `transform`/`inset` inline without !important, and re-applies on scroll/resize, so we always win).
// Page scrim behind the open flyout — the app's standard overlay; click to close (see the component).
// Starts at the rail's right edge so the nav bar itself is NOT dimmed (the rail sits in a nested
// stacking context and can't be lifted above a body-level overlay, so we just don't cover it). SURE-8192.
.cluster-switcher-overlay {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: $app-bar-collapsed-width;
  z-index: 100;
  background: var(--overlay-bg);
}

.cluster-switcher-popper.v-popper__popper {
  position: fixed !important;
  left: calc(#{$app-bar-collapsed-width} + 16px) !important;
  top: 60px !important;
  transform: none !important;
  // Above the scrim (100) and the lifted rail (101).
  z-index: 102 !important;
}

// No connector arrow (the flyout floats free of the rail).
.cluster-switcher-popper .v-popper__arrow-container {
  display: none;
}

// Drop floating-vue's default 10px inner padding — the flyout manages its own spacing edge-to-edge
// (full-width rows / dividers). Namespaced by popper-class, so no :deep and no effect on other poppers.
.cluster-switcher-popper .v-popper__inner {
  padding: 0;
}
</style>
