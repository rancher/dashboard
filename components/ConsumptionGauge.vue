<script>
import PercentageBar from '@/components/PercentageBar';
import VStack from '@/components/Layout/Stack/VStack';

/**
 * A detailed view of how much a resource is being consumed.
 */
export default {
  components: {
    PercentageBar,
    VStack
  },
  props: {
    /**
     * The name of the resource to be displayed.
     */
    resourceName: {
      type:     String,
      required: true
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
      return {
        used:  this.numberFormatter(this.used || 0),
        total: this.numberFormatter(this.capacity || 0),
        unit:  this.displayUnits
      };
    }
  }
};
</script>

<template>
  <VStack class="consumption-gauge" :show-dividers="true">
    <VStack class="percentage-bar-container" horizontal-align="center" vertical-align="bottom">
      <PercentageBar
        :value="percentageBarValue"
        :lower-error-bound="0.25"
        :lower-warning-bound="0.25"
        :upper-warning-bound="0.7"
        :upper-error-bound="0.85"
        :number-of-ticks="13"
      />
    </VStack>
    <VStack class="consumption" horizontal-align="center">
      <div>{{ resourceName }}</div>
      <div class="amount">
        {{ t('node.detail.glance.consumptionGauge.amount', amountTemplateValues) }}
      </div>
    </VStack>
  </VStack>
</template>

<style lang="scss">
.consumption-gauge {
  $divider-spacing: 20px;
  min-height: 300px;
  width: 100%;
  padding-right: $divider-spacing;

  &:last-child {
    padding-right: 0;
  }

  & > :last-child {
    padding-top: $divider-spacing;
    height: 25%;
  }

  .consumption {
    margin-bottom: 50px;
  }

  .amount {
      color: var(--link-text);
  }

  .percentage-bar-container {
    padding-bottom: 8px;
    height: 75%;
    text-align: center;

    .percentage-bar {
      display: inline-grid;
      grid-template-rows: [one] auto [two] auto;

      .bar {
        grid-row: one;
        .tick {
          margin-right: 5px;
          width: 4px;
          font-size: 1.7em;
        }
      }

      .percentage {
        margin-top: 20px;
        width: 100%;
        grid-row: two;
        font-size: 45px;
        font-weight: 100;
        text-align: center;
      }
    }
  }

}
</style>
