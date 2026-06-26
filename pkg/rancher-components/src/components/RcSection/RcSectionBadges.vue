<script setup lang="ts">
import { computed } from 'vue';
import RcStatusBadge from '@components/Pill/RcStatusBadge';
import type { RcSectionBadgesProps } from './types';

const MAX_BADGES = 3;

const props = defineProps<RcSectionBadgesProps>();

const visibleBadges = computed(() => {
  if (props.badges.length > MAX_BADGES) {
    // eslint-disable-next-line no-console
    console.warn(`[RcSectionBadges]: Received ${ props.badges.length } badges but only ${ MAX_BADGES } are allowed. Extra badges will be hidden.`);
  }

  return props.badges.slice(0, MAX_BADGES);
});
</script>

<template>
  <RcStatusBadge
    v-for="(badge, i) in visibleBadges"
    :key="i"
    v-clean-tooltip="badge.tooltip"
    :status="badge.status"
  >
    {{ badge.label }}
  </RcStatusBadge>
</template>
