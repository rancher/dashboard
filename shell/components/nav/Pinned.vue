<script setup lang="ts">
// Allow the user to pin a cluster by clicking it.
import { computed } from 'vue';
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

function toggle(e: Event) {
  // Pop the pin (scale bounce) on toggle — matches the prototype's `pinpop`. Re-trigger by
  // removing + reflowing + re-adding the class. SURE-8192 (v2).
  const el = e?.currentTarget as HTMLElement | null;

  if (el) {
    el.classList.remove('pin-pop');
    el.getBoundingClientRect(); // force reflow so the animation restarts
    el.classList.add('pin-pop');
  }

  if (pinned.value) {
    props.cluster.unpin();
  } else {
    props.cluster.pin();
  }
}
</script>

<template>
  <i
    :tabindex="tabOrder"
    :aria-pressed="!!pinned"
    class="pin icon icon-pin"
    :class="{ 'is-pinned': pinned }"
    role="button"
    :aria-label="t('nav.ariaLabel.pinCluster', { cluster: cluster.label })"
    @click.stop.prevent="toggle"
    @keydown.enter.prevent="toggle"
    @keydown.space.prevent="toggle"
  />
</template>

<style lang="scss" scoped>
  // Matches the prototype's icon-button feel (all transforms keep the scaleX(-1) flip): slightly bigger
  // on hover, presses DOWN on click, and pops after the toggle. SURE-8192 (v2).
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
