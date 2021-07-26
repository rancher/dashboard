<script>
import { getInsights, getAnomalies, getLogs, getWorkloadLogs } from '@/utils/opni';
import SortableTable from '@/components/SortableTable';
import TimeSeries from '@/components/graph/TimeSeries';
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
    formatForTimeseries(data) {
      const out = {};

      data.forEach((entry) => {
        Object.entries(entry).forEach(([key, value]) => {
          const label = this.$store.getters['i18n/withFallback'](`opni.chart.labels.${ key }`, { count: 1 }, key);

          if (!out[label]) {
            out[label] = [];
          }
          out[label].push(value);
        });
      });

      return out;
    },

    findBucket(log, timestamps) {
      const logTime = log.timestamp;

      let out;

      let i = 0;

      while (out === undefined) {
        const thisTime = timestamps[i];
        const nextTime = timestamps[i + 1];

        if (!thisTime) {
          out = null;
        }

        if (logTime >= thisTime && logTime < nextTime) {
          out = thisTime;
        } else {
          i++;
        }
      }

      return out;
    },

    // TODO table multi-select
    showTooltip(chartName, logs = []) {
      const log = logs[0];
      const chartComp = this.$refs[chartName];

      if (!chartComp) {
        return;
      }
      if (!log) {
        chartComp.hideTooltip();

        return;
      }
      const { minTime, maxTime } = chartComp;
      const timestamps = chartComp?.dataSeries?.timestamp;
      const targetTimestamp = this.findBucket(log, timestamps);
      // const targetTimestamp = logs[0]['window_dt'];

      if (targetTimestamp && targetTimestamp >= minTime && targetTimestamp <= maxTime) {
        chartComp.showTooltip({ x: targetTimestamp });
      }
    },
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
