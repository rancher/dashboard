<script>
import { getInsights, getAnomolies, getLogs, getWorkloadLogs } from '@/utils/opni';

export default {
  components: { },

  async fetch() {
    const responses = await Promise.all([getInsights(), getAnomolies(), getLogs(), getWorkloadLogs()]);

    [this.insights, this.anomolies, this.logs, this.workloadLogs] = responses;

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
