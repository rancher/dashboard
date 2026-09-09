<script setup lang="ts">
import { computed } from 'vue';
import { useStore } from 'vuex';
import { useI18n } from '@shell/composables/useI18n';
import ClusterIconMenu from '@shell/components/ClusterIconMenu.vue';
import Pinned from '@shell/components/nav/Pinned.vue';
import type { TopLevelMenuCluster } from '@shell/components/nav/TopLevelMenu.helper';

/**
 * A single cluster row in the cluster-switcher flyout.
 *
 * Clicking the row (or Enter while active) explores the cluster; the pin toggle is the only pin/unpin
 * affordance and mutates the pref via the reused `Pinned` control.
 */
interface Props {
  /** The cluster this row represents. */
  cluster: TopLevelMenuCluster;
  /** DOM id — lets the combobox input reference this row via aria-activedescendant. */
  id?: string;
  /** Keyboard-highlighted row (the ↑↓ cursor). */
  active?: boolean;
  /** This row is the cluster currently being explored. The panel does not mark it — no fill, and nothing
   * in the row's text: the one highlight in here belongs to the cursor, and a second mark competes with it
   * for the same meaning. The nav shelf is where "you are here" is shown. All this drives now is
   * `aria-current`, which says it to assistive tech without drawing anything. */
  current?: boolean;
  /** Whether THIS row is the one that carries `aria-current`. The same cluster can be on screen more than
   * once — the fixed tile, a RECENTLY USED shortcut, its row in the estate — and `aria-current` marks one
   * thing, so only the first occurrence announces it. */
  announceCurrent?: boolean;
  /** Overrides the derived provider·version meta line (used by the fixed `local` tile). */
  subtitle?: string;
  /** When false, the pin toggle is hidden (e.g. `local`, which is never pinnable). */
  pinnable?: boolean;
  /** Option/Alt is held on a cluster-explorer route — swap the chip's pin overlay for the combo arrow,
   * the same cue the nav-bar rows show, so the flyout advertises "switch and keep this view" too. */
  routeCombo?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  id:              undefined,
  active:          false,
  current:         false,
  announceCurrent: true,
  subtitle:        '',
  pinnable:        true,
  routeCombo:      false,
});

const emit = defineEmits(['select']);

const store = useStore();
const { t } = useI18n(store);

const meta = computed(() => {
  if (props.subtitle) {
    return props.subtitle;
  }

  return [
    props.cluster.providerDisplay,
    props.cluster.kubernetesVersion,
  ].filter((p) => !!p).join(' · ');
});

// Single screen-reader label — the badge is decorative and the pin is `aria-hidden`, so this label is
// the ONLY thing assistive tech perceives about the option: it has to carry the pinned state too, or
// the pin shortcut (the only keyboard route to the pin) is a toggle with no perceivable result.
const ariaLabel = computed(() => {
  const parts = [props.cluster.label];

  if (meta.value) {
    parts.push(meta.value);
  }
  if (props.pinnable && props.cluster.pinned) {
    parts.push(t('nav.switcher.aria.pinned'));
  }
  if (!props.cluster.ready) {
    parts.push(t('nav.switcher.aria.notReady'));
  }

  return parts.join(', ');
});

function select() {
  if (!props.cluster.ready) {
    return;
  }
  emit('select', props.cluster);
}
</script>

