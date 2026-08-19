<script setup lang="ts">
/**
 * A raised card for content inside an `RcDrawer` body.
 *
 * The drawer body is deliberately tinted, so content sits on a card rather
 * than directly on it. Use one card per logical group.
 *
 * ```html
 * <RcDrawer :title="title">
 *   <template #body>
 *     <RcDrawerCard>
 *       ...
 *     </RcDrawerCard>
 *   </template>
 * </RcDrawer>
 * ```
 */
</script>

<template>
  <div class="rc-drawer-card">
    <slot />
  </div>
</template>

<style lang="scss" scoped>
.rc-drawer-card {
  background-color: var(--body-bg);
  border-radius: var(--border-radius-md);
  padding: 16px;
  max-width: 100%;
  // Spacing between cards belongs to the drawer body, not to the card.
  position: relative;
}
</style>
