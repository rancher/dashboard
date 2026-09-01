<script setup lang="ts">
import {
  computed, nextTick, onBeforeUnmount, ref, watch
} from 'vue';
import { useStore } from 'vuex';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from '@shell/composables/useI18n';
import { useClusterLocalStorage } from '@shell/composables/useClusterLocalStorage';
import {
  POD, SERVICE, CONFIG_MAP, NODE, WORKLOAD_TYPES
} from '@shell/config/types';
import { filterLocationValidParams, isNavItemActive } from '@shell/utils/router';
import { isMac } from '@shell/utils/platform';
import { compareDisjointMatches, disjointMatch, type DisjointMatch } from '@shell/utils/fuzzy';

/**
 * A jumpable nav section: a leaf resource type or a group overview, tagged with
 * the labels of its ancestor groups so nested results can render a full path.
 */
interface JumpItem {
  key: string;
  label: string;
  /**
   * The names this entry answers to: its label, then the bare names of the
   * types it is or stands in for. `Projects/Namespaces` is the entry you want
   * when you type `ns`, and only the `namespace` it covers says so.
   */
  names: string[];
  /**
   * The API-group-qualified schema ids behind it. Matched last, see
   * `searchResults`.
   */
  types: string[];
  path: string[];
  route: any;
  node: any;
}

/** A `JumpItem` the query matched, and how well. */
interface ScoredItem {
  item: JumpItem;
  match: DisjointMatch;
  /** Whether it matched one of its names rather than only a schema id. */
  named: boolean;
}

const props = defineProps<{
  /** The nav tree (SideNav's groups), the source of jumpable sections. */
  groups: any[];
  /** Whether any nav group is currently expanded (gates the collapse-all control). */
  hasExpandedGroup: boolean;
}>();

const emit = defineEmits<{(e: 'collapse-all'): void; (e: 'jumped'): void }>();

const store = useStore();
const router = useRouter();
const route = useRoute();
const { t } = useI18n(store);

/**
 * The cluster the history is scoped to, and only in the explorer: a jump means
 * something different in each cluster, and outside the explorer there is no
 * cluster to name.
 *
 * An empty id disables `useClusterLocalStorage` outright, so in every other
 * product the "Last used" list is never stored: it lives in `recentKeys` for as
 * long as nothing reloads it, which a refresh ends and so does any trip into a
 * cluster and back, since the watch below re-reads storage and finds nothing.
 * That is deliberate, and the same as SideNav's `nav-group-state`, which is
 * explorer-only for the same reason. Persisting it elsewhere needs a scope
 * those products don't have yet (Fleet's would be its workspace).
 */
const explorerClusterId = () => (store.getters.isExplorer ? store.getters.clusterId : '');
const history = useClusterLocalStorage<string[]>('nav-jump-history', explorerClusterId);

// A reactive mirror of the persisted history so the default list re-renders when
// a jump is recorded (localStorage reads on their own aren't reactive). Reloaded
// whenever the active cluster changes.
const recentKeys = ref<string[]>([]);

watch(() => explorerClusterId(), () => {
  const saved = history.load();

  recentKeys.value = Array.isArray(saved) ? saved : [];
}, { immediate: true });

const DEFAULT_KEYS = [POD, WORKLOAD_TYPES.DEPLOYMENT, SERVICE, CONFIG_MAP, NODE];

const MAX_HISTORY = 10;
const MAX_DEFAULT = 5;

const query = ref('');
const open = ref(false);
// The option Enter would pick. Always highlighted, so the dropdown never shows
// a selection the user can't see; arrow keys and hovering both move it.
const activeIndex = ref(0);
// Whether the keyboard put the highlight where it is. An option never holds DOM
// focus - the input keeps it and names the active one through
// `aria-activedescendant` - so `:focus-visible` can never match here and the
// focus ring has to be drawn by hand, on the same terms: keyboard only.
const keyboardActive = ref(false);
// Whether the keyboard brought focus to the input. A text input always matches
// `:focus-visible`, even under a pointer, because the browser expects typing
// next - so the ring cannot be left to CSS or it would follow a click too.
const keyboardFocus = ref(false);
// A pointer press lands before the focus event, which is how the two are told
// apart. Not a ref: nothing renders from it.
let pointerFocus = false;
const input = ref<HTMLInputElement | null>(null);
const toolbar = ref<HTMLElement | null>(null);
const list = ref<HTMLElement | null>(null);

