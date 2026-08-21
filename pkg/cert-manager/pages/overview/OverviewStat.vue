<script setup lang="ts">
import type { OverviewExpiryTile } from './types';

/**
 * A compact, colour-washed tile showing a count and label for one certificate expiry window. Uses
 * the same `--<color>-banner-bg` wash as the workload dashboard's state cards. Rendered only when
 * its count is non-zero, so windows with no certificates are hidden.
 */
defineProps<{ card: OverviewExpiryTile }>();
</script>

<template>
  <div
    class="overview-stat"
    :class="`overview-stat--${ card.color }`"
    data-testid="cert-manager-overview-stat"
    role="group"
    :aria-label="`${ card.count } ${ card.label }`"
  >
    <div class="row">
      <span
        class="dot"
        :class="`dot--${ card.color }`"
        aria-hidden="true"
      />
      <span class="label">
        {{ card.label }}
      </span>
      <span class="count">
        {{ card.count }}
      </span>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.overview-stat {
  padding: 16px;
  border-radius: var(--border-radius-md);

  @each $color in (error, warning, info, success) {
    &--#{$color} {
      background: var(--#{$color}-banner-bg, rgba(var(--#{$color}-rgb), 0.1));
    }
  }

  .row {
    align-items: center;
    display: flex;
    gap: 10px;
  }

  .dot {
    border-radius: 50%;
    flex: 0 0 auto;
    height: 10px;
    width: 10px;

    @each $color in (error, warning, info, success) {
      &--#{$color} {
        background: var(--#{$color});
      }
    }
  }

  .label {
    flex-grow: 1;
    font-size: 14px;
  }

  .count {
    font-size: 20px;
    font-weight: 600;
  }
}
</style>
