<script setup lang="ts">
/**
 * A horizontal bar showing how far a value has progressed between `min` and `max`, filled from
 * the left. It renders `role="progressbar"` with the current, minimum and maximum values. Give it
 * an accessible name with `aria-label` or `aria-labelledby`.
 *
 * Example:
 *
 * <RcProgressBar
 *   :value="3"
 *   :max="8"
 *   :aria-label="t('cluster.nodes.ready')"
 *   aria-valuetext="3 of 8"
 * />
 */
import { computed } from 'vue';
import { barColorValue } from '@components/utils/barColors';
import type { RcProgressBarProps } from './types';

const props = withDefaults(defineProps<RcProgressBarProps>(), {
  min:           0,
  max:           100,
  size:          'small',
  color:         'info',
  active:        false,
  ariaLabel:     undefined,
  ariaValuetext: undefined,
});

const valueMin = computed(() => (Number.isFinite(props.min) ? props.min : 0));

const valueMax = computed(() => (Number.isFinite(props.max) ? Math.max(props.max, valueMin.value) : valueMin.value));

const valueNow = computed(() => {
  if (Number.isNaN(props.value)) {
    return valueMin.value;
  }

  return Math.min(Math.max(props.value, valueMin.value), valueMax.value);
});

const percent = computed(() => {
  const range = valueMax.value - valueMin.value;

  return range > 0 ? ((valueNow.value - valueMin.value) / range) * 100 : 0;
});

const fillStyle = computed(() => ({
  width:          `${ percent.value }%`,
  '--fill-color': barColorValue(props.color),
}));
</script>

<template>
  <div
    class="rc-progress-bar"
    :class="[props.size, { active: props.active }]"
    role="progressbar"
    :aria-busy="props.active ? 'true' : undefined"
    :aria-label="props.ariaLabel"
    :aria-valuenow="valueNow"
    :aria-valuemin="valueMin"
    :aria-valuemax="valueMax"
    :aria-valuetext="props.ariaValuetext"
  >
    <div
      class="fill"
      :style="fillStyle"
    />
  </div>
</template>

<style lang="scss" scoped>
.rc-progress-bar {
  width: 100%;
  height: 4px;
  border-radius: 4px;
  overflow: hidden;
  background-color: var(--rc-bar-track);

  &.medium {
    height: 7px;
  }
}

.fill {
  position: relative;
  height: 100%;
  overflow: hidden;
  background-color: var(--fill-color);

  @media (prefers-reduced-motion: no-preference) {
    transition: width 0.3s ease, background-color 0.3s ease;
  }

  @media (forced-colors: active) {
    forced-color-adjust: none;
  }
}

@media (prefers-reduced-motion: no-preference) {
  .active .fill::after {
    content: '';
    position: absolute;
    inset: 0;
    background-image: linear-gradient(90deg, transparent, var(--rc-bar-active-sweep), transparent);
    animation: rc-progress-bar-sweep 1.5s ease-in-out infinite;

    &:dir(rtl) {
      animation-direction: reverse;
    }
  }
}

@keyframes rc-progress-bar-sweep {
  from {
    transform: translateX(-100%);
  }

  to {
    transform: translateX(100%);
  }
}
</style>
