<script>
import PercentageCircle from '@/components/PercentageCircle';
import VStack from '@/components/Layout/Stack/VStack';

export default {
  components: {
    PercentageCircle,
    VStack
  },
  props: {
    resourceName: {
      type:     String,
      required: true
    },
    capacity: {
      type:     Number,
      required: true
    },
    used: {
      type:     Number,
      required: true
    },
    units:           {
      type:     String,
      default:  ''
    },
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