// The dropdown is teleported to <body> so it can overhang the nav column without
// being clipped by its `overflow` ancestors; it is positioned under the toolbar.
const dropdownStyle = ref<Record<string, string>>({});

function positionDropdown() {
  const rect = toolbar.value?.getBoundingClientRect();

  if (rect) {
    // -1px so the panel's top/left borders overlap the toolbar and nav borders
    // rather than doubling up against them.
    dropdownStyle.value = { top: `${ rect.bottom - 1 }px`, left: `${ rect.left - 1 }px` };
  }
}

watch(open, (isOpen) => {
  if (isOpen) {
    nextTick(positionDropdown);
    window.addEventListener('scroll', positionDropdown, true);
    window.addEventListener('resize', positionDropdown);
  } else {
    window.removeEventListener('scroll', positionDropdown, true);
    window.removeEventListener('resize', positionDropdown);
  }
});

onBeforeUnmount(() => {
  window.removeEventListener('scroll', positionDropdown, true);
  window.removeEventListener('resize', positionDropdown);
});

const shortcutKeys = { windows: ['ctrl', 'k'], mac: ['meta', 'k'] };
const shortcutLabel = isMac ? '⌘K' : 'Ctrl+K';

/**
 * The route a node navigates to: its own, or (for a group) the first descendant
 * leaf's route, honouring a group's `defaultType`. Mirrors what clicking a group
 * header does in Group.vue, so a group jump lands on its first section.
 */
const firstLeafRoute = (node: any): any => {
  if (node.route) {
    return node.route;
  }

  const children = [...(node.children || [])];

  if (node.defaultType) {
    const idx = children.findIndex((child) => child.name === node.defaultType);

    if (idx > 0) {
      children.unshift(children.splice(idx, 1)[0]);
    }
  }

  for (const child of children) {
    const route = firstLeafRoute(child);

    if (route) {
      return route;
    }
  }

  return null;
};

const holdsCurrentRoute = (node: any): boolean => {
  if (node.route && isNavItemActive(router, route, node)) {
    return true;
  }

  return (node.children || []).some(holdsCurrentRoute);
};

const items = computed<JumpItem[]>(() => {
  const byKey: Record<string, JumpItem> = {};

  const walk = (nodes: any[], path: string[], parentLabel: string) => {
    (nodes || []).forEach((node) => {
      // Not `labelDisplay`: that is HTML-escaped markup meant for `v-clean-html`,
      // whereas this label is matched and rendered as plain text.
      const label = (node.label || node.name || '').trim();
      const route = firstLeafRoute(node);

      // Groups and leaves are both jumpable: a group navigates to (and expands
      // to reveal) its first section. Keep the first occurrence so a type's path
      // reflects its curated location rather than the "More Resources" tree. Skip
      // a child that repeats its parent group's label (the group's overview
      // entry), since the group itself already represents that jump.
      if (!node.isRoot && label && route && label !== parentLabel && !byKey[node.name]) {
        // A type is a name when it is bare (`endpoints`, `namespace`) and a
        // schema id once it carries an API group (`management.cattle.io.project`),
        // which is the half nobody reads. The entry's own type is read the same
        // way as the ones it stands in for: its bare name is all a translated
        // label leaves an abbreviation to match, since `ep` is nowhere in `端点`.
        const types: string[] = [node.name, ...(node.navResources || [])];
        const qualified = (type: string) => type.includes('.');

        byKey[node.name] = {
          key:   node.name,
          label,
          names: [label, ...types.filter((type) => !qualified(type))],
          types: types.filter(qualified),
          path:  [...path],
          route,
          node
        };
      }

      if (node.children?.length) {
        walk(node.children, node.isRoot ? path : [...path, label], node.isRoot ? parentLabel : label);
      }
    });
  };

  walk(props.groups || [], [], '');

  return Object.values(byKey);
});

const itemsByKey = computed<Record<string, JumpItem>>(() => items.value.reduce((acc, item) => {
  acc[item.key] = item;

  return acc;
}, {} as Record<string, JumpItem>));

const recentItems = computed<JumpItem[]>(() => recentKeys.value.map((key) => itemsByKey.value[key]).filter(Boolean));

// Outside the explorer there is no history and the default keys don't exist, so
// fall back to the first sections of the current product rather than an empty list.
const defaultResults = computed<JumpItem[]>(() => {
  if (recentItems.value.length) {
    return recentItems.value.slice(0, MAX_DEFAULT);
  }

  const defaults = DEFAULT_KEYS.map((key) => itemsByKey.value[key]).filter(Boolean);

  return (defaults.length ? defaults : items.value).slice(0, MAX_DEFAULT);
});

