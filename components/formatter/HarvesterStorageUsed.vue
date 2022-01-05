<script>
import ConsumptionGauge from '@/components/ConsumptionGauge';
import { LONGHORN } from '@/config/types';
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

    resourceName: {
      type:     String,
      default: ''
    },
  },

  data() {
    return {};
  },

  computed: {
    usage() {
      const inStore = this.$store.getters['currentProduct'].inStore;
      const longhornNode = this.$store.getters[`${ inStore }/byId`](LONGHORN.NODES, `longhorn-system/${ this.row.id }`);
      let out = 0;

      const diskStatus = longhornNode?.status?.diskStatus || {};

      Object.values(diskStatus).map((disk) => {
        if (disk?.storageAvailable && disk?.storageMaximum) {
          out += disk.storageMaximum - disk.storageAvailable;
        }
      });

      return out;
    },

    total() {
      const inStore = this.$store.getters['currentProduct'].inStore;
      const longhornNode = this.$store.getters[`${ inStore }/byId`](LONGHORN.NODES, `longhorn-system/${ this.row.id }`);
      let out = 0;

      const diskStatus = longhornNode?.status?.diskStatus || {};

      Object.values(diskStatus).map((disk) => {
        if (disk?.storageMaximum) {
          out += disk.storageMaximum;
        }
      });

      return out;
    },

    units() {
      const exponent = exponentNeeded(this.total, 1024);

      return `${ UNITS[exponent] }iB`;
    },

    used() {
      let out = this.formatter(this.usage || 0);

      if (!Number.parseFloat(out) > 0) {
        out = this.formatter(this.usage || 0, { canRoundToZero: false });
      }

      return out;
    },

    amountTemplateValues() {
      return {
        used:  this.used,
        total: this.formatter(this.total || 0),
        unit:  this.units,
      };
    },
  },

  methods: {
    formatter(value, format) {
      const minExponent = exponentNeeded(this.total, 1024);
      const formatOptions = {
        addSuffix:   false,
        increment:   1024,
        minExponent,
      };

      return formatSi(value, {
        formatOptions,
        ...format,
      });
    },
  }
};
</script>

<template>
  <ConsumptionGauge
    :capacity="total"
    :used="usage"
    :units="units"
    :number-formatter="formatter"
    :resource-name="resourceName"
  >
    <template #title="{formattedPercentage}">
      <span>
        {{ t('node.detail.glance.consumptionGauge.used') }}
      </span>
      <span>
        {{ t('node.detail.glance.consumptionGauge.amount', amountTemplateValues) }}
        <span class="ml-10 percentage">
          /&nbsp;{{ formattedPercentage }}
        </span>
      </span>
    </template>
  </ConsumptionGauge>
</template>
