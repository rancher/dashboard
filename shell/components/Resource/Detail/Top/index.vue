<script setup lang="ts">
</script>

<template>
  <div class="resource-detail-page-top">
    <div
      v-if="$slots['header']"
      class="header"
    >
      <slot name="header" />
    </div>
    <div
      v-if="$slots['system-messages']"
      class="system-messages"
    >
      <slot name="system-messages" />
    </div>
    <div
      v-if="$slots['metadata']"
      class="metadata"
    >
      <slot name="metadata" />
    </div>
    <div
      v-if="$slots['extension-content']"
      class="extension-content"
    >
      <slot name="extension-content" />
    </div>
  </div>
</template>

<style lang="scss" scoped>
</style>
