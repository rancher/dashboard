<script>
import { getInsights, getAnomalies, getLogs, getWorkloadLogs } from '@/utils/opni';
import SortableTable from '@/components/SortableTable';
import TimeSeries from '@/components/graph/TimeSeries';
import { formatForTimeseries, findBucket, showTooltip } from './util';

export default {
  components: { SortableTable, TimeSeries },

  async fetch() {
    const responses = await Promise.all([getInsights(), getAnomalies(), getLogs(), getWorkloadLogs()]);

    [this.insights, this.anomalies, this.logs, this.workloadLogs] = responses;

    // console.log(this.insights, this.anomalies, this.logs, this.workloadLogs); // eslint-disable-line no-console
  },

  data() {
    return {
      /*
      {
        anomaly: int
        normal: int
        suspicious: int
        timestamp: int unix timestamp
      }
      */
      insights:      [],
      /*
        controlPlaneAnomaly: int
        workloadAnomaly: int
        timestamp: unix timestamp
      */
      anomalies:     [],

      logs:          [],
      workloadLogs:  [],
      logHeaders:      [
        {
          name:      'ts',
          label:     'Time',
          value:     'timestamp',
          formatter: 'Date',
          sort:      ['timestamp']
        },
        {
          name:  'msg',
          label: 'Message',
          value: 'log',
        },
        {
          name:  'component',
          value: 'kubernetes_component',
          sort:  ['component']
        }
      ]
    };
  },

  computed: {

    insightSeries() {
      return this.formatForTimeseries(this.insights);
    },

    anomalySeries() {
      return this.formatForTimeseries(this.anomalies);
    }
  },

  mounted() {
  },

  methods: {
    formatForTimeseries,
    findBucket,
    showTooltip,
  }
};

</script>

<template>
  <div>
    <!-- <div>{{ insights.length }}</div>
    <div>{{ anomalies.length }}</div>
    <div>{{ logs.length }}</div>
    <div>{{ workloadLogs.length }}</div> -->
    <div class="row">
      <div class="col span-6">
        <TimeSeries
          ref="insights"
          class="mt-20 mb-20"
          chart-id="insights"
          :colors="{'Anomalous':'var(--error)', 'Normal': 'var(--primary)', 'Suspicious': 'var(--warning)'}"
          x-key="timestamp"
          :data-series="insightSeries"
        />
      </div>
      <div class="col span-6">
        <TimeSeries
          ref="anomalies"
          class="mt-20 mb-20"
          chart-id="anomalies"
          x-key="timestamp"
          :data-series="anomalySeries"
        />
      </div>
    </div>
    <div>
      <h4>etcd and control plane anomalous logs</h4>
      <SortableTable :row-actions="false" :headers="logHeaders" :rows="logs" key-field="_id" @selection="selected=>showTooltip('anomalies', selected)" />
    </div>

    <div>
      <h4>workload anomalous logs</h4>
      <SortableTable :row-actions="false" :headers="logHeaders" :rows="workloadLogs" key-field="_id" />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.toolbar {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: top;
}
::v-deep {
  .stub {
    width: calc(100% + 13px);
    height: 300px;
    margin-left: -7px;
  }
  input {
    height: 40px;
  }

  .opni.sub-row {
    td {
      padding-top: 0;
    }
  }

  .main-row {
    td {
      padding-bottom: 0;
    }
  }
}
</style>
