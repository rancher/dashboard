<script>
import ConsumptionGauge from '@shell/components/ConsumptionGauge';
import { LONGHORN } from '@shell/config/types';
import { formatSi, exponentNeeded, UNITS } from '@shell/utils/units';

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

    showReserved: {
      type:    Boolean,
      default: false,
    },
  },

  data() {
    return {};
  },

  computed: {
    usage() {
      const inStore = this.$store.getters['currentProduct'].inStore;
      const longhornNode = this.$store.getters[`${ inStore }/byId`](LONGHORN.NODES, `longhorn-system/${ this.row.id }`) || {};

      return longhornNode?.used || 0;
    },

    reserved() {
      const inStore = this.$store.getters['currentProduct'].inStore;
      const longhornNode = this.$store.getters[`${ inStore }/byId`](LONGHORN.NODES, `longhorn-system/${ this.row.id }`);
      let reserved = 0;

      const disks = longhornNode?.spec?.disks || {};

      Object.values(disks).map((disk) => {
        if (disk.allowScheduling) {
          reserved += disk.storageReserved;
        }
      });

      return reserved;
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

    formatReserved() {
      let out = this.formatter(this.reserved || 0);

      if (!Number.parseFloat(out) > 0) {
        out = this.formatter(this.reserved || 0, { canRoundToZero: false });
      }

      return out;
    },

    usedAmountTemplateValues() {
      return {
        used:  this.used,
        total: this.formatter(this.total || 0),
        unit:  this.units,
      };
    },

    reservedAmountTemplateValues() {
      return {
        used:  this.formatReserved,
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
        ...formatOptions,
        ...format,
      });
    },
  }
};
</script>

<template>
  <div>
    <div
      v-if="showReserved"
    >
      <ConsumptionGauge
        :capacity="total"
        :used="reserved"
        :units="units"
        :number-formatter="formatter"
        :resource-name="resourceName"
      >
        <template #title="{formattedPercentage}">
          <span>
            {{ t('clusterIndexPage.hardwareResourceGauge.reserved') }}
          </span>
          <span>
            {{ t('node.detail.glance.consumptionGauge.amount', reservedAmountTemplateValues) }}
            <span class="ml-10 percentage">
              /&nbsp;{{ formattedPercentage }}
            </span>
          </span>
        </template>
      </ConsumptionGauge>
    </div>
    <ConsumptionGauge
      :capacity="total"
      :used="usage"
      :units="units"
      :number-formatter="formatter"
      :resource-name="showReserved ? '' : resourceName"
      :class="{
        'mt-10': showReserved,
      }"
    >
      <template #title="{formattedPercentage}">
        <span>
          {{ t('node.detail.glance.consumptionGauge.used') }}
        </span>
        <span>
          {{ t('node.detail.glance.consumptionGauge.amount', usedAmountTemplateValues) }}
          <span class="ml-10 percentage">
            /&nbsp;{{ formattedPercentage }}
          </span>
        </span>
      </template>
    </ConsumptionGauge>
  </div>
</template>
