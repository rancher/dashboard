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
  // Same two colours the app bar and the cluster title give the pin, so one control reads as one
  // control wherever it is: primary once pinned, muted while it is only on offer. `!important`
  // because the control sets `color: inherit` and a name cell inherits the row's link colour.
  .cluster-row-pin {
    margin-left: 6px;
    opacity: 0;
    color: var(--muted) !important;
    transition: opacity 0.1s ease;

    &.is-pinned {
      opacity: 1;
      color: var(--primary) !important;
    }

    &:focus-visible {
      opacity: 1;
    }
  }

  td:hover .cluster-row-pin {
    opacity: 1;
  }
</style>
