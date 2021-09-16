<script>
import ConsumptionGauge from '@/components/ConsumptionGauge';
import { METRIC } from '@/config/types';
import { formatSi, exponentNeeded, UNITS } from '@/utils/units';

export default {
  name:       'HarvesterStorageUsed',
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
      return this.$store.getters['harvester/byId'](METRIC.NODE, this.row.id);
    },

    storageUsage() {
      let out = 0;

      if (this.metrics) {
        out = this.metrics.storageUsage;
      }

      return out;
    },

    storageTotal() {
      let out = 0;

      if (this.metrics) {
        out = this.metrics.storageTotal;
      }

      return out;
    },

    storageUnits() {
      const exponent = exponentNeeded(this.storageTotal, 1024);

      return `${ UNITS[exponent] }iB`;
    },
  },

  methods: {
    memoryFormatter(value, exponent) {
      const formatOptions = {
        addSuffix:   false,
        increment:   1024,
        minExponent: exponent
      };

      return formatSi(value, formatOptions);
    },
  }
};
</script>

<template>
  <ConsumptionGauge :capacity="storageTotal" :used="storageUsage" :units="storageUnits" :number-formatter="memoryFormatter" />
</template>
