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
import { useResourceShortNames } from '@shell/composables/useResourceShortNames';
import { filterLocationValidParams, isNavItemActive } from '@shell/utils/router';
import { isMac } from '@shell/utils/platform';

/**
 * A jumpable nav section: a leaf resource type or a group overview, tagged with
 * the labels of its ancestor groups so nested results can render a full path.
 */
interface JumpItem {
  key: string;
  label: string;
  path: string[];
  route: any;
  shortNames: string[];
  node: any;
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

const explorerClusterId = () => (store.getters.isExplorer ? store.getters.clusterId : '');
const history = useClusterLocalStorage<string[]>('nav-jump-history', explorerClusterId);

const shortNames = useResourceShortNames();

const shortNamesFor = (node: any): string[] => {
  const types = [node.name, ...(node.navResources || [])];

  return Array.from(new Set(types.flatMap((type: string) => shortNames.value[type] || [])));
};

// A reactive mirror of the persisted history so the default list re-renders when
// a jump is recorded (localStorage reads on their own aren't reactive). Reloaded
// whenever the active cluster changes.
const recentKeys = ref<string[]>([]);

watch(() => explorerClusterId(), () => {
  const saved = history.load();

  recentKeys.value = Array.isArray(saved) ? saved : [];
}, { immediate: true });

const DEFAULT_KEYS = [POD, WORKLOAD_TYPES.DEPLOYMENT, SERVICE, CONFIG_MAP, NODE];

const MAX_RESULTS = 10;
const MAX_HISTORY = 10;
const MAX_DEFAULT = 5;

const query = ref('');
const open = ref(false);
// The option Enter would pick. Always highlighted, so the dropdown never shows
// a selection the user can't see; arrow keys and hovering both move it.
const activeIndex = ref(0);
const input = ref<HTMLInputElement | null>(null);
const toolbar = ref<HTMLElement | null>(null);

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
        byKey[node.name] = {
          key: node.name, label, path: [...path], route, shortNames: shortNamesFor(node), node
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
 * Sections whose label or type name contains the query, ranked by how early the
 * match is. The type name is matched too so a resource is still findable by its
 * schema and API group (`provisioning.cattle`), as it was in the search dialog
 * this replaces.
 */
const searchResults = computed<JumpItem[]>(() => {
  const q = query.value.trim().toLowerCase();

  if (!q) {
    return [];
  }

  const matchIndex = (item: JumpItem) => {
    const indexes = [item.label.toLowerCase().indexOf(q), item.key.toLowerCase().indexOf(q)].filter((idx) => idx >= 0);

    return indexes.length ? Math.min(...indexes) : -1;
  };

  return items.value
    .map((item) => ({
      item, idx: matchIndex(item), isShortName: item.shortNames.includes(q)
    }))
    .filter((scored) => scored.isShortName || scored.idx >= 0)
    .sort((a, b) => Number(b.isShortName) - Number(a.isShortName) || a.idx - b.idx || a.item.label.localeCompare(b.item.label))
    .slice(0, MAX_RESULTS)
    .map((scored) => scored.item);
});

const results = computed<JumpItem[]>(() => (query.value.trim() ? searchResults.value : defaultResults.value));

const listHeadingKey = computed<string | null>(() => {
  if (query.value.trim()) {
    return null;
  }

  return recentItems.value.length ? 'nav.jumpTo.recentHeading' : 'nav.jumpTo.popularHeading';
});

// Reset the highlight to the top on open and while typing, but not when the
// underlying nav tree merely re-renders.
watch([query, open], () => {
  activeIndex.value = 0;
});

function focusInput() {
  input.value?.focus();
}

function onFocus() {
  open.value = true;
  activeIndex.value = 0;
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
    <div class="jump-to">
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
          class="jump-to-results"
          role="listbox"
        >
          <li
            v-for="(item, i) in results"
            :id="optionId(i)"
            :key="item.key"
            class="jump-to-option"
            :class="{ active: i === activeIndex }"
            data-testid="nav-jump-to-option"
            role="option"
            :aria-selected="i === activeIndex"
            @mousedown.prevent="jumpTo(item)"
            @mouseenter="activeIndex = i"
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
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  padding: 0 var(--nav-toolbar-pad-x);
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
