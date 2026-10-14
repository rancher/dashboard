<script setup lang="ts">
/**
 * A section of an `RcDrawer` body: the drawer's tinted body shows each card as
 * a panel of its own.
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
