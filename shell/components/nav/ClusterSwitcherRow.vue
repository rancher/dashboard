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
  /** This row is the cluster currently being explored. */
  current?: boolean;
  /** Overrides the derived provider·version meta line (used by the fixed `local` tile). */
  subtitle?: string;
  /** When false, the pin toggle is hidden (e.g. `local`, which is never pinnable). */
  pinnable?: boolean;
  /** Option/Alt is held on a cluster-explorer route — swap the chip's pin overlay for the combo arrow,
   * the same cue the nav-bar rows show, so the flyout advertises "switch and keep this view" too. */
  routeCombo?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  id:         undefined,
  active:     false,
  current:    false,
  subtitle:   '',
  pinnable:   true,
  routeCombo: false,
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
    props.current ? t('nav.switcher.current') : null,
  ].filter((p) => !!p).join(' · ');
});

// Single screen-reader label — the badge is decorative and the pin is a separate control, so the
// option announces just "<name>, <provider · version · current>".
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
  <div
    :id="id"
    class="cluster-switcher-row"
    :class="{ active, disabled: !cluster.ready, current }"
    role="option"
    :aria-label="ariaLabel"
    :aria-selected="active ? 'true' : 'false'"
    :aria-current="current ? 'true' : undefined"
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
    <Pinned
      v-if="pinnable"
      :cluster="cluster"
      class="row-pin"
      :class="{ 'is-pinned': cluster.pinned }"
    />
  </div>
</template>

<style lang="scss" scoped>
// Row action icons (gear + pin): a 22×22 hover square holding an icon that fills with subtle grey on hover.
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
  // Height matches the expanded-nav rows (43px); full-line, no rounding or divider.
  min-height: 43px;
  padding: 9px 14px 9px 14px;
  border-radius: 0;
  cursor: pointer;

  &.disabled {
    cursor: default;
    opacity: 0.55;
  }

  // Two separate highlights, deliberately: `:hover` follows the pointer and clears itself the moment it
  // leaves (CSS owns it, so nothing can strand it), while `.active` is the ↑↓ keyboard cursor and is
  // meant to persist. Driving hover off the keyboard cursor is what used to leave a row lit after the
  // pointer had gone.
  &:hover,
  &.active {
    background: color-mix(in srgb, var(--body-text) 6%, transparent);
  }

  // The cluster currently being explored — a filled primary row matching the expanded nav's active row.
  &.current {
    background: var(--active-nav, var(--primary-hover-bg));

    &.active,
    &:hover {
      background: var(--active-hover, var(--primary-hover-bg));
    }

    // `!important` beats the equal-specificity base `.row-body .row-{name,meta}` rules that follow in
    // source order; without it the `--on-active` tokens never apply and the name/meta keep base colours.
    .row-name {
      color: var(--on-active, var(--primary-hover-text)) !important;
    }
    .row-meta {
      color: var(--on-active, var(--default)) !important;
    }
    .row-pin {
      color: color-mix(in srgb, var(--on-active, #fff) 65%, transparent) !important;

      &.is-pinned {
        color: var(--on-active, var(--primary-hover-text)) !important;
      }
    }
  }

  .row-badge {
    // The row has its own pin toggle, so ClusterIconMenu's pin overlay on the chip is redundant here —
    // hidden via :show-pin="false".
    flex: 0 0 auto;
  }

  .row-body {
    flex: 1 1 auto;
    min-width: 0;

    .row-name {
      font-size: 13px;
      font-weight: 600;
      line-height: 16px;
      color: var(--body-text);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .row-meta {
      font-size: 10px;
      line-height: 12px;
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
