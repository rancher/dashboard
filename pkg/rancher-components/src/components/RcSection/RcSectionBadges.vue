<script setup lang="ts">
import RcStatusBadge from '@components/Pill/RcStatusBadge';

defineProps<{
  badges: { label: string; status: 'info' | 'success' | 'warning' | 'error' | 'unknown' | 'none' }[];
}>();
</script>

<template>
  <RcStatusBadge
    v-for="(badge, i) in badges"
    :key="i"
    :status="badge.status"
  >
    {{ badge.label }}
  </RcStatusBadge>
</template>
