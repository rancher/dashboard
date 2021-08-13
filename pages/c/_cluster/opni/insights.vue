<script>
import Card from '@/components/Card';
import { getInsights, getLogs } from '@/utils/opni';
import SortableTable from '@/components/SortableTable';
import SuperDatePicker from '@/components/form/SuperDatePicker';
import { ALL_TYPES, getAbsoluteValue, LOG_HEADERS } from '@/components/form/SuperDatePicker/util';
import TimeSeries from '@/components/graph/TimeSeries';
import Checkbox from '@/components/form/Checkbox';
import day from 'dayjs';
import { formatForTimeseries, findBucket, showTooltip } from './util';

export default {
  components: {
    Card, SuperDatePicker, SortableTable, TimeSeries, Checkbox
  },

  async fetch() {
    await this.loadData();
  },

  data() {
    const fromTo = {
      from: {
        value: day('2021-07-20T08:45:00.000-07:00'),
        type:  ALL_TYPES.ABSOLUTE.key
      },
      to: {
        value: day('2021-07-21T08:45:00.000-07:00'),
        type:  ALL_TYPES.ABSOLUTE.key
      }
    };

    return {
      insights:           [],
      logs:               [],
      loading:            false,
      logHeaders:         LOG_HEADERS,
      fromTo,
      loadedFromTo:       { from: { ...fromTo.from }, to: { ...fromTo.to } },
      highlightAnomalies: false
    };
  },

  computed: {
    requestFromTo() {
      return {
        from: getAbsoluteValue(this.fromTo.from),
        to:   getAbsoluteValue(this.fromTo.to)
      };
    },
    insightSeries() {
      const out = this.formatForTimeseries(this.insights);

      out['Anomalous'].shouldHighlight = true;

      out['Anomalous'].color = 'var(--error)';
      out['Normal'].color = 'var(--primary)';
      out['Suspicious'].color = 'var(--warning)';

      return out;
    },
  },

  mounted() {
    this.$nextTick(() => {
      this.fromTo.from = { ...this.loadedFromTo.from };
      this.fromTo.to = { ...this.loadedFromTo.to };
    });
  },

  methods: {
    async loadData() {
      this.loading = true;
      const { from, to } = this.requestFromTo;
      const responses = await Promise.all([getInsights(from, to), getLogs(from, to)]);

      [this.insights, this.logs] = responses;
      this.logs = this.logs.map((log, i) => ({
        ...log,
        stateDescription: true,
        stateObj:         {},
        remove:           () => {
          this.logs.splice(i, 1);
        }
      }));
      this.loadedFromTo.from = { ...this.fromTo.from };
      this.loadedFromTo.to = { ...this.fromTo.to };
      this.loading = false;
    },
    formatForTimeseries,
    findBucket,
    showTooltip,
  }
};
</script>
<template>
  <div>
    <div class="bar">
      <h1>
        Insights
      </h1>
      <div class="toolbar">
        <SuperDatePicker v-model="fromTo" />
        <button class="ml-10 btn role-primary" @click="loadData">
          <i class="icon icon-refresh mr-5" /> Refresh
        </button>
      </div>
    </div>
    <Card class="card mt-20" :show-actions="false" :show-highlight-border="false">
      <template #body>
        <div v-if="loading" class="initial-load-spinner-container">
          <i class="initial-load-spinner"></i>
        </div>
        <TimeSeries
          v-else
          ref="insights"
          class="mt-20 mb-20"
          chart-id="insights"
          :from="loadedFromTo.from"
          :to="loadedFromTo.to"
          :colors="{'Anomalous':'var(--error)', 'Normal': 'var(--primary)', 'Suspicious': 'var(--warning)'}"
          x-key="timestamp"
          :data-series="insightSeries"
        >
          <template v-slot:inputs="{highlightData, unHighlightData}">
            <Checkbox v-model="highlightAnomalies" class="pull-right" label="Highlight Anomalies" @input="e=>e?highlightData('Anomalous', d=>d>0):unHighlightData()" />
          </template>
        </TimeSeries>
      </template>
    </Card>
    <SortableTable
      class="mt-20"
      :rows="logs"
      :headers="logHeaders"
      :search="false"
      :table-actions="false"
      :row-actions="false"
      :paging="true"
      default-sort-by="name"
      key-field="id"
    >
      <template #sub-row="{row, fullColspan}">
        <tr class="opni sub-row">
          <td :colspan="fullColspan" class="text-warning">
            {{ row.message }}
          </td>
        </tr>
      </template>
    </SortableTable>
  </div>
</template>

<style lang="scss" scoped>
::v-deep .card-body {
  height: 380px;
  position: relative;
}
.card {
  margin: 0;
}

.bar {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
}

.toolbar {
  display: inline-flex;
  flex-direction: row;
  justify-content: flex-end;
  align-items: center;
}

.initial-load-spinner-container {
  align-items: center;
  display: flex;
  justify-content: center;
  height: 100%;
  left: 0;
  position: absolute;
  top: 0;
  width: 100%;
}

.initial-load-spinner {
  animation: initial-load-animate 1s infinite linear;
  background-color: #fff;
  box-sizing: border-box;
  border: 5px solid #008ACF;
  border-radius: 50%;
  border-top-color: #00B2E2;
  display: inline-block;
  height: 80px;
  margin: 0 auto;
  width: 80px;
}

@keyframes initial-load-animate {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(359deg);
  }
}
</style>
