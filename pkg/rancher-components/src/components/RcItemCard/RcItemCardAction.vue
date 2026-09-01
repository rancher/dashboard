<script setup lang="ts">
/**
 * RcItemCardAction
 *
 * This component is used to wrap any interactive elements (like buttons, links)
 * inside an RcItemCard so they don't trigger the card-click event.
 *
 * Usage:
 *
 * <rc-item-card-action @click="doSomething">
 *   <a href="#">Click me</a>
 * </rc-item-card-action>
 *
 */
</script>

<template>
  <div
    item-card-action
    class="rc-item-card-action"
    data-testid="rc-item-card-action"
  >
    <slot />
  </div>
</template>

<style lang="scss">
.rc-item-card-action {
  .v-popper {
    .icon-actions {
      color: var(--body-text);
      font-size: 19px;
    }
  }
}
</style>
