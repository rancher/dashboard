<script setup lang="ts">
import { computed } from 'vue';
import Pinned from '@shell/components/nav/Pinned.vue';
import { pinnableCluster } from '@shell/utils/cluster';

interface Props {
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
  // Matched on `.icon` too, to outweigh the control's own `color: inherit` on specificity.
  .cluster-row-pin.icon {
    margin-left: 8px;
    // A button's 40px min-height would set the name line's height and push the description down.
    min-height: 0;
    opacity: 0;
    color: var(--muted);
    transition: opacity 0.1s ease;

    &.is-pinned {
      opacity: 1;
      color: var(--primary);
    }

    &:focus-visible {
      opacity: 1;
    }
  }

  td:hover .cluster-row-pin {
    opacity: 1;
  }
</style>
