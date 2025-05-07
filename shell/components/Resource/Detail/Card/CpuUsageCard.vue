<script setup lang="ts">
import ResourceUsage from '@shell/components/Resource/Detail/Card/ResourceUsage/index.vue';
</script>

<template>
  <ResourceUsage
    :title="`CPU`"
    :used="1.20"
    :available="1.93"
  />
</template>
