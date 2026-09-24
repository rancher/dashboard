<script setup lang="ts">
import { computed } from 'vue';
import ClusterIconMenu from '@shell/components/ClusterIconMenu.vue';
import { clusterChip } from '@shell/utils/cluster';

interface Props {
  /** A cluster list row: either a management or a provisioning cluster. */
  row: any;
}

const props = defineProps<Props>();

// The chip the app bar renders, on a table row. Pinned-ness is shown by the name column's own
// toggle, so the chip's pin overlay would say it twice.
const cluster = computed(() => clusterChip(props.row));
</script>

<template>
  <ClusterIconMenu
    :cluster="cluster"
    :show-pin="false"
    class="cluster-badge-icon"
    aria-hidden="true"
  />
</template>

<style lang="scss" scoped>
  .cluster-badge-icon {
    display: inline-flex;
  }
</style>
