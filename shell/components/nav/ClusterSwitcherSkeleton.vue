<script setup lang="ts">
/**
 * The switcher flyout's loading state: shimmering placeholders shaped like the rows they stand in for, so
 * a list arriving does not shift the panel under the pointer.
 *
 * One component rather than a copy per section — the flyout shows this while RECENTLY USED is fetched,
 * while a search is in flight, while the estate's first page lands, and while a further page is appended.
 */
withDefaults(defineProps<{
  /** How many placeholder rows to draw — as many as the section usually shows, roughly. */
  rows?: number;
}>(), { rows: 3 });
</script>

<template>
  <div
    class="switcher-loading"
    aria-hidden="true"
  >
    <div
      v-for="n in rows"
      :key="n"
      class="skeleton-row"
    >
      <div class="skeleton-badge shimmer" />
      <div class="skeleton-lines">
        <div class="skeleton-line shimmer" />
        <div class="skeleton-line short shimmer" />
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
// Placeholder rows mirroring the real row layout.
.switcher-loading {
  .skeleton-row {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 8px 16px;
  }

  .skeleton-badge {
    flex: 0 0 auto;
    width: 40px;
    height: 32px;
    border-radius: var(--border-radius);
  }

  .skeleton-lines {
    flex: 1 1 auto;
    display: flex;
    flex-direction: column;
    gap: 7px;
  }

  .skeleton-line {
    height: 10px;
    width: 55%;
    border-radius: 4px;

    &.short {
      width: 32%;
    }
  }
}

.shimmer {
  background-image: linear-gradient(
    90deg,
    color-mix(in srgb, var(--body-text) 7%, transparent) 25%,
    color-mix(in srgb, var(--body-text) 15%, transparent) 37%,
    color-mix(in srgb, var(--body-text) 7%, transparent) 63%
  );
  background-size: 400% 100%;
  animation: switcher-shimmer 1.4s ease infinite;
}

@keyframes switcher-shimmer {
  0% {
    background-position: 100% 0;
  }

  100% {
    background-position: 0 0;
  }
}

// The placeholder rows say "loading" perfectly well standing still, and unlike the panel's own unroll this
// animation never ends — so it is the one most worth switching off for a reader who asked for less motion.
@media (prefers-reduced-motion: reduce) {
  .shimmer {
    animation: none;
  }
}
</style>
