<script setup lang="ts">
import { computed } from 'vue';
import Pinned from '@shell/components/nav/Pinned.vue';
import { pinnableCluster } from '@shell/utils/cluster';

interface Props {
  /** A cluster list row: either a management or a provisioning cluster. */
  cluster: any;
}

const props = defineProps<Props>();

const pinnable = computed(() => pinnableCluster(props.cluster));
</script>

<template>
  <Pinned
    v-if="pinnable"
    :cluster="pinnable"
    class="cluster-row-pin"
    data-testid="cluster-row-pin"
  />
</template>

<style lang="scss" scoped>
  // Pinned is the state, so it stays on screen; the empty pin is an offer, so it waits for the cell
  // the way the switcher's rows do — and for the keyboard, which has no hover to make it with.
  .cluster-row-pin {
    margin-left: 6px;
    opacity: 0;
    transition: opacity 0.1s ease;

    &.is-pinned,
    &:focus-visible {
      opacity: 1;
    }
  }

  td:hover .cluster-row-pin {
    opacity: 1;
  }
</style>
