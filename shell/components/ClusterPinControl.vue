<script setup lang="ts">
import { computed, nextTick, ref } from 'vue';
import { useStore } from 'vuex';
import { useI18n } from '@shell/composables/useI18n';
import Pinned from '@shell/components/nav/Pinned.vue';
import { pinnableCluster } from '@shell/utils/cluster';
import { isMac, shortcutLabel } from '@shell/utils/platform';

/**
 * Pin the cluster a page is about, from that page's own title.
 *
 * Every surface that offers the pin outside the nav uses this one control, so the write, the keyboard
 * shortcut, the tooltip and what a screen reader hears are the same wherever it appears.
 */
interface Props {
  /** The cluster to pin: a management or provisioning cluster. */
  cluster: any;
}

const props = defineProps<Props>();

const store = useStore();
const { t } = useI18n(store);

const pin = ref<any>(null);
const announcement = ref('');

// The cluster as the pin control wants it, or null when there is nothing to pin. `local` is excluded:
// it holds a fixed slot in the nav and is filtered out of PINNED, so a pin here would be an affordance
// with no effect.
const pinnable = computed(() => pinnableCluster(props.cluster));

// Cmd+Shift+P on a Mac, Alt+P elsewhere. Bound `.anywhere`, so it works from a text field too — a
// filter box holding the caret is no reason not to pin the cluster you are looking at. The switcher
// flyout binds the same combo to the row under its cursor and silences shortcuts while it is open, so
// the two never both fire.
const shortcutKeys = { windows: ['alt', 'p'], mac: ['meta', 'shift', 'p'] };
const shortcut = computed(() => shortcutLabel(isMac ? ['⌘', 'Shift', 'P'] : ['Alt', 'P']));
// The same shortcut in the form `aria-keyshortcuts` is defined to take.
const ariaShortcut = isMac ? 'Meta+Shift+P' : 'Alt+P';

const tooltip = computed(() => {
  if (!pinnable.value) {
    return null;
  }

  return t(pinnable.value.pinned ? 'nav.header.unpinCluster' : 'nav.header.pinCluster', { shortcut: shortcut.value });
});

// The shortcut toggles THROUGH the control rather than writing the pref itself: one path for the write,
// the growl on failure and the pop, so the icon reacts to the shortcut exactly as it does to a click.
function onShortcut() {
  pin.value?.toggle();
}

/**
 * Only when the pin does NOT have focus: a focused toggle reports itself through `aria-pressed`, and
 * announcing as well would say it twice. Clearing first lets the same message repeat.
 */
function announce(cluster: { label: string }, pinned: boolean) {
  if (pin.value?.$el === document.activeElement) {
    return;
  }

  const message = t(pinned ? 'nav.switcher.aria.pinnedCluster' : 'nav.switcher.aria.unpinnedCluster', { cluster: cluster.label });

  announcement.value = '';
  nextTick(() => {
    announcement.value = message;
  });
}

defineExpose({
  pinnable, tooltip, shortcutKeys, shortcut, ariaShortcut, announcement, onShortcut, announce
});
</script>

<template>
  <Pinned
    v-if="pinnable"
    ref="pin"
    v-clean-tooltip="tooltip"
    v-shortkey.anywhere="shortcutKeys"
    :cluster="pinnable"
    :tab-order="0"
    class="cluster-pin"
    :aria-keyshortcuts="ariaShortcut"
    @shortkey="onShortcut"
    @pinned="announce($event, true)"
    @unpinned="announce($event, false)"
  />
  <div
    class="sr-only"
    role="status"
    aria-live="polite"
  >
    {{ announcement }}
  </div>
</template>

<style lang="scss" scoped>
  // Matched on the control's own `.icon` class as well, which outweighs its `color: inherit` — on one
  // class each the two rules tie and a stylesheet re-order would quietly hand the pin back to inherit.
  .cluster-pin.icon {
    flex: 0 0 auto;
    margin-left: 12px;
    color: var(--muted);
    // Buttons carry a 40px min-height, which on a title row is taller than the heading and would set
    // the row's height — pushing the title, and the page under it, down. Sized to the heading instead.
    min-height: 0;
    height: 28px;

    &.is-pinned {
      color: var(--primary);
    }
  }
</style>
