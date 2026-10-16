<script setup lang="ts">
import { computed } from 'vue';
import { useStore } from 'vuex';
import { RcButton } from '@components/RcButton';
import { useI18n } from '@shell/composables/useI18n';

interface ClusterRow {
  id?: string;
  canExplore?: boolean;
}

const props = defineProps<{ row: ClusterRow }>();

const store = useStore();
const { t } = useI18n(store);

const to = computed(() => ({ name: 'c-cluster', params: { cluster: props.row?.id } }));
</script>

<template>
  <rc-button
    v-if="row.canExplore"
    variant="secondary"
    data-testid="cluster-manager-list-explore-management"
    :to="to"
  >
    {{ t('cluster.explore') }}
  </rc-button>
  <rc-button
    v-else
    variant="secondary"
    data-testid="cluster-manager-list-explore"
    :disabled="true"
  >
    {{ t('cluster.explore') }}
  </rc-button>
</template>
