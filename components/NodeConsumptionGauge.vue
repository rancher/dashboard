<script>
import { exponentNeeded } from '@/utils/units';
import PercentageBar from '@/components/PercentageBar';
import { formatPercent } from '@/utils/string';

/**
 * A detailed view of how much a resource is being consumed.
 */
export default {
  components: { PercentageBar },
  props:      {
    /**
     * The name of the resource to be displayed.
     */
    resourceName: {
      type:     String,
      default: ''
    },
    /**
     * The total amount of the resource (both used and unused amount).
     */
    capacity: {
      type:     Number,
      required: true
    },
    /**
     * The amount of the resource that is currently in use.
     */
    used: {
      type:     Number,
      required: true
    },
    /**
     * The units that should be displayed when referencing amounts of the resource.
     */
    units:           {
      type:     String,
      default:  ''
    },
    /**
     * A method which can be used to format the *capacity* and *used* numbers for display.
     */
    numberFormatter: {
      type:    Function,
      default: value => Number.isInteger(value) ? value : value.toFixed(2)
    }
  },
  computed: {
    displayUnits() {
      if ( this.units ) {
        return ` ${ this.units }`;
      }

      return '';
    },
    percentageBarValue() {
      if (!this.used || !this.capacity) {
        return 0;
      }

      return (this.used * 100) / this.capacity;
    },
    amountTemplateValues() {
      const exponent = exponentNeeded(this.capacity || 0, 1024);

      return {
        used:  this.numberFormatter(this.used || 0, exponent),
        total: this.numberFormatter(this.capacity || 0, exponent),
        unit:  this.displayUnits
      };
    },
    formattedPercentage() {
      return formatPercent(this.percentageBarValue);
    }
  }
};
</script>

<template>
  <div class="consumption-gauge">
    <h3 v-if="resourceName">
      {{ resourceName }}
    </h3>
    <div class="numbers text-muted">
      <span>{{ t('node.detail.glance.consumptionGauge.used') }}</span> <span>{{ t('node.detail.glance.consumptionGauge.amount', amountTemplateValues) }} <span class="ml-10">/&nbsp;{{ formattedPercentage }}</span></span>
    </div>
    <div class="mt-10">
      <PercentageBar
        :height="8"
        :value="percentageBarValue"
      />
    </div>
  </div>
</template>

<style lang="scss">
.consumption-gauge {
  margin-right: 20px;
  .numbers {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    color: #6C6C76 !important;

    .percentage {
      font-weight: bold;
    }
  }
}
</style>
