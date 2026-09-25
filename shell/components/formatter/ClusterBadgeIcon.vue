<script setup lang="ts">
import { computed } from 'vue';
import { useStore } from 'vuex';
import { useI18n } from '@shell/composables/useI18n';
import ClusterIconMenu from '@shell/components/ClusterIconMenu.vue';
import { abbreviateClusterName, clusterChip } from '@shell/utils/cluster';

interface Props {
  /** A cluster list row: either a management or a provisioning cluster. */
  row: any;
}

const props = defineProps<Props>();

const store = useStore();
const { t } = useI18n(store);

// The chip the app bar renders, on a table row. Pinned-ness is shown by the name column's own
// toggle, so the chip's pin overlay would say it twice.
const cluster = computed(() => clusterChip(props.row));

// The chip is the cell's only content, so it has to carry the cell's name: a custom icon text says
// something the name column does not, and without a name the column reads as empty cells under a
// header that claims to describe them.
const label = computed(() => {
  const { badge, isLocal, label: name } = cluster.value;
  const text = badge?.iconText || (isLocal ? '' : abbreviateClusterName(name));

  // The chip draws its text uppercase, so the name says what is on screen rather than the raw value.
  return text ? text.toUpperCase() : t('nav.ariaLabel.localClusterIcon');
});
</script>

<template>
  <ClusterIconMenu
    :cluster="cluster"
    :show-pin="false"
    class="cluster-badge-icon"
    role="img"
    :aria-label="label"
  />
</template>

<style lang="scss" scoped>
  .cluster-badge-icon {
    display: inline-flex;
  }
</style>
