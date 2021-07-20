<script>
import { getInsights, getAnomolies, getLogs, getWorkloadLogs } from '@/utils/opni';

export default {
  components: { },

  fetch() {
    this.insights = getInsights();
    this.anomolies = getAnomolies();
    this.logs = getLogs();
    this.workloadLogs = getWorkloadLogs();

    console.log(this.insights, this.anomolies, this.logs, this.workloadLogs); // eslint-disable-line no-console
  },

  data() {
    return {
      insights:     [],
      anomolies:    [],
      logs:         [],
      workloadLogs: []
    };
  },

  mounted() {
  },

  methods: {}
};
</script>

<template>
  <div>
    <div>{{ insights.length }}</div>
    <div>{{ anomolies.length }}</div>
    <div>{{ logs.length }}</div>
    <div>{{ workloadLogs.length }}</div>
  </div>
</template>
