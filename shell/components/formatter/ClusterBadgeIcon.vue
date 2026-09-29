<script setup lang="ts">
import { computed } from 'vue';
import { useStore } from 'vuex';
import { useI18n } from '@shell/composables/useI18n';
import ClusterIconMenu from '@shell/components/ClusterIconMenu.vue';
import { abbreviateClusterName, clusterChip } from '@shell/utils/cluster';

interface Props {
  row: any;
}

const props = defineProps<Props>();

const store = useStore();
const { t } = useI18n(store);

const cluster = computed(() => clusterChip(props.row));

// The chip is the cell's only content, so without a name the column reads as empty cells.
const label = computed(() => {
  const { badge, isLocal, label: name } = cluster.value;
  const text = badge?.iconText || (isLocal ? '' : abbreviateClusterName(name));

  // The chip draws its text uppercase.
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
