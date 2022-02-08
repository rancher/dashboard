<script>
import ConsumptionGauge from '@/components/ConsumptionGauge';
import { METRIC, NODE } from '@/config/types';

export default {
  name:       'HarvesterCpuUsed',
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

    resourceName: {
      type:     String,
      default: ''
    },
  },

  data() {
    return {};
  },

  computed: {
    metrics() {
      return this.$store.getters['harvester/byId'](METRIC.NODE, this.row.id);
    },

    cpuTotal() {
      let out = 0;

      if (this.metrics) {
        out = this.metrics.cpuCapacity;
      }

      return out;
    },

    cpuUnits() {
      return 'C';
    },

    node() {
      const inStore = this.$store.getters['currentProduct'].inStore;
      const node = this.$store.getters[`${ inStore }/byId`](NODE, this.row.id);

      return node;
    },

    used() {
      if (this.metrics) {
        return this.node.cpuReserved;
      } else {
        return 0;
      }
    },
  }
};
</script>

<template>
  <ConsumptionGauge
    :capacity="cpuTotal"
    :used="used"
    :units="cpuUnits"
    :resource-name="resourceName"
  >
    <template #title="{amountTemplateValues, formattedPercentage}">
      <span>
        {{ t('clusterIndexPage.hardwareResourceGauge.reserved') }}
      </span>
      <span>
        {{ t('node.detail.glance.consumptionGauge.amount', amountTemplateValues) }}
        <span class="ml-10 percentage">/&nbsp;{{ formattedPercentage }}
        </span>
      </span>
    </template>
  </ConsumptionGauge>
</template>
