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
 * Two controls side by side, never nested: the row itself explores the cluster, the pin toggles it. Both
 * are real buttons, so both are reachable with Tab and carry their own name and state.
 */
interface Props {
  cluster: TopLevelMenuCluster;
  id?: string;
  /** The row the list's cursor is on: it holds the highlight. */
  active?: boolean;
  /** The one row Tab can reach — the cursor's row, or the first row while the cursor is still outside
   * the list, so Tab from the search box always lands somewhere. */
  tabbable?: boolean;
  /** The cluster being explored. Drives `aria-current` only — the panel does not mark it, so the one
   * highlight in here stays the cursor's. */
  current?: boolean;
  /** Whether this is the occurrence that carries `aria-current` — the same cluster can be on screen up to
   * three times, and the attribute marks one thing. */
  announceCurrent?: boolean;
  subtitle?: string;
  pinnable?: boolean;
  /** Option/Alt is held on a cluster-explorer route — swap the chip's pin overlay for the combo arrow,
   * the same cue the nav-bar rows show, so the flyout advertises "switch and keep this view" too. */
  routeCombo?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  id:              undefined,
  active:          false,
  tabbable:        false,
  current:         false,
  announceCurrent: true,
  subtitle:        '',
  pinnable:        true,
  routeCombo:      false,
});

const emit = defineEmits(['select', 'focus-row', 'unpinned']);

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

// The pin is its own button with its own name and `aria-pressed`, so this label carries only what the
// row's own control is for — the state lives on the control that owns it.
const ariaLabel = computed(() => {
  const parts = [props.cluster.label];

  if (meta.value) {
    parts.push(meta.value);
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
  <li
    :id="id"
    class="cluster-switcher-row"
    :class="{ active, disabled: !cluster.ready }"
  >
    <button
      type="button"
      class="row-main"
      :tabindex="tabbable ? 0 : -1"
      :aria-label="ariaLabel"
      :aria-current="current && announceCurrent ? 'true' : undefined"
      :aria-disabled="!cluster.ready ? 'true' : undefined"
      @click="select"
      @focus="emit('focus-row')"
    >
      <ClusterIconMenu
        :cluster="cluster"
        class="row-badge"
        :show-pin="false"
        :route-combo="routeCombo && cluster.ready"
        aria-hidden="true"
      />
      <span class="row-body">
        <span class="row-name">{{ cluster.label }}</span>
        <span
          v-if="meta"
          class="row-meta"
        >{{ meta }}</span>
      </span>
    </button>
    <!-- A sibling, not a child: a button may not contain another interactive element. Tabbable with the
         row, so the pin is reachable without knowing the shortcut. -->
    <Pinned
      v-if="pinnable"
      :cluster="cluster"
      :tab-order="tabbable ? 0 : -1"
      class="row-pin"
      @focus="emit('focus-row')"
      @unpinned="emit('unpinned', cluster)"
    />
  </li>
</template>

<style lang="scss" scoped>
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
  gap: 12px;
  // Anchor for the control's hit area below.
  position: relative;
  // The row's inset lives on the CONTROL, not here: the highlight is drawn on this element, so padding
  // held here is highlighted space that no longer clicks anything — the click moved onto `.row-main`
  // when the row stopped being one big clickable div. The geometry is unchanged; the hit area is not.
  padding: 0;
  // The radius is the resource finder's: an `outline` follows its element's corners, so this is what
  // rounds the keyboard ring.
  border-radius: var(--border-radius);
  border-bottom: 1px solid var(--border);

  // Dim only what "not ready" applies to: the row can't be explored, but its pin toggle still works
  // (mouse and keyboard both pin a not-ready cluster), so it must not read as dead along with it.
  // `aria-disabled`, not `disabled`: the row stays focusable so ↑↓ and Tab still reach it and announce
  // why it cannot be explored. `select()` is what actually refuses.
  &.disabled .row-main {
    cursor: default;

    .row-badge,
    .row-body {
      opacity: 0.55;
    }
  }

  // ONE highlight, never two: `.active` is the cursor, and the pointer moves it by hovering (see the
  // flyout's `onPointerMove`) rather than painting a second highlight of its own. Two independent ones
  // let the list show a keyboard row and a hovered row at the same time, neither of which was clearly
  // "the" row Enter would take.
  &.active {
    background: color-mix(in srgb, var(--body-text) 6%, transparent);
  }

  // The ring belongs to the whole row, not just the control inside it — the pin is a sibling, so a ring
  // on the control alone stops short of the row's end. The pin keeps its own, smaller ring.
  &:has(.row-main:focus-visible) {
    @include focus-outline;

    outline-offset: -2px;
  }

  // The control fills the row so the whole line stays clickable; the pin sits beside it. It carries the
  // row's inset itself, so every highlighted pixel left of the pin is part of the button.
  .row-main {
    display: flex;
    align-items: center;
    gap: 12px;
    flex: 1 1 auto;
    min-width: 0;
    padding: 16px;

    // ...and the strip the pin sits in belongs to the row too. The pin is a SIBLING, so the gap before
    // it and the margin after it are the control's neighbours, not its box: highlighted, and dead to a
    // click. This stretches the control's hit area over the whole row; the pin lifts itself back on top.
    &::after {
      content: '';
      position: absolute;
      inset: 0;
    }
    border: none;
    background: none;
    text-align: left;
    cursor: pointer;
    // A <button> carries the app's button metrics — `min-height: 40px` and a 40px line-height — and as
    // the row's tallest child it set the row's height, growing every row from 67px to 72px. The row's
    // own text carries its line-height on `.row-name` / `.row-meta`.
    min-height: 0;
    line-height: normal;

    // The row carries the ring (see below); two would be drawn otherwise.
    &:focus-visible {
      outline: none;
    }
  }

  .row-badge {
    flex: 0 0 auto;
  }

  .row-body {
    flex: 1 1 auto;
    min-width: 0;
    // A gap rather than a margin: the meta is conditional, and a margin would leave the name paying for a
    // line that is not there.
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
      // Measured over the highlighted row's tint, not just the panel: `--muted` lands at 4.30:1 and
      // `--input-label` at 4.40:1 there, both under the 4.5:1 AA floor for 12px text. This is the design
      // system's secondary-label token and clears it in both themes.
      color: var(--label-secondary);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  // The pin: faint until the row is hovered or active, or the pin itself has focus; primary when pinned.
  .row-pin {
    @include icon-hover-square(12px);
    flex: 0 0 auto;
    // The row itself no longer pads, so the pin keeps its own distance from the row's edge.
    margin-right: 16px;
    // Above the control's stretched hit area, or the row would swallow the pin's own click.
    position: relative;
    z-index: 1;
    color: var(--label-secondary) !important;
    opacity: 0;

    // No hover on a coarse pointer — keep it visible there.
    @media (hover: none) {
      opacity: 1;
    }

    &:focus-visible {
      opacity: 1;

      @include focus-outline;

      outline-offset: 2px;
    }

    &.is-pinned {
      opacity: 1;
      color: var(--primary) !important;
    }
  }

  &:hover .row-pin,
  &.active .row-pin {
    opacity: 1;
  }
}
</style>
