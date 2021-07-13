<script>
import ConsumptionGauge from '@/components/NodeConsumptionGauge';
import { METRIC } from '@/config/types';

export default {
  name:       'CpuUsed',
  components: { ConsumptionGauge },

  props:      {
    value: {
      type:     String,
      default: ''
    },

    row: {
      type:     Object,
      required: true
    },
  },

  data() {
    return {};
  },

  computed: {
    metrics() {
      return this.$store.getters['cluster/byId'](METRIC.NODE, this.row.id);
    },

    cpuTotal() {
      let out = 0;

      if (this.metrics) {
        out = this.metrics.cpuCapacity;
      }

      return out;
    },

    cpuUsage() {
      let out = 0;

      if (this.metrics) {
        out = this.metrics.cpuUsage;
      }

      return out;
    },

    cpuUnits() {
      return 'C';
    },
  }
};
</script>

<template>
  <ConsumptionGauge :capacity="cpuTotal" :used="cpuUsage" :units="cpuUnits" />
</template>
