<script>
import ConsumptionGauge from '@/components/ConsumptionGauge';
import { METRIC, NODE } from '@/config/types';
import { formatSi, exponentNeeded, UNITS } from '@/utils/units';

export default {
  name:       'HarvesterMemoryUsed',
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

    memoryTotal() {
      let out = 0;

      if (this.metrics) {
        out = this.metrics.memoryCapacity;
      }

      return out;
    },

    memoryUnits() {
      const exponent = exponentNeeded(this.memoryTotal, 1024);

      return `${ UNITS[exponent] }iB`;
    },

    node() {
      const inStore = this.$store.getters['currentProduct'].inStore;
      const node = this.$store.getters[`${ inStore }/byId`](NODE, this.row.id);

      return node;
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
  <ConsumptionGauge
    :capacity="memoryTotal"
    :used="node.memoryReserved"
    :units="memoryUnits"
    :number-formatter="memoryFormatter"
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
