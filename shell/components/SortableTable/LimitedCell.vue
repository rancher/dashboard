<script setup lang="ts">
/**
 * A cell's content kept within its column's `minWidth`, `maxWidth` and `lineClamp`. The limits sit
 * on this box rather than the cell: browsers ignore a table cell's max width, and a cell can't be
 * clamped to lines. Text the lines cut is offered whole as a tooltip, and only then
 */
import {
  computed, onBeforeUnmount, onMounted, onUpdated, ref
} from 'vue';
import { observeCellResize } from '@shell/components/SortableTable/cell-resize';
import { escapeHtml } from '@shell/utils/string';

export interface CellLimits {
  minWidth?: number;
  maxWidth?: number;
  lineClamp?: number;
}

const props = defineProps<{ limits: CellLimits }>();

const box = ref<HTMLElement | null>(null);

const cutText = ref('');

const style = computed(() => ({
  minWidth:             props.limits.minWidth ? `${ props.limits.minWidth }px` : undefined,
  maxWidth:             props.limits.maxWidth ? `${ props.limits.maxWidth }px` : undefined,
  '-webkit-line-clamp': props.limits.lineClamp || undefined,
  lineClamp:            props.limits.lineClamp || undefined,
}));

/** Wrapped onto more lines than are shown, or a word too long for the widest line */
const measure = () => {
  const el = box.value;
  const cut = !!el && !!props.limits.lineClamp && (el.scrollHeight > el.clientHeight + 1 || el.scrollWidth > el.clientWidth + 1);

  // The tooltip draws HTML, and this is the cell's text
  cutText.value = cut ? escapeHtml((el?.textContent || '').trim()) : '';
};

let stopObserving = () => {};

onMounted(() => {
  measure();

  // The column's width follows the window and its neighbours, and with it the lines the text takes
  if (box.value) {
    stopObserving = observeCellResize(box.value, measure);
  }
});

onUpdated(measure);

onBeforeUnmount(() => stopObserving());
</script>

<template>
  <div
    ref="box"
    v-clean-tooltip="{ content: cutText, placement: 'auto', popperClass: ['limited-cell-tooltip'] }"
    class="limited-cell"
    :class="{ clamped: !!limits.lineClamp }"
    :style="style"
  >
    <slot />
  </div>
</template>

<style lang="scss" scoped>
  .limited-cell {
    overflow-wrap: anywhere;

    &.clamped {
      display: -webkit-box;
      -webkit-box-orient: vertical;
      overflow: hidden;
      white-space: normal;
    }
  }
</style>

<style lang="scss">
  .limited-cell-tooltip {
    overflow-wrap: break-word;
  }
</style>
