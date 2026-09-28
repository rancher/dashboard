<script setup lang="ts">
import { computed, type Component } from 'vue';
import {
  WIDGET_TABLE, WIDGET_LINKS, WIDGET_BANNER, WIDGET_CLUSTER_TABLE, WIDGET_OVERVIEW
} from '../../templating/widget-catalog';
import WidgetTable from './WidgetTable.vue';
import WidgetLinks from './WidgetLinks.vue';
import WidgetBanner from './WidgetBanner.vue';
import WidgetClusterTable from './WidgetClusterTable.vue';
import WidgetOverview from './WidgetOverview.vue';
import type { WidgetSpec } from '../../templating/types';

/** The only place a `kind` maps onto a component: a new building block is added here and to the catalog. */
const RENDERERS: Record<string, Component> = {
  [WIDGET_TABLE]:         WidgetTable,
  [WIDGET_LINKS]:         WidgetLinks,
  [WIDGET_BANNER]:        WidgetBanner,
  [WIDGET_CLUSTER_TABLE]: WidgetClusterTable,
  [WIDGET_OVERVIEW]:      WidgetOverview,
};

const props = defineProps<{ widget: WidgetSpec }>();

const renderer = computed<Component | null>(() => RENDERERS[props.widget.kind] || null);
</script>

<template>
  <component
    :is="renderer"
    v-if="renderer"
    :key="widget.kind"
    :widget="widget"
    class="whost"
  />
  <div
    v-else
    class="whost whost--unknown"
  >
    There is no "{{ widget.kind }}" building block.
  </div>
</template>

<style lang="scss" scoped>
.whost {
  height: 100%;

  &--unknown {
    border:        1px dashed var(--border);
    border-radius: 4px;
    color:         var(--muted);
    font-size:     14px;
    padding:       20px 24px;
  }
}
</style>
