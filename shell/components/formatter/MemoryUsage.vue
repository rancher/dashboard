<script>
import { createMemoryValues } from '@shell/utils/units';
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
    memoryUsage() {
      const ramAllocatable = this.row.ramAllocatable;
      const ramUsage = this.row.ramUsage;

      return createMemoryValues(ramAllocatable, ramUsage);
    },
    memoryReserved() {
      const ramAllocatable = this.row.ramAllocatable;
      const ramReservationUsage = this.row.ramReservationUsage;

      return createMemoryValues(ramAllocatable, ramReservationUsage);
    },
    usagePercentage() {
      return formatPercent(this.value);
    },
    reservedPercentage() {
      const ramAllocatable = this.row.ramAllocatable;
      const ramReservationUsage = this.row.ramReservationUsage;

      return formatPercent((ramReservationUsage * 100) / ramAllocatable);
    },
  }
};
</script>

<template>
  <div>
    <div>
      {{ t('node.detail.glance.consumptionGauge.used') }}: {{ memoryUsage.useful }} / {{ memoryUsage.total }}  {{ memoryUsage.units }} &nbsp; ({{ usagePercentage }})
    </div>
    <div v-if="row.podRequests.memory">
      {{ t('node.detail.glance.consumptionGauge.reserved') }}: {{ memoryReserved.useful }} / {{ memoryReserved.total }} {{ memoryReserved.units }} &nbsp; ({{ reservedPercentage }})
    </div>
    <div />
  </div>
</template>
