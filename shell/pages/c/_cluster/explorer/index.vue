<script lang="ts" setup>
import { useRoute } from 'vue-router';
import { computed } from 'vue';

import { LEGACY } from '@shell/config/query-params';
import ClusterDashboard from '@shell/pages/explorer/resource/detail/cluster-dashboard.vue';

const route = useRoute();

const isLegacy = computed(() => LEGACY in route.query);
const useLatest = computed(() => !!(!isLegacy.value));
</script>

<template>
  <ClusterDashboard
    v-if="useLatest"
  />
  <Legacy
    v-else
  />
</template>
