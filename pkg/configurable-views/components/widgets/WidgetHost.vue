<script setup lang="ts">
import { useStore } from 'vuex';
import { useI18n } from '@shell/composables/useI18n';
import { computed, type Component } from 'vue';
import {
  WIDGET_TABLE, WIDGET_LINKS, WIDGET_BANNER, WIDGET_CLUSTER_TABLE, WIDGET_OVERVIEW,
  WIDGET_CLUSTER_HEADER, WIDGET_RESOURCE_CARDS, WIDGET_CAPACITY, WIDGET_EVENTS, WIDGET_CERTIFICATES,
  WIDGET_COMPONENT_STATUS, WIDGET_TABS, WIDGET_ALERTS, WIDGET_METRICS, WIDGET_EXTENSION_CARDS
} from '../../templating/widget-catalog';
import WidgetTable from './WidgetTable.vue';
import WidgetLinks from './WidgetLinks.vue';
import WidgetBanner from './WidgetBanner.vue';
import WidgetClusterTable from './WidgetClusterTable.vue';
import WidgetOverview from './WidgetOverview.vue';
import WidgetClusterHeader from './WidgetClusterHeader.vue';
import WidgetResourceCards from './WidgetResourceCards.vue';
import WidgetCapacity from './WidgetCapacity.vue';
import WidgetEvents from './WidgetEvents.vue';
import WidgetCertificates from './WidgetCertificates.vue';
import WidgetComponentStatus from './WidgetComponentStatus.vue';
import WidgetTabs from './WidgetTabs.vue';
import WidgetAlerts from './WidgetAlerts.vue';
import WidgetMetrics from './WidgetMetrics.vue';
import WidgetExtensionCards from './WidgetExtensionCards.vue';
import type { WidgetSpec } from '../../templating/types';

/** The only place a `kind` maps onto a component: a new building block is added here and to the catalog. */
const RENDERERS: Record<string, Component> = {
  [WIDGET_TABLE]:            WidgetTable,
  [WIDGET_LINKS]:            WidgetLinks,
  [WIDGET_BANNER]:           WidgetBanner,
  [WIDGET_CLUSTER_TABLE]:    WidgetClusterTable,
  [WIDGET_OVERVIEW]:         WidgetOverview,
  [WIDGET_CLUSTER_HEADER]:   WidgetClusterHeader,
  [WIDGET_RESOURCE_CARDS]:   WidgetResourceCards,
  [WIDGET_CAPACITY]:         WidgetCapacity,
  [WIDGET_EVENTS]:           WidgetEvents,
  [WIDGET_CERTIFICATES]:     WidgetCertificates,
  [WIDGET_COMPONENT_STATUS]: WidgetComponentStatus,
  [WIDGET_TABS]:             WidgetTabs,
  [WIDGET_ALERTS]:           WidgetAlerts,
  [WIDGET_METRICS]:          WidgetMetrics,
  [WIDGET_EXTENSION_CARDS]:  WidgetExtensionCards,
};

const props = withDefaults(defineProps<{
  widget: WidgetSpec;
  /** The widget's id on the grid - which a Tabs widget needs to say where a drop into it goes. */
  nodeId?: string;
  gap?: number;
}>(), { nodeId: '', gap: undefined });

const store = useStore();
const { t } = useI18n(store);
const renderer = computed<Component | null>(() => RENDERERS[props.widget.kind] || null);

// Every block is handed its spec; the one that holds widgets also needs its own id and the view's gap.
const rendererProps = computed(() => (props.widget.kind === WIDGET_TABS ? {
  widget: props.widget, nodeId: props.nodeId, gap: props.gap
} : { widget: props.widget }));
</script>

<template>
  <component
    :is="renderer"
    v-if="renderer"
    :key="widget.kind"
    v-bind="rendererProps"
    class="whost"
  />
  <div
    v-else
    class="whost whost--unknown"
  >
    {{ t('configurableViews.widget.unknown', { kind: widget.kind }) }}
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
