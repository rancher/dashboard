<script setup lang="ts">
import ResourceStateCard from '@shell/components/Resource/Detail/Card/ResourceStateCard.vue';

const rows = [
  {
    label:  'Services',
    to:     '#',
    color:  'var(--success)',
    counts: [{ label: 'active', count: 3 }]
  },
  { label: 'Ingresses' },
  {
    label:  'Referred to by',
    to:     '#',
    color:  'var(--error)',
    counts: [{ label: 'updating', count: 1 }, { label: 'active', count: 1 }]
  },
  {
    label:  'Refers to',
    to:     '#',
    color:  'var(--success)',
    counts: [{ label: 'active', count: 5 }]
  }
];
</script>

<template>
  <ResourceStateCard
    title="Resources"
    :rows="rows"
  />
</template>
