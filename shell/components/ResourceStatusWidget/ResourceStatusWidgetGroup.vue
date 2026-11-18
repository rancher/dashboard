<script setup lang="ts">
import ResourceStatusWidget from './index.vue';
import type { ResourceStatusWidgetConfig, ResourceStatusWidgetGroupConfig } from './types';

/**
 * A grid of ResourceStatusWidgets with an optional title above it, all described by `config`.
 *
 * The `empty` slot is forwarded to every widget, along with the widget's config. A widget keeps its own
 * message when the slot renders nothing for it.
 */
defineProps<{ config: ResourceStatusWidgetGroupConfig }>();

defineSlots<{ empty?:(props: { config: ResourceStatusWidgetConfig }) => unknown }>();
</script>

<template>
  <div class="resource-status-widget-group">
    <h4
      v-if="config.title"
      class="mm-0 text-deemphasized"
    >
      {{ config.title }}
    </h4>
    <div class="widget-grid">
      <ResourceStatusWidget
        v-for="(widget, i) in config.widgets"
        :key="i"
        :config="widget"
      >
        <template
          v-if="$slots.empty"
          #empty
        >
          <slot
            name="empty"
            :config="widget"
          />
        </template>
      </ResourceStatusWidget>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.resource-status-widget-group {
  display: flex;
  flex-direction: column;
  gap: var(--gap-md);

  h4 {
    line-height: 21px;
  }
}

.widget-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: var(--gap-md);
}
</style>
