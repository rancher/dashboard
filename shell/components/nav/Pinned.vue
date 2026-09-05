<script setup lang="ts">
// Allow the user to pin a cluster by clicking it.
import { computed, nextTick, ref } from 'vue';
import { useStore } from 'vuex';
import { useI18n } from '@shell/composables/useI18n';

interface PinnableCluster {
  pinned: boolean;
  label: string;
  pin: () => void;
  unpin: () => void;
}

interface Props {
  cluster: PinnableCluster;
  /** tabindex for the toggle (-1 removes it from the tab order on the collapsed rail; omit to leave unset). */
  tabOrder?: number;
}

const props = defineProps<Props>();

const store = useStore();
const { t } = useI18n(store);

const pinned = computed(() => props.cluster.pinned);

// Restart the one-shot pop animation on each toggle: clear the class, wait a tick so Vue drops it from the
// DOM, then re-add so the animation replays — keeps the retrigger reactive with no direct DOM manipulation.
const popping = ref(false);

async function toggle() {
  if (pinned.value) {
    props.cluster.unpin();
  } else {
    props.cluster.pin();
  }

  popping.value = false;
  await nextTick();
  popping.value = true;
}
</script>

<template>
  <i
    :tabindex="tabOrder"
    :aria-pressed="!!pinned"
    class="pin icon icon-pin"
    :class="{ 'is-pinned': pinned, 'pin-pop': popping }"
    role="button"
    :aria-label="t('nav.ariaLabel.pinCluster', { cluster: cluster.label })"
    @click.stop.prevent="toggle"
    @keydown.enter.prevent="toggle"
    @keydown.space.prevent="toggle"
    @animationend="popping = false"
  />
</template>

<style lang="scss" scoped>
  // Every transform keeps the scaleX(-1) flip: bigger on hover, presses down on click, pops after toggle.
  .icon {
    font-size: 14px;
    transform: scaleX(-1);
    transition: transform 0.1s ease;

    &:hover {
      transform: scaleX(-1) scale(1.12);
    }

    &:active {
      transform: scaleX(-1) scale(0.9);
    }
  }

  .pin-pop {
    animation: pin-pop 0.18s ease-out;
  }

  @keyframes pin-pop {
    0% {
      transform: scaleX(-1) scale(1);
    }

    55% {
      transform: scaleX(-1) scale(1.3);
    }

    100% {
      transform: scaleX(-1) scale(1);
    }
  }
</style>
