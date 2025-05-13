<script setup lang="ts">
import ResourceUsage from '@shell/components/Resource/Detail/Card/ResourceUsage/index.vue';
</script>

<template>
  <ResourceUsage
    :title="`Memory`"
    :used="870"
    :available="3290"
    :availableFormatter="(n) => (n/1000).toFixed(2)"
    :unit="`GiB`"
  />
</template>
