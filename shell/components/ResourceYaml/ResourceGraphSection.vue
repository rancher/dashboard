<script setup lang="ts">
import { RcIcon } from '@components/RcIcon';

defineProps<{
  /** Shown in the header, and the accessible name of the toggle */
  title: string,
}>();

const expanded = defineModel<boolean>('expanded', { default: true });
</script>

<template>
  <div class="resource-graph-section">
    <h4 class="resource-graph-section-header">
      <button
        type="button"
        class="resource-graph-section-toggle"
        :aria-expanded="expanded"
        data-testid="resource-graph-section-toggle"
        @click="expanded = !expanded"
      >
        <RcIcon
          :type="expanded ? 'chevron-down' : 'chevron-right'"
          size="small"
          class="resource-graph-section-caret"
        />
        <span class="resource-graph-section-title">{{ title }}</span>
      </button>
    </h4>
    <div
      v-if="expanded"
      class="resource-graph-section-content"
    >
      <slot />
    </div>
  </div>
</template>

<style lang="scss" scoped>
// an inset on the header and the content, not padding on the section
// padding would also inset the rows, so the selected marker would not reach the left edge of the graph
.resource-graph-section {
  --resource-graph-section-inset: 16px;
}

.resource-graph-section-header {
  margin: 0;
  font-size: 12px;
  font-weight: 700;
}

// the caret sits in a first column as wide as the top-level indent of the graph
.resource-graph-section-toggle {
  display: grid;
  grid-template-columns: var(--resource-graph-indent) minmax(0, 1fr);
  align-items: center;
  width: 100%;
  background: transparent;
  color: var(--body-text);
  font-size: 14px;
  text-align: left;
  padding: 0 12px 0 var(--resource-graph-section-inset);

  &:focus-visible {
    @include focus-outline;
    outline-offset: -2px;
  }
}

.resource-graph-section-caret {
  justify-self: end;
  margin-right: 6px;
}

.resource-graph-section-title {
  overflow: hidden;
  text-overflow: ellipsis;
}

// the first level of groups lines up with the title, deeper levels step in from it
.resource-graph-section-content {
  --resource-graph-groups-indent: calc(var(--resource-graph-section-inset) + var(--resource-graph-indent));
}
</style>
