<script>
import PercentageBarComponent from '../PercentageBar';

/**
 * This is a wrapper around the PercentageBar component which provides the interface
 * that formatters are expected to have.
 */
export default {
  components: { PercentageBarComponent },
  props:      {
    value: {
      type:    String,
      default: ''
    },
    row: {
      type:    Object,
      default: () => {}
    },
    col: {
      type:    Object,
      default: () => {}
    }
  },
  computed: {
    percentage() {
      return Number.parseFloat(this.value);
    }
  }
};
</script>

<template>
  <p v-if="!value || value === '0' || isNaN(value)">
    {{ t('generic.na') }}
  </p>
  <PercentageBarComponent
    v-else
    :modelValue="percentage"
    :show-percentage="true"
  />
</template>
