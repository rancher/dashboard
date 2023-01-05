<script>
import ConsumptionGauge from '@shell/components/ConsumptionGauge';
import { METRIC, NODE } from '@shell/config/types';
import { parseSi } from '@shell/utils/units';

export default {
  name:       'HarvesterCpuUsed',
  components: { ConsumptionGauge },

  props: {
    value: {
      type:    String,
      default: ''
    },

    row: {
      type:     Object,
      required: true
    },

    resourceName: {
      type:    String,
      default: ''
    },

    showUsed: {
      type:    Boolean,
      default: false,
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

    reserved() {
      if (this.metrics) {
        return this.node.cpuReserved;
      } else {
        return 0;
      }
    },

    used() {
      if (this.metrics) {
        return parseSi(this.metrics?.usage?.cpu || '0m');
      } else {
        return 0;
      }
    },
  }
};
</script>

<template>
  <div>
    <ConsumptionGauge
      :capacity="cpuTotal"
      :used="reserved"
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
    <div
      v-if="showUsed"
      class="mt-10"
    >
      <ConsumptionGauge
        :capacity="cpuTotal"
        :used="used"
        :units="cpuUnits"
      >
        <template #title="{amountTemplateValues, formattedPercentage}">
          <span>
            {{ t('clusterIndexPage.hardwareResourceGauge.used') }}
          </span>
          <span>
            {{ t('node.detail.glance.consumptionGauge.amount', amountTemplateValues) }}
            <span class="ml-10 percentage">/&nbsp;{{ formattedPercentage }}
            </span>
          </span>
        </template>
      </ConsumptionGauge>
    </div>
  </div>
</template>
