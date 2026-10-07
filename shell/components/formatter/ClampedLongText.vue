<script setup lang="ts">
/**
 * Long text, eg a description, that wraps onto at most three lines, between 100px and 300px wide,
 * ending in an ellipsis when it doesn't fit. Its whole text is offered as a tooltip only then
 */
import {
  nextTick, onBeforeUnmount, onMounted, ref, watch
} from 'vue';

const props = withDefaults(defineProps<{ value?: string | null }>(), { value: '' });

const text = ref<HTMLElement | null>(null);

const cut = ref(false);

/** Wrapped onto more lines than are shown, or a word too long for the widest line */
const measure = () => {
  const el = text.value;

  cut.value = !!el && (el.scrollHeight > el.clientHeight + 1 || el.scrollWidth > el.clientWidth + 1);
};

let observer: ResizeObserver | null = null;

onMounted(() => {
  measure();

  // The column's width follows the window and its neighbours, and with it the lines the text takes
  if (text.value && typeof ResizeObserver !== 'undefined') {
    observer = new ResizeObserver(measure);
    observer.observe(text.value);
  }
});

watch(() => props.value, () => nextTick(measure));

onBeforeUnmount(() => observer?.disconnect());
</script>

<template>
  <span
    ref="text"
    v-clean-tooltip="{ content: cut ? value || '' : '', placement: 'auto', popperClass: ['clamped-long-text-tooltip'] }"
    class="clamped-long-text"
  >{{ value }}</span>
</template>

<style lang="scss" scoped>
  .clamped-long-text {
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 3;
    line-clamp: 3;
    overflow: hidden;
    min-width: 100px;
    max-width: 300px;
    white-space: normal;
    overflow-wrap: anywhere;
  }
</style>

<style lang="scss">
  .clamped-long-text-tooltip {
    overflow-wrap: break-word;
  }
</style>