/**
 * Sections whose name or schema id matches the query, best match first.
 *
 * The query does not have to appear in one piece: it is split into as few runs
 * as it takes to find it, so a Kubernetes short name finds its resource
 * (`netpol` -> NetworkPolicies, `cm` -> ConfigMaps) without the nav having to
 * ask the cluster what the short names are. Whole matches still rank first.
 *
 * Schema ids are matched last, so a resource stays findable by its type and API
 * group (`provisioning.cattle`), as it was in the search dialog this replaces.
 * Only last, though: a row ranked highly by an id nobody can see reads as a
 * mismatch, and API groups are full of accidental hits (`cm` is in
 * `acme.cert-manager.io.challenge` twice over, and `mc` in every
 * `management.cattle.io` type).
 */
const searchResults = computed<JumpItem[]>(() => {
  const q = query.value.trim().toLowerCase();

  if (!q) {
    return [];
  }

  // Looped rather than mapped and sorted: this runs over the whole nav on every
  // keystroke, and all but a handful of entries have a single name.
  const bestMatch = (names: string[]) => {
    let best: DisjointMatch | null = null;

    for (const name of names) {
      const match = disjointMatch(name, q);

      if (match && (!best || compareDisjointMatches(match, best) < 0)) {
        best = match;
      }
    }

    return best;
  };

  const score = (item: JumpItem) => {
    const named = bestMatch(item.names);

    return {
      item, match: named || bestMatch(item.types), named: !!named
    };
  };

  return items.value
    .map(score)
    .filter((scored): scored is ScoredItem => !!scored.match)
    // Between two equally good matches the shorter label is the tighter fit
    // ('po' is more of `Pods` than of `PodDisruptionBudgets`).
    .sort((a, b) => Number(b.named) - Number(a.named) ||
      compareDisjointMatches(a.match, b.match) ||
      a.item.label.length - b.item.label.length ||
      a.item.label.localeCompare(b.item.label))
    .map((scored) => scored.item);
});

const results = computed<JumpItem[]>(() => (query.value.trim() ? searchResults.value : defaultResults.value));

const listHeadingKey = computed<string | null>(() => {
  if (query.value.trim()) {
    return null;
  }

  return recentItems.value.length ? 'nav.jumpTo.recentHeading' : 'nav.jumpTo.popularHeading';
});

/**
 * Keep the highlighted option on screen in the scrolling list. `nearest` scrolls
 * by as little as it can, so it does nothing while the option is already
 * visible. Only the keyboard and a reset call this: doing it on hover would drag
 * the list out from under the pointer.
 */
function scrollActiveIntoView() {
  // After the render that moved the highlight, so the option to scroll to exists.
  nextTick(() => (list.value?.children[activeIndex.value] as HTMLElement | undefined)?.scrollIntoView({ block: 'nearest' }));
}

// Reset the highlight to the top on open and while typing, but not when the
// underlying nav tree merely re-renders. The list keeps whatever scroll position
// the last query left it at, so put it back with the highlight.
watch([query, open], () => {
  activeIndex.value = 0;
  scrollActiveIntoView();
});

/** The `Ctrl`/`Cmd`+`K` shortcut, so focus is arriving by keyboard. */
function focusInput() {
  input.value?.focus();
}

/** Also clears the ring when a pointer presses an input that already has focus. */
function onMousedown() {
  pointerFocus = true;
  keyboardFocus.value = false;
}

function onFocus() {
  open.value = true;
  activeIndex.value = 0;
  keyboardActive.value = false;
  // Tab and the shortcut both land here with no pointer press before them.
  keyboardFocus.value = !pointerFocus;
  pointerFocus = false;
}

/** Hovering moves the highlight, but a pointer never draws the focus ring. */
function hover(index: number) {
  activeIndex.value = index;
  keyboardActive.value = false;
}

function onInput() {
  open.value = true;
}

function close() {
  open.value = false;
  query.value = '';
}

function move(delta: number) {
  if (!open.value) {
    open.value = true;

    return;
  }

  const count = results.value.length;

  if (!count) {
    return;
  }

  activeIndex.value = (activeIndex.value + delta + count) % count;
  keyboardActive.value = true;
  scrollActiveIntoView();
}

