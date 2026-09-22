<script>
import {
  WIDGET_TABLE, WIDGET_COUNTERS, WIDGET_STATUS_SUMMARY, WIDGET_LIST, WIDGET_BAR_CHART,
  WIDGET_TIME_SERIES, WIDGET_TEXT, WIDGET_LINKS, WIDGET_BANNER, WIDGET_CLUSTER_TABLE, WIDGET_OVERVIEW, WIDGET_NAV
} from '../../templating/widget-catalog';
import WidgetTable from './WidgetTable.vue';
import WidgetCounters from './WidgetCounters.vue';
import WidgetStatusSummary from './WidgetStatusSummary.vue';
import WidgetList from './WidgetList.vue';
import WidgetBarChart from './WidgetBarChart.vue';
import WidgetTimeSeries from './WidgetTimeSeries.vue';
import WidgetText from './WidgetText.vue';
import WidgetLinks from './WidgetLinks.vue';
import WidgetBanner from './WidgetBanner.vue';
import WidgetClusterTable from './WidgetClusterTable.vue';
import WidgetOverview from './WidgetOverview.vue';
import WidgetNav from './WidgetNav.vue';

// Renders ONE widget spec as whichever building block it names. The only place that maps a `kind`
// onto a component, so adding a building block means adding it to the catalog and to this map.
const RENDERERS = {
  [WIDGET_TABLE]:          'WidgetTable',
  [WIDGET_COUNTERS]:       'WidgetCounters',
  [WIDGET_STATUS_SUMMARY]: 'WidgetStatusSummary',
  [WIDGET_LIST]:           'WidgetList',
  [WIDGET_BAR_CHART]:      'WidgetBarChart',
  [WIDGET_TIME_SERIES]:    'WidgetTimeSeries',
  [WIDGET_TEXT]:           'WidgetText',
  [WIDGET_LINKS]:          'WidgetLinks',
  [WIDGET_BANNER]:         'WidgetBanner',
  [WIDGET_CLUSTER_TABLE]:  'WidgetClusterTable',
  [WIDGET_OVERVIEW]:       'WidgetOverview',
  [WIDGET_NAV]:            'WidgetNav',
};

export default {
  name:       'WidgetHost',
  components: {
    WidgetTable,
    WidgetCounters,
    WidgetStatusSummary,
    WidgetList,
    WidgetBarChart,
    WidgetTimeSeries,
    WidgetText,
    WidgetLinks,
    WidgetBanner,
    WidgetClusterTable,
    WidgetOverview,
    WidgetNav
  },

  props: {
    widget: {
      type:     Object,
      required: true,
    },
  },

  computed: {
    renderer() {
      return RENDERERS[this.widget.kind] || null;
    },
  },
};
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
