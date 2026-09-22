<script>
import WidgetCard from './WidgetCard.vue';

// TIME SERIES — "A Grafana panel".
//
// Rancher already runs Grafana (rancher-monitoring) and already knows how to embed one of its
// panels, so this widget does not re-implement charting: it frames the panel URL you paste from
// Grafana's own "Share → Embed". Until one is set it says so, rather than drawing an empty chart.
export default {
  name:       'WidgetTimeSeries',
  components: { WidgetCard },

  props: {
    widget: {
      type:     Object,
      required: true,
    },
  },

  computed: {
    // Grafana's embed URL wants `kiosk` so the panel arrives without Grafana's own chrome.
    src() {
      const url = `${ this.widget.url || '' }`.trim();

      if (!url) {
        return '';
      }

      return url.includes('kiosk') ? url : `${ url }${ url.includes('?') ? '&' : '?' }kiosk`;
    },
  },
};
</script>

<template>
  <WidgetCard
    :title="widget.title"
    :empty="!src"
    empty-text="No Grafana panel yet — paste a panel URL in this widget's settings."
  >
    <iframe
      class="wts"
      :src="src"
      title="Grafana panel"
      frameborder="0"
    />
  </WidgetCard>
</template>

<style lang="scss" scoped>
.wts {
  border:     none;
  display:    block;
  height:     100%;
  min-height: 160px;
  width:      100%;
}
</style>
