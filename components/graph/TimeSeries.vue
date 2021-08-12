<script>
import bb, { area, zoom, selection } from 'billboard.js';
import { randomStr } from '@/utils/string';
import { getAbsoluteValue } from '@/components/form/SuperDatePicker/util';
export default {
  name:       'TimeSeries',
  components: { },
  props:      {
    from: {
      type:     Object,
      required: true
    },
    to: {
      type:     Object,
      required: true
    },
    /*
      {
        name1: [] data1,
        name2: []series data2,
      }
      */
    dataSeries: {
      type:     Object,
      required: true
    },

    colors: {
      type:     Object,
      default: null
    },

    // name of data series to use as x axis. If null, index is used
    xKey: {
      type:    String,
      default: 'x'
    },

    // TODO use DATE_FORMAT and TIME_FORMAT prefs instead
    // date/time format for x axis labels
    xFormat: {
      type:    String,
      default: '%H:%M %d %b'
    },

    chartId: {
      type:    String,
      default: () => randomStr(4)
    }
  },
  data() {
    return {
      showReset: false,

      chart:       null,
      // default to showing last wk
      timeRange: 10080,

      timeOpts: [
        { label: '5m', value: 5 },
        { label: '10m', value: 10 },
        { label: '30m', value: 30 },
        { label: '1h', value: 60 },
        { label: '24h', value: 1440 },
        { label: '1w', value: 10080 }
      ],
    };
  },

  computed: {
    // TODO more time selection modes than 'last x minutes'
    minTime() {
      return getAbsoluteValue(this.from).valueOf();
      // return ((this.latestTime / 1000) - (this.timeRange * 60)) * 1000;
    },

    maxTime() {
      return getAbsoluteValue(this.to).valueOf();
      // return this.latestTime;
    },

    // TODO remove when done with mocks
    latestTime() {
      const { timestamp = [] } = this.dataSeries;

      return timestamp[timestamp.length - 1];
    },

    needsLogY() {
      const allVals = Object.values(this.dataSeries).reduce((all, each) => {
        all.push(...each);

        return all;
      }, []);

      const range = [Math.min(...allVals), Math.max(...allVals)];

      return range[1] > range[0] + 250;
    }
  },

  watch: {
    minTime() {
      this.createChart();
    },
    maxTime() {
      this.createChart();
    }
  },
  mounted() {
    this.createChart();
  },

  methods: {
    createChart() {
      const columns = Object.entries(this.dataSeries).map(([key, val]) => {
        return [key, ...val];
      });

      const data = {
        columns,
        x:         this.xKey,
        type:      area(),
        selection: { enabled: selection(), draggable: false },
        onover:    (d) => {
          this.$emit('over', d);
        },
        onout: (d) => {
          this.$emit('out', d);
        },
        onselected: (d) => {
          this.$emit('selected', d);
        },
        onunselected: (d) => {
          this.$emit('unselected', d);
        }

      };

      if (this.colors) {
        data.colors = this.colors;
      }

      this.chart = bb.generate(
        {
          data,
          bindto:  { element: `#${ this.chartId }` },
          axis:   {
            x: {
              type:   'timeseries',
              tick: {
                format: this.xFormat, width: 50, count: 10
              },
              max:  { value: this.maxTime, fit: true },
              min:  { value: this.minTime, fit: true },
            },
            y: {
              min:     0,
              padding: { bottom: 0 },
              type:    this.needsLogY ? 'log' : 'indexed'
            },

          },
          point:   { focus: { expand: { enabled: true }, only: true } },
          legend:  { position: 'inset' },
          tooltip: { contents: this.formatTooltip },
          grid:    {
            x: { show: true },
            y: { show: true }
          },
          zoom: {
            enabled:     zoom(),
            type:        'drag',
            onzoomend: this.onzoomend
          },
        }
      );
    },

    showTooltip(tooltip) {
      this.chart.tooltip.show(tooltip);
    },

    hideTooltip() {
      this.chart.tooltip.hide();
    },

    formatTooltip(data) {
      let out = "<div class='simple-box'>";

      data.forEach((category) => {
        out += `<div>${ category.name }: ${ category.value }</div>`;
      });

      return `${ out }</div>`;
    },

    onzoomend() {
      this.showReset = true;
    }
  }
};
</script>

<template>
  <div>
    <div class="row mb-20 input-controls">
      <div class="col span-4">
      </div>
      <div :style="{'align-self':'center'}" class="col span-4 ">
        <button v-if="showReset" class="btn role-secondary pull-right" type="button" @click="chart.unzoom(); showReset=false">
          {{ t('opni.chart.resetZoom') }}
        </button>
      </div>
    </div>

    <div :id="chartId">
      ...
    </div>
  </div>
</template>

<style lang="scss">
.input-controls{
  align-items: center;
}

.bb>svg{
  overflow: inherit !important;
}
.bb-main {
  fill: var(--input-label);

  .domain {
    fill: none;
    stroke: var(--default-text);
    stroke-width: 1px;
  }

  .bb-grid{
    stroke: var(--input-border);
    stroke-width: 1px;
  }

  .bb-axis-y>g:last-of-type {
    transform: translate(0,5px);
  }

  .bb-chart-lines .bb-lines .bb-line {
    fill: none;
  }

  .bb-area {
    opacity: 0.25 !important
  }

  // .bb-circle.highlight {
  //   outline: 3px solid violet;
  // }

  .bb-zoom-brush{
    fill: var(--primary-banner-bg)
  }
}

g.bb-legend  {
    fill: var(--input-label);
    > g.bb-legend-background > rect {
      fill: none;
    }
  }

  .bb-tooltip-container {
    .simple-box {
      $padding: 15px;

      background: var(--simple-box-bg) 0% 0% no-repeat padding-box;
      box-shadow: 0px 0px 10px var(--simple-box-shadow);
      border: 1px solid var(--simple-box-border);
      padding: $padding;

      .top {
        line-height: 24px;
        font-size: 18px;
        border-bottom: 1px solid var(--simple-box-divider);
        padding-bottom: $padding;
        margin: 0 -15px 10px -15px;
        padding: 0 15px 15px 15px;
        align-items: center;
        display: flex

        & BUTTON {
          padding: 0;
          height: fit-content;
          align-self: flex-start;
        }

        & H2{
          margin-bottom: 0;
        }
      }

      .content {
        padding: $padding;
      }
    }
  }

</style>