<template>
  <div
    :id="id"
    class="cluster-switcher-row"
    :class="{ active, disabled: !cluster.ready }"
    role="option"
    :aria-label="ariaLabel"
    :aria-selected="active ? 'true' : 'false'"
    :aria-current="current && announceCurrent ? 'true' : undefined"
    :aria-disabled="!cluster.ready ? 'true' : undefined"
    @click="select"
  >
    <ClusterIconMenu
      :cluster="cluster"
      class="row-badge"
      :show-pin="false"
      :route-combo="routeCombo && cluster.ready"
      aria-hidden="true"
    />
    <div class="row-body">
      <div class="row-name">
        {{ cluster.label }}
      </div>
      <div
        v-if="meta"
        class="row-meta"
      >
        {{ meta }}
      </div>
    </div>
    <!-- No `tab-order` on purpose: a focusable control inside `role="option"` is invalid ARIA, so the
         pin stays out of the tab order and the combobox drives it from the keyboard instead
         (Cmd+Shift+P / Alt+P). `aria-hidden` makes that explicit — an option's children are presentational, so the pin's own
         name/state is unreliable across screen readers and the pin shortcut is the supported path.
         `@mousedown.prevent` for the same reason the search's clear-X has it: with no `tabindex` here the
         browser focuses the nearest focusable ancestor, which is floating-vue's popper ROOT — and the
         flyout's `keydown` handler sits on a DESCENDANT of that root, so every key would go dead after a
         pin click. Suppressing the default keeps focus in the search input. -->
    <Pinned
      v-if="pinnable"
      :cluster="cluster"
      class="row-pin"
      aria-hidden="true"
      @mousedown.prevent
    />
  </div>
</template>

<style lang="scss" scoped>
// The row's pin toggle: a 22×22 hover square holding an icon that fills with subtle grey on hover.
@mixin icon-hover-square($icon-size) {
  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  min-width: 22px;
  height: 22px;
  min-height: 22px;
  padding: 0;
  border: none;
  border-radius: var(--border-radius);
  background: transparent;
  font-size: $icon-size;
  cursor: pointer;
  transition: opacity 0.1s ease-in-out, background-color 0.1s ease-in-out;

  &:hover {
    background: color-mix(in srgb, var(--body-text) 10%, transparent);
  }
}

.cluster-switcher-row {
  display: flex;
  align-items: center;
  gap: 10px;
  // Full-line row, no rounding; the 16px padding sets the height. A hairline divides one row from the next.
  padding: 16px;
  border-radius: 0;
  border-bottom: 1px solid var(--border);
  cursor: pointer;

  // Dim only what "not ready" applies to: the row can't be explored, but its pin toggle still works
  // (mouse and the pin shortcut both pin a not-ready cluster), so it must not read as dead along with it.
  &.disabled {
    cursor: default;

    .row-badge,
    .row-body {
      opacity: 0.55;
    }
  }

  // ONE highlight, never two: `.active` is the cursor, and the pointer moves it by hovering (see the
  // flyout's `onRowHover`) rather than painting a second highlight of its own. Two independent ones let
  // the list show a keyboard row and a hovered row at the same time, neither of which was clearly "the"
  // row Enter would take.
  &.active {
    background: color-mix(in srgb, var(--body-text) 6%, transparent);
  }

  .row-badge {
    // The row has its own pin toggle, so ClusterIconMenu's pin overlay on the chip is redundant here —
    // hidden via :show-pin="false".
    flex: 0 0 auto;
  }

  .row-body {
    flex: 1 1 auto;
    min-width: 0;
    // A column so the space between the name and its meta line is a gap rather than a margin one of them
    // carries — the meta is conditional, and a margin would leave the name paying for a line that is not
    // there.
    display: flex;
    flex-direction: column;
    gap: 4px;

    .row-name {
      font-size: 14px;
      font-weight: 600;
      line-height: 17px;
      color: var(--body-text);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .row-meta {
      font-size: 12px;
      line-height: 14px;
      color: var(--muted);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  // The pin: faint until hover/active or while pinned (its relocation is the feedback); primary when pinned.
  .row-pin {
    @include icon-hover-square(12px);
    flex: 0 0 auto;
    color: var(--muted) !important;
    opacity: 0;

    // No hover on a coarse pointer, and the toggle is out of the tab order — keep it visible there.
    @media (hover: none) {
      opacity: 1;
    }

    &.is-pinned {
      opacity: 1;
      color: var(--primary) !important;
    }
  }

  &.active .row-pin {
    opacity: 1;
  }
}
</style>
