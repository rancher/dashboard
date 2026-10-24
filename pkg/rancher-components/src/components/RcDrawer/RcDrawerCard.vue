<script setup lang="ts">
/**
 * Sets a form or a table in an `RcDrawer` body apart as a panel of its own on
 * the drawer's tinted body.
 */
</script>

<template>
  <div class="rc-drawer-card">
    <!-- @slot The section's content. -->
    <slot />
  </div>
</template>

<style lang="scss" scoped>
.rc-drawer-card {
  position: relative;
  width: 100%;
  max-width: 100%;
  padding: 16px;
  background-color: var(--body-bg);
  border-radius: var(--border-radius-md);
}
</style>
