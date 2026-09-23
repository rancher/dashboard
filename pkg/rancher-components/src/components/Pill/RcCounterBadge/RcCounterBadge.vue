<script setup lang="ts">
/**
 * A pill showing a count.
 *
 * Its colours resolve in three layers, each beating the one before it:
 *
 * 1. `type`, the neutral active/inactive colours, and the default.
 * 2. `status`, the status palette, read through the same `useStatusColors`
 *    composable RcStatusBadge reads it through.
 * 3. `backgroundColor` / `borderColor` / `textColor`, a full override taking
 *    any CSS colour. An escape hatch, strongly discouraged: it leaves the
 *    palette, so it does not follow a theme or a token change. Prefer a
 *    `status`, or a new status, over reaching for it.
 *
 * <RcCounterBadge :count="99" type="inactive" />
 * <RcCounterBadge :count="99" type="inactive" status="warning" :aria-label="t('...')" />
 * <RcCounterBadge :count="99" type="inactive" background-color="var(--rc-section-background-primary)" />
 *
 * An ancestor can set `--rc-counter-badge-inactive-background` and
 * `--rc-counter-badge-inactive-border` to change the fill and border of an
 * inactive badge below it. A badge's own `status` or colour props still win
 * over those.
 */
import { computed, watchEffect } from 'vue';
import { useStatusColors, type Status } from '@components/utils/status';
import { RcCounterBadgeProps } from './types';

const props = withDefaults(defineProps<RcCounterBadgeProps>(), { disabled: false });

if (process.env.NODE_ENV !== 'production') {
  watchEffect(() => {
    if (props.status && !props.ariaLabel) {
      console.warn('[RcCounterBadge]: `status` was set without an `ariaLabel`. The badge renders only a count, so nothing names what the status applies to.'); // eslint-disable-line no-console
    }
  });
}

const displayCount = computed(() => props.count < 1000 ? props.count : '999+');

const status = computed<Status>(() => props.status ?? 'none');
const statusColors = useStatusColors(status, 'outlined');

// The `type` layer, as the token each state would use on its own. Written as
// CSS so an ancestor can still reach the inactive fill.
const typeColors = computed(() => {
  const active = props.type === 'active';

  if (props.disabled) {
    return {
      background:  active ? 'var(--rc-active-disabled-background)' : 'var(--rc-inactive-background)',
      border:      active ? 'var(--rc-active-border)' : 'var(--rc-inactive-disabled-border)',
      text:        'var(--rc-disabled-text-color)',
      hoverBorder: active ? 'var(--rc-active-border)' : 'var(--rc-inactive-disabled-border)',
    };
  }

  const inactiveBorder = 'var(--rc-counter-badge-inactive-border, var(--rc-inactive-border))';

  return {
    background:  active ? 'var(--rc-active-background)' : 'var(--rc-counter-badge-inactive-background, var(--rc-inactive-background))',
    border:      active ? 'var(--rc-active-border)' : inactiveBorder,
    text:        'var(--body-text)',
    hoverBorder: active ? 'var(--rc-primary-hover)' : inactiveBorder,
  };
});

const resolve = (override: string | undefined, fromStatus: string, fromType: string) => {
  if (override) {
    return override;
  }

  return props.status ? fromStatus : fromType;
};

const backgroundColor = computed(() => resolve(props.backgroundColor, statusColors.backgroundColor.value, typeColors.value.background));
const borderColor = computed(() => resolve(props.borderColor, statusColors.borderColor.value, typeColors.value.border));
const textColor = computed(() => resolve(props.textColor, statusColors.textColor.value, typeColors.value.text));
const hoverBorderColor = computed(() => resolve(props.borderColor, statusColors.borderColor.value, typeColors.value.hoverBorder));
</script>

<template>
  <div
    class="rc-counter-badge"
    :class="{[props.type]: true, disabled: props.disabled}"
    :aria-label="props.ariaLabel"
    data-testid="rc-counter-badge"
  >
    <span class="count">{{ displayCount }}</span>
  </div>
</template>

<style lang="scss" scoped>
.rc-counter-badge {
    box-sizing: border-box;
    height: 21px;

    display: inline-flex;
    padding: 2px 8px;
    align-items: center;

    border-radius: 30px;
    border: 1px solid v-bind(borderColor);

    font-family: Lato;
    font-size: 12px;
    font-style: normal;
    font-weight: 400;
    line-height: 17px;

    background: v-bind(backgroundColor);
    color: v-bind(textColor);

    &.active {
        cursor: pointer;

        &:hover {
            border-color: v-bind(hoverBorderColor);
        }

        &.disabled {
            cursor: not-allowed;
        }
    }
}
</style>