function jumpTo(item?: JumpItem) {
  if (!item) {
    return;
  }

  const recent = [item.key, ...recentKeys.value.filter((key) => key !== item.key)].slice(0, MAX_HISTORY);

  recentKeys.value = recent;
  history.save(recent);

  close();
  input.value?.blur();

  if (holdsCurrentRoute(item.node)) {
    emit('jumped');

    return;
  }

  // Navigating triggers SideNav's route sync, which expands the ancestor groups
  // to reveal the target without collapsing anything else.
  return router.push(filterLocationValidParams(router, item.route))
    // Once the push resolves the route has landed and Vue has patched the nav, so
    // the target is either already rendered or about to be revealed by SideNav's
    // route sync. Rejections (a guard cancelling the navigation) are ignored, but
    // only the push's: what `jumped` triggers must not be swallowed.
    .then(() => emit('jumped'), () => {});
}

function onEnter() {
  if (!open.value) {
    return;
  }

  jumpTo(results.value[activeIndex.value]);
}

const optionId = (index: number) => `jump-to-option-${ index }`;
</script>

<template>
  <div
    ref="toolbar"
    v-shortkey="shortcutKeys"
    class="nav-action-bar"
    @shortkey="focusInput"
  >
    <div
      class="jump-to"
      :class="{ 'keyboard-focus': keyboardFocus }"
    >
      <input
        ref="input"
        v-model="query"
        type="text"
        class="jump-to-input"
        data-testid="nav-jump-to-input"
        role="combobox"
        aria-controls="jump-to-listbox"
        aria-autocomplete="list"
        aria-haspopup="listbox"
        :aria-expanded="open"
        :aria-activedescendant="open && results.length ? optionId(activeIndex) : undefined"
        :aria-label="t('nav.jumpTo.ariaLabel')"
        :placeholder="t('nav.jumpTo.placeholder')"
        :title="t('nav.jumpTo.tooltip', { shortcut: shortcutLabel })"
        @mousedown="onMousedown"
        @focus="onFocus"
        @input="onInput"
        @blur="close"
        @keydown.down.prevent="move(1)"
        @keydown.up.prevent="move(-1)"
        @keydown.enter.prevent="onEnter"
        @keydown.esc.prevent="close"
      >
    </div>
    <button
      v-if="props.hasExpandedGroup"
      type="button"
      class="collapse-all-btn"
      data-testid="nav-collapse-all"
      :aria-label="t('nav.ariaLabel.collapseAllSections')"
      :title="t('nav.ariaLabel.collapseAllSections')"
      @click="emit('collapse-all')"
    >
      <i class="icon icon-collapse-all collapse-all-icon" />
    </button>
    <Teleport to="body">
      <div
        v-if="open"
        class="jump-to-dropdown"
        data-testid="nav-jump-to-dropdown"
        :style="dropdownStyle"
        @mousedown.prevent
      >
        <div
          v-if="listHeadingKey && results.length"
          class="jump-to-heading"
        >
          {{ t(listHeadingKey) }}
        </div>
        <!-- Outside the listbox: `role="listbox"` only permits options as children. -->
        <div
          v-if="!results.length"
          class="jump-to-empty"
        >
          {{ t('nav.jumpTo.noResults') }}
        </div>
        <ul
          v-else
          id="jump-to-listbox"
          ref="list"
          class="jump-to-results"
          role="listbox"
        >
          <li
            v-for="(item, i) in results"
            :id="optionId(i)"
            :key="item.key"
            class="jump-to-option"
            :class="{ active: i === activeIndex, 'keyboard-active': keyboardActive && i === activeIndex }"
            data-testid="nav-jump-to-option"
            role="option"
            :aria-selected="i === activeIndex"
            @mousedown.prevent="jumpTo(item)"
            @mouseenter="hover(i)"
          >
            <span class="jump-to-option-label">{{ item.label }}</span>
            <span
              v-if="item.path.length"
              class="jump-to-option-path"
            >{{ item.path.join(' / ') }}</span>
          </li>
        </ul>
      </div>
    </Teleport>
  </div>
</template>

<style lang="scss" scoped>
// Component-scoped design tokens for the "Cluster navigation controls" toolbar
// (Figma node 21:280). Colours reuse global theme variables; the one-off sizing
// lives here so it stays out of the global scope.
.nav-action-bar {
  --nav-toolbar-height: 40px;
  --nav-toolbar-pad-x: 16px;
  --nav-toolbar-collapse-width: 36px;
  --nav-toolbar-collapse-inset: 4px;

  position: relative;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  height: var(--nav-toolbar-height);
  background-color: var(--nav-bg);
  border-bottom: 1px solid var(--nav-border);
}

