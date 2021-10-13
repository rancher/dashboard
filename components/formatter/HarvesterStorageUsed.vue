<script>
import ConsumptionGauge from '@/components/ConsumptionGauge';
import { METRIC, LONGHORN } from '@/config/types';
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

    storageTotal() {
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

    storageUnits() {
      const exponent = exponentNeeded(this.storageTotal, 1024);

      return `${ UNITS[exponent] }iB`;
    },
  },

  methods: {
    memoryFormatter(value) {
      const minExponent = exponentNeeded(this.storageTotal, 1024);
      const formatOptions = {
        addSuffix:   false,
        increment:   1024,
        minExponent,
      };

      return formatSi(value, formatOptions);
    },
  }
};
</script>

<template>
  <ConsumptionGauge :capacity="storageTotal" :used="storageUsage" :units="storageUnits" :number-formatter="memoryFormatter" />
</template>
