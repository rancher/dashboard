<script>
import Card from '@/components/Card';
import { getAnomalies, getWorkloadLogs } from '@/utils/opni';
import SortableTable from '@/components/SortableTable';
import SuperDatePicker from '@/components/form/SuperDatePicker';
import TimeSeries from '@/components/graph/TimeSeries';
import { ALL_TYPES, getAbsoluteValue, LOG_HEADERS } from '@/components/form/SuperDatePicker/util';
import { formatForTimeseries, findBucket, showTooltip } from './util';

export default {
  components: {
    Card, SuperDatePicker, SortableTable, TimeSeries
  },

  async fetch() {
    await this.loadData();
  },

  data() {
    const fromTo = {
      from: {
        value: 1,
        type:  ALL_TYPES.DAYS_AGO.key
      },
      to: { type: ALL_TYPES.NOW.key }
    };

    return {
      anomalies:    [],
      workloadLogs: [],
      loading:      false,
      logHeaders:   LOG_HEADERS,
      fromTo,
      loadedFromTo: { from: { ...fromTo.from }, to: { ...fromTo.to } }
    };
  },

  computed: {
    requestFromTo() {
      return {
        from: getAbsoluteValue(this.fromTo.from),
        to:   getAbsoluteValue(this.fromTo.to)
      };
    },
    anomalySeries() {
      return this.formatForTimeseries(this.anomalies);
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
      const responses = await Promise.all([getAnomalies(from, to), getWorkloadLogs(from, to)]);

      [this.anomalies, this.workloadLogs] = responses;
      this.workloadLogs = this.workloadLogs.map(log => ({
        ...log, stateDescription: true, stateObj: {}
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
        Anomalies
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
          ref="anomalies"
          class="mt-20 mb-20"
          chart-id="anomalies"
          :from="loadedFromTo.from"
          :to="loadedFromTo.to"
          x-key="timestamp"
          :data-series="anomalySeries"
        />
      </template>
    </Card>
    <SortableTable
      class="mt-20"
      :rows="workloadLogs"
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
