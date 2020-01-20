<script>
import PercentageCircle from '@/components/PercentageCircle';
import VStack from '@/components/Layout/Stack/VStack';

/**
 * A detailed view of how much a resource is being consumed.
 */
export default {
  components: {
    PercentageCircle,
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
      default: value => value
    }
  },
  computed: {
    displayUnits() {
      return this.units
        ? ` ${ this.units }`
        : '';
    }
  }
};
</script>

<template>
  <VStack class="consumption-gauge" :show-dividers="true">
    <PercentageCircle :value="used / capacity" :lower-error-bound="0.25" :lower-warning-bound="0.25" :upper-warning-bound="0.7" :upper-error-bound="0.85" />
    <VStack horizontal-align="center">
      <div>{{ resourceName }}</div>
      <div class="amount">
        {{ numberFormatter(used) }} of {{ numberFormatter(capacity) }}{{ displayUnits }} reserved
      </div>
    </VStack>
  </VStack>
</template>

<style lang="scss" scoped>
$divider-spacing: 20px;

.consumption-gauge {
  min-height: 300px;
  width: 100%;
  padding-right: $divider-spacing;

  &:last-child {
    padding-right: 0;
  }

  & > :first-child {
    padding-bottom: $divider-spacing;
    height: 75%;
  }

  & > :last-child {
    padding-top: $divider-spacing;
    height: 25%;
  }

  .amount {
      color: var(--link-text);
  }
}
</style>
