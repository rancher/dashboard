<script setup lang="ts">
import ResourceUsage from '@shell/components/Resource/Detail/Card/ResourceUsage/index.vue';
</script>

<template>
  <ResourceUsage
    :title="`Pods`"
    :used="9"
    :available="17"
  />
</template>
