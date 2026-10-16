<script setup lang="ts">
import { computed } from 'vue';
import { Banner } from '@components/Banner';
import { FLEET } from '@shell/config/labels-annotations';

const props = defineProps<{ resource?: { metadata?: { labels?: Record<string, string> } } }>();

const isFleetManaged = computed(() => !!props.resource?.metadata?.labels?.[FLEET.MANAGED_BY_KIND]);
</script>

<template>
  <Banner
    v-if="isFleetManaged"
    color="info"
    label-key="resourceDetail.masthead.fleetManaged"
    data-testid="fleet-managed-banner"
  />
</template>
