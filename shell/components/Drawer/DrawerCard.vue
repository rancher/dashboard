<script setup lang="ts">
</script>

<template>
  <div class="drawer-card">
    <slot />
  </div>
</template>

<style lang="scss" scoped>
.drawer-card {
  background-color: var(--body-bg);
  border-radius: var(--border-radius-md);
  padding: 16px;
  max-width: 100%;
  width: 100%;
  position: relative;
}
</style>
