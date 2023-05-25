<script>
import { formatPercent } from '@shell/utils/string';

export default {
  props: {
    value: {
      type:    String,
      default: ''
    },
    row: {
      type:     Object,
      required: true
    },
    col: {
      type:    Object,
      default: () => {}
    },
  },
  computed: {
    usagePercentage() {
      return formatPercent(this.value);
    },
    reservedPercentage() {
      const cpuCapacity = this.row.cpuCapacity;
      const cpuReservationUsage = this.row.cpuReservationUsage;

      return formatPercent((cpuReservationUsage * 100) / cpuCapacity);
    }
  },
  methods: {
    numberFormatter(value) {
      return Number.isInteger(value) ? value : value.toFixed(2);
    }
  }
};
</script>

<template>
  <div>
    <div>
      {{ t('node.detail.glance.consumptionGauge.used') }}: {{ numberFormatter(row.cpuUsage) }} / {{ numberFormatter(row.cpuCapacity) }} &nbsp; ({{ usagePercentage }})
    </div>
    <div v-if="row.podRequests.cpu">
      {{ t('node.detail.glance.consumptionGauge.reserved') }}: {{ numberFormatter(row.cpuReservationUsage) }} / {{ numberFormatter(row.cpuCapacity) }} &nbsp; ({{ reservedPercentage }})
    </div>
  </div>
</template>
