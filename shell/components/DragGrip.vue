<script setup lang="ts">
/**
 * The handle a row is dragged by to reorder a list (see `useDragReorder`). Listen for `mousedown` on it to start the drag
 */
</script>

<template>
  <span
    class="drag-grip"
    aria-hidden="true"
  />
</template>

<style lang="scss" scoped>
  // The icon font has no grip glyph
  .drag-grip {
    position: relative;
    display: inline-block;
    // The lock icon's width, so labels after a grip or a lock start in the same place
    width: 14px;
    height: 12px;
    color: var(--muted);
    cursor: grab;

    &::before,
    &::after {
      content: '';
      position: absolute;
      left: 1px;
      right: 1px;
      height: 1.5px;
      border-radius: 1px;
      background: currentColor;
    }

    &::before { top: 3.5px; }
    &::after { top: 7px; }
  }
</style>
