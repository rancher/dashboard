<script setup lang="ts">
import { onMounted } from 'vue';
import { BOTTOM, CENTER, LEFT, RIGHT } from '@shell/utils/position';
import useDragHandler from './composables/useDragHandler';
import { Z_INDEX } from './constants';

/**
 * This component is responsible for rendering the pin area used during tab dragging.
 *
 * Behavior:
 * - Enable drag areas for each position (left, right, bottom, center) when dragging is active.
 * - Highlights the area where the tab can be pinned.
 * - Uses z-index variables to ensure proper layering of drag areas.
 */

const {
  dragOverPositionsActive, pin, pinArea, lockedPositions, onDragPositionOver
} = useDragHandler();

onMounted(() => {
  Object.keys(Z_INDEX).forEach((key) => {
    document.documentElement.style.setProperty(
      `--drag-area-${ key.toLowerCase().replaceAll('_', '-') }-z-index`, (Z_INDEX as any)[key].toString()
    );
  });
});
</script>

<template>
  <div
    v-if="dragOverPositionsActive"
    class="pin-area-container"
  >
    <span
      v-if="pinArea != pin"
      class="pin-effect-area"
      :class="pinArea"
    />
    <span
      class="drag-area center"
      @dragover="onDragPositionOver($event, CENTER)"
    />
    <span
      v-if="!lockedPositions.includes(RIGHT)"
      class="drag-area right"
      @dragover="onDragPositionOver($event, RIGHT)"
    />
    <span
      v-if="!lockedPositions.includes(LEFT)"
      class="drag-area left"
      @dragover="onDragPositionOver($event, LEFT)"
    />
    <span
      v-if="!lockedPositions.includes(BOTTOM)"
      class="drag-area bottom"
      @dragover="onDragPositionOver($event, BOTTOM)"
    />
  </div>
</template>

<style lang='scss' scoped>
  .pin-area-container {
    display: contents;
  }

  .pin-effect-area {
    position: absolute;
    z-index: var(--drag-area-pin-effect-z-index);
    width: 0;
    height: 0;
    border-style: hidden;

    &.right {
      top: 55px;
      right: 0;
      width: 300px;
      transition: width .5s ease;
      height: 100%;
      background-image: linear-gradient(to right, var(--drag-over-outer-bg), var(--drag-over-inner-bg));
      border-left: 1px;
      border-style: hidden hidden hidden dashed;
    }

    &.left {
      top: 55px;
      left: 0;
      width: 300px;
      transition: width .5s ease;
      height: 100%;
      background-image: linear-gradient(to left, var(--drag-over-outer-bg), var(--drag-over-inner-bg));
      border-right: 1px;
      border-style: hidden dashed hidden hidden;
    }

    &.bottom {
      bottom: 0;
      height: 270px;
      transition: height .5s ease;
      width: 100%;
      background-image: linear-gradient(to top, var(--drag-over-inner-bg), var(--drag-over-outer-bg));
      border-top: 1px;
      border-style: dashed hidden hidden hidden;
    }

    &.center {
      width: 0;
      height: 0;
    }
  }

  .drag-area {
    position: absolute;
    width: 0;
    height: 0;
    opacity: 0;

    &.center {
      top: 0;
      right: 0;
      width: 100%;
      height: 100%;
      z-index: var(--drag-area-center-z-index);
    }

    &.right {
      top: 55px;
      right: 0;
      width: 300px;
      height: 100%;
      z-index: var(--drag-area-right-z-index);
    }

    &.left {
      top: 55px;
      left: 0;
      width: 300px;
      height: 100%;
      z-index: var(--drag-area-left-z-index);
    }

    &.bottom {
      bottom: 0;
      height: 270px;
      width: 100%;
      z-index: var(--drag-area-bottom-z-index);
    }
  }
</style>
