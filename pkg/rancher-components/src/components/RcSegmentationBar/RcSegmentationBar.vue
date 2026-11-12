<script setup lang="ts">
/**
 * A horizontal bar showing how a total splits across status values or severity levels. Each
 * segment's width is proportional to its value, and the visible segments always cover the whole
 * bar. It is exposed to assistive technology as a single image whose name summarizes the segments.
 *
 * Example:
 *
 * <RcSegmentationBar
 *   :segments="[
 *     { value: 2, color: 'error', label: t('generic.error') },
 *     { value: 5, color: 'success', label: t('generic.success') },
 *   ]"
 *   size="medium"
 * />
 */
import { computed } from 'vue';
import { useStore } from 'vuex';
import { useI18n } from '@shell/composables/useI18n';
import { barColorValue } from '@components/utils/barColors';
import type { RcSegmentationBarProps } from './types';

const props = withDefaults(defineProps<RcSegmentationBarProps>(), {
  size:      'small',
  ariaLabel: undefined,
});

const store = useStore();
const { t } = useI18n(store);

const renderedSegments = computed(() => {
  const segments = props.segments.map((segment, index) => ({
    ...segment, index, visible: Number.isFinite(segment.value) && segment.value > 0
  }));
  const visible = segments.filter(({ visible }) => visible);
  const largest = Math.max(...visible.map(({ value }) => value));
  const total = visible.reduce((sum, { value }) => sum + value / largest, 0);

  return segments.map((segment) => ({ ...segment, share: segment.visible ? (segment.value / largest / total) * 100 : 0 }));
});

const visibleSegments = computed(() => renderedSegments.value.filter(({ visible }) => visible));

const summary = computed(() => {
  const locale = store?.getters?.['i18n/current']?.();
  const parts = visibleSegments.value.map(({ label, value }) => t('component.rcSegmentationBar.segment', { label, value }, true));

  return listFormat(locale).format(parts);
});

function listFormat(locale?: string): Intl.ListFormat {
  const options: Intl.ListFormatOptions = { style: 'short', type: 'unit' };

  try {
    return new Intl.ListFormat(locale, options);
  } catch {
    return new Intl.ListFormat(undefined, options);
  }
}

const accessibleName = computed(() => props.ariaLabel || summary.value);
</script>

<template>
  <div
    class="rc-segmentation-bar"
    :class="[props.size, { empty: !visibleSegments.length }]"
    :role="accessibleName ? 'img' : undefined"
    :aria-label="accessibleName || undefined"
    :aria-hidden="accessibleName ? undefined : 'true'"
  >
    <div
      v-for="segment in renderedSegments"
      :key="segment.index"
      class="segment"
      :class="{ empty: !segment.visible }"
      :data-testid="`rc-segmentation-bar-segment-${ segment.index }`"
      :style="{ flexGrow: segment.share, '--segment-color': barColorValue(segment.color) }"
    />
  </div>
</template>

<style lang="scss" scoped>
.rc-segmentation-bar {
  display: flex;
  width: 100%;
  height: 4px;
  border-radius: 4px;
  overflow: hidden;

  @media (prefers-reduced-motion: no-preference) {
    transition: background-color 0.3s ease;
  }

  &.empty {
    background-color: var(--rc-bar-track);
  }

  &.medium {
    height: 7px;
  }
}

.segment {
  flex-shrink: 1;
  flex-basis: 0;
  min-width: 0;
  background-color: var(--segment-color);

  @media (prefers-reduced-motion: no-preference) {
    transition: flex-grow 0.3s ease, margin-inline-start 0.3s ease, min-width 0.3s ease;
  }

  @media (forced-colors: active) {
    forced-color-adjust: none;
  }

  &:not(.empty) {
    min-width: 1px;
  }

  &:not(.empty) ~ &:not(.empty) {
    margin-inline-start: 1px;
  }
}
</style>
