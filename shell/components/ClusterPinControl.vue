<script setup lang="ts">
import { computed, nextTick, ref } from 'vue';
import { useStore } from 'vuex';
import { useI18n } from '@shell/composables/useI18n';
import Pinned from '@shell/components/nav/Pinned.vue';
import { pinnableCluster } from '@shell/utils/cluster';
import { isMac, shortcutLabel } from '@shell/utils/platform';

interface Props {
  cluster: any;
}

const props = defineProps<Props>();

const store = useStore();
const { t } = useI18n(store);

const pin = ref<any>(null);
const announcement = ref('');

const pinnable = computed(() => pinnableCluster(props.cluster));

// Bound `.anywhere`: a filter box holding the caret is no reason not to pin the cluster on screen. The
// switcher flyout takes the same combo but silences shortcuts while it is open, so the two never clash.
const shortcutKeys = { windows: ['alt', 'p'], mac: ['meta', 'shift', 'p'] };
const shortcut = computed(() => shortcutLabel(isMac ? ['⌘', 'Shift', 'P'] : ['Alt', 'P']));
const ariaShortcut = isMac ? 'Meta+Shift+P' : 'Alt+P';

const tooltip = computed(() => {
  if (!pinnable.value) {
    return null;
  }

  return t(pinnable.value.pinned ? 'nav.header.unpinCluster' : 'nav.header.pinCluster', { shortcut: shortcut.value });
});

function onShortcut() {
  pin.value?.toggle();
}

// Silent while the pin has focus: `aria-pressed` already says it, and announcing would say it twice.
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
  // Matched on `.icon` too, to outweigh the control's own `color: inherit` on specificity.
  .cluster-pin.icon {
    flex: 0 0 auto;
    margin-left: 12px;
    color: var(--muted);
    // A button's 40px min-height would set the title row's height and push the page down.
    min-height: 0;
    height: 28px;

    &.is-pinned {
      color: var(--primary);
    }
  }
</style>
