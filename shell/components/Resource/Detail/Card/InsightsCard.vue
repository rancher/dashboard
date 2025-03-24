<script setup lang="ts">
import ResourceStateCard from '@shell/components/Resource/Detail/Card/ResourceStateCard.vue';

const rows = [
  {
    label:  'Services',
    to:     '#',
    color:  'var(--error)',
    counts: [{ label: 'failed', count: 1 }, { label: 'passed', count: 6 }]
  },
  {
    label:  'Referred to by',
    to:     '#',
    color:  'var(--warning)',
    counts: [{ label: 'warning', count: 1 }, { label: 'normal', count: 24 }]
  }
];
</script>

<template>
  <ResourceStateCard
    title="Insights"
    :rows="rows"
  />
</template>
