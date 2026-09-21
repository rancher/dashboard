<script setup lang="ts">
import { computed } from 'vue';
import { useStore } from 'vuex';
import { parseSi } from '@shell/utils/units';
import { useI18n } from '@shell/composables/useI18n';

interface ClusterRow {
  mgmt?: ClusterRow;
  status?: { allocatable?: { cpu?: string } };
}

const props = defineProps<{ row: ClusterRow }>();

const store = useStore();
const { t } = useI18n(store);

// A provisioning cluster carries the numbers on its management cluster; a management one is it
const cluster = computed(() => props.row?.mgmt || props.row);
const cores = computed(() => parseSi(cluster.value?.status?.allocatable?.cpu));
</script>

<template>
  <span v-if="cores">{{ `${ cores } ${ t('landing.clusters.cores', { count: cores }) }` }}</span>
  <span v-else>&mdash;</span>
</template>
