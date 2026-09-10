<script setup lang="ts">
/** The flyout's loading state: placeholders shaped like the rows they stand in for. */
withDefaults(defineProps<{
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
        <div class="skeleton-line">
          <span class="skeleton-bar shimmer" />
        </div>
        <div class="skeleton-line short">
          <span class="skeleton-bar shimmer" />
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.switcher-loading {
  // Every figure is the real row's. Anything short of that and the list still shifts as it lands.
  .skeleton-row {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px;
    border-bottom: 1px solid var(--border);
  }

  .skeleton-row:last-child {
    border-bottom: none;
  }

  .skeleton-badge {
    flex: 0 0 auto;
    width: 42px;
    height: 32px;
    border-radius: var(--border-radius);
  }

  .skeleton-lines {
    flex: 1 1 auto;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  // The line box is the text's, so the row measures right; the bar inside stays slimmer so it still reads
  // as a line rather than a slab.
  .skeleton-line {
    display: flex;
    align-items: center;
    height: 17px;
    width: 55%;

    &.short {
      height: 14px;
      width: 32%;
    }
  }

  .skeleton-bar {
    display: block;
    width: 100%;
    height: 12px;
    border-radius: 4px;
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

// This one never ends, so it is the most worth switching off.
@media (prefers-reduced-motion: reduce) {
  .shimmer {
    animation: none;
  }
}
</style>
