<script setup lang="ts">
import { onMounted } from 'vue';
import { BOTTOM, CENTER, LEFT, RIGHT } from '@shell/utils/position';
import useDragHandler from './composables/useDragHandler';

const {
  dragOverPositionsActive, pin, zone, onDragPositionOver
} = useDragHandler();

onMounted(() => {
  const Z_INDEX = {
    WM:         1000,
    PIN_EFFECT: 996,
    RIGHT:      999,
    LEFT:       999,
    BOTTOM:     998,
    CENTER:     997,
  };

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
      v-if="zone != pin"
      class="pin-effect-area"
      :class="zone"
    />
    <span
      class="drag-area center"
      @dragover="onDragPositionOver($event, CENTER)"
    />
    <span
      class="drag-area right"
      @dragover="onDragPositionOver($event, RIGHT)"
    />
    <span
      class="drag-area left"
      @dragover="onDragPositionOver($event, LEFT)"
    />
    <span
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