.jump-to {
  position: relative;
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  padding: 0 var(--nav-toolbar-pad-x);

  // The keyboard focus ring, in the app's focus colour. Drawn here rather than
  // as the input's own outline because `outline-offset` is uniform, and this
  // cell is ten times wider than it is tall: one offset cannot sit evenly
  // inside the toolbar on both axes. So it reaches out past the text line
  // vertically and pulls in from the cell edges horizontally, which lands it an
  // even distance inside the toolbar all the way round.
  //
  // A border rather than a box-shadow, which forced-colors modes drop.
  &.keyboard-focus:focus-within::after {
    content: '';
    position: absolute;
    inset: -5px 5px;
    border: 2px solid var(--primary-keyboard-focus);
    border-radius: var(--border-radius);
    pointer-events: none;
  }
}

.jump-to-input {
  width: 100%;
  padding: 0;
  border: none;
  background: transparent;
  color: var(--body-text);
  font-size: 14px;
  font-weight: 500;
  line-height: 1.4;

  &::placeholder {
    color: var(--input-placeholder);
    font-weight: 500;
  }

  // The ring is drawn on the cell instead, see `.jump-to`.
  &:focus,
  &:focus-visible {
    outline: none;
  }
}

.collapse-all-btn {
  position: relative;
  flex-shrink: 0;
  align-self: center;
  display: flex;
  align-items: center;
  justify-content: center;
  // The button is inset within its cell by the same amount on every side, so the
  // cell keeps the width the layout is built around and the glyph does not move,
  // while the focus ring has room to sit clear of the toolbar border and the nav
  // edge rather than straddling them.
  width: calc(var(--nav-toolbar-collapse-width) - var(--nav-toolbar-collapse-inset) * 2);
  height: calc(var(--nav-toolbar-height) - var(--nav-toolbar-collapse-inset) * 2);
  // The global BUTTON rule sets min-height to the standard button height, which
  // would otherwise pin this back to the full height of the toolbar.
  min-height: 0;
  margin: 0 var(--nav-toolbar-collapse-inset);
  padding: 0;
  border: none;
  background: transparent;
  color: var(--body-text);
  cursor: pointer;

  // 24px hairline divider between the input and the icon (Figma), centred rather
  // than spanning the full toolbar height. Offset back out to the cell edge so
  // insetting the button doesn't move it.
  &::before {
    content: '';
    position: absolute;
    left: calc(var(--nav-toolbar-collapse-inset) * -1);
    top: 50%;
    width: 1px;
    height: 24px;
    background-color: var(--border);
    transform: translateY(-50%);
  }

  // Suppress the pointer focus ring but keep the keyboard one, in the app's
  // focus style rather than the browser default.
  &:focus:not(:focus-visible) {
    outline: none;
  }

  &:focus-visible {
    @include focus-outline;
  }

  .collapse-all-icon {
    font-size: 16px;
  }
}

.jump-to-dropdown {
  // Defined here (not on the toolbar) because the panel is teleported out of it.
  --nav-toolbar-dropdown-width: 300px;
  --nav-toolbar-inset: 8px;

  position: fixed;
  z-index: 100;
  width: var(--nav-toolbar-dropdown-width);
  max-width: 100vw;
  padding: var(--nav-toolbar-inset);
  background-color: var(--dropdown-bg);
  color: var(--dropdown-text);
  border: 1px solid var(--border);
  border-radius: 0 var(--border-radius-md) var(--border-radius-md) 0;
  box-shadow: 4px 4px 8px rgba(0, 0, 0, 0.04);
}

.jump-to-heading {
  padding: var(--nav-toolbar-inset);
  color: var(--deemphasized);
  font-size: 13px;
  line-height: 1.2;
}

.jump-to-results {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin: 0;
  padding: 0;
  list-style: none;
  max-height: 60vh;
  overflow-y: auto;
}

.jump-to-option {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: var(--nav-toolbar-inset);
  border-radius: var(--border-radius);
  cursor: pointer;

  &.active {
    background-color: var(--sortable-table-hover-bg);
  }

  // Drawn inside the row: the options sit 2px apart, so an outward ring would
  // overlap its neighbours.
  &.keyboard-active {
    @include focus-outline;

    outline-offset: -2px;
  }

  .jump-to-option-label {
    font-size: 14px;
    font-weight: 500;
    color: var(--body-text);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .jump-to-option-path {
    font-size: 13px;
    line-height: 1.2;
    color: var(--deemphasized);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}

.jump-to-empty {
  padding: var(--nav-toolbar-inset);
  color: var(--deemphasized);
  font-size: 13px;
}
</style>
