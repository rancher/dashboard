<script>
import PercentageBar from '@shell/components/PercentageBar';
import { formatPercent } from '@shell/utils/string';

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
    },

    /**
     * Optional map of css color class: percentage stops to apply to bar
     */

    colorStops: {
      type:    Object,
      default: null
    },

    /**
     * Reduce the vertial height by changed 'Used' for the resource name
     */
    usedAsResourceName: {
      type:   Boolean,
      defaut: false
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
      return {
        used:  this.numberFormatter(this.used || 0),
        total: this.numberFormatter(this.capacity || 0),
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
    <h3 v-if="resourceName && !usedAsResourceName">
      {{ resourceName }}
    </h3>
    <div class="numbers">
      <!-- @slot Optional slot to use as the title rather than showing the resource name -->
      <slot
        name="title"
        :amountTemplateValues="amountTemplateValues"
        :formattedPercentage="formattedPercentage"
      >
        <h4 v-if="usedAsResourceName">
          {{ resourceName }}
        </h4>
        <span v-else>{{ t('node.detail.glance.consumptionGauge.used') }}</span>
        <span>{{ t('node.detail.glance.consumptionGauge.amount', amountTemplateValues) }} <span class="ml-10 percentage">/&nbsp;{{ formattedPercentage }}</span></span>
      </slot>
    </div>
    <div class="mt-10">
      <PercentageBar
        :value="percentageBarValue"
        :color-stops="colorStops"
      />
    </div>
  </div>
</template>

<style lang="scss">
.consumption-gauge {
  .numbers {
    display: flex;
    flex-direction: row;
    justify-content: space-between;

    .percentage {
      font-weight: bold;
    }
  }
}
</style>
