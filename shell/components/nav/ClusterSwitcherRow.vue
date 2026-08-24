<script setup lang="ts">
import { computed } from 'vue';
import { useStore } from 'vuex';
import { useI18n } from '@shell/composables/useI18n';
import ClusterIconMenu from '@shell/components/ClusterIconMenu.vue';
import Pinned from '@shell/components/nav/Pinned.vue';
import type { TopLevelMenuCluster } from '@shell/components/nav/TopLevelMenu.helper';

/**
 * A single cluster row in the cluster-switcher flyout (SURE-8192 / #11043).
 *
 * Layout mirrors the Figma switcher rows: badge · name · (distro · k8s · current) · status pill · pin.
 * Clicking the row (or pressing Enter while it is active) EXPLORES the cluster; the pin toggle is the
 * only pin/unpin affordance and mutates the pref directly via the reused `Pinned` control.
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
}

const props = withDefaults(defineProps<Props>(), {
  id:       undefined,
  active:   false,
  current:  false,
  subtitle: '',
  pinnable: true,
});

const emit = defineEmits(['select', 'hover']);

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

const showStatus = computed(() => {
  return !!props.cluster.transitioning && !!props.cluster.stateDisplay;
});

// A single, concise label for screen readers: the badge is decorative and the pin is a separate control,
// so the option should announce just "<name>, <provider · version · current>, <state>". SURE-8192 (v2).
const ariaLabel = computed(() => {
  const parts = [props.cluster.label];

  if (meta.value) {
    parts.push(meta.value);
  }
  if (showStatus.value) {
    parts.push(props.cluster.stateDisplay);
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
    @mousemove="emit('hover')"
  >
    <ClusterIconMenu
      :cluster="cluster"
      class="row-badge"
      :show-pin="false"
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
    <span
      v-if="showStatus"
      class="row-status"
      :style="cluster.stateColor ? { color: cluster.stateColor } : null"
    >
      {{ cluster.stateDisplay }}
    </span>
    <Pinned
      v-if="pinnable"
      :cluster="cluster"
      class="row-pin"
      :class="{ 'is-pinned': cluster.pinned }"
    />
  </div>
</template>

<style lang="scss" scoped>
// Row action icons (gear + pin): a header-style hover "square" — a 22×22 box holding an icon that fills
// with a subtle grey on hover. Icon size varies (gear 16px, pin 9px). SURE-8192 (v2).
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
  // Full-line, edge-to-edge, no rounding. No row divider (v2 — the flyout has no lines). Height matches
  // the expanded-nav rows (43px). SURE-8192.
  min-height: 43px;
  padding: 9px 14px 9px 14px;
  border-radius: 0;
  cursor: pointer;

  &.disabled {
    cursor: default;
    opacity: 0.55;
  }

  // Hover / keyboard cursor — full-width neutral highlight.
  &.active {
    background: color-mix(in srgb, var(--body-text) 6%, transparent);
  }

  // The cluster currently being explored — a FILLED primary row with white content (matches the
  // expanded nav's active row). SURE-8192 (v2).
  &.current {
    background: var(--active-nav, var(--primary-hover-bg));

    &.active,
    &:hover {
      background: var(--active-hover, var(--primary-hover-bg));
    }

    // Name + meta use the SAME theme tokens as the expanded-nav active row (`--on-active` — the
    // on-primary text colour that flips per theme: light text on the light-mode dark-green fill, dark
    // text on the dark-mode light-green fill). The `!important` beats the equal-specificity base
    // `.row-body .row-{name,meta}` rules that follow in source order (without it the tokens never apply
    // and the name stays black / the meta stays muted). SURE-8192 (v2).
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
    // Pinned-ness is shown by the row's own pin toggle, so ClusterIconMenu's pin overlay on the chip
    // is redundant in the flyout — hidden via :show-pin="false" (no scoped-style piercing). SURE-8192.
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

  .row-status {
    flex: 0 0 auto;
    font-size: 12px;
    font-weight: 600;
    color: var(--warning);
  }

  // The pin: 22×22 hover square with a 9px icon. Grey when not pinned, primary when pinned; faint until
  // hover/active or while pinned (relocation is the feedback). SURE-8192 (v2).
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
