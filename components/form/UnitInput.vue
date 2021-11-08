<script>
import { parseSi, formatSi, UNITS, FRACTIONAL } from '@/utils/units';
import LabeledInput from '@/components/form/LabeledInput';
import { _EDIT } from '@/config/query-params';

export default {
  components: { LabeledInput },

  props: {
    // Convert to string
    outputAs: {
      type:    String,
      default: 'number', // or string
    },
    // Set suffix text on output
    outputSuffixText: {
      type:    String,
      default: null
    },
    // Set modifier on suffix
    inputExponent: {
      type:    Number,
      default: 0,
    },

    increment: {
      type:    Number,
      default: 1000,
    },

    suffix: {
      type:    String,
      default: 'B',
    },

    // Standard Input Props
    mode: {
      type:    String,
      default: _EDIT
    },

    value: {
      type:    [Number, String],
      default: null
    },

    label: {
      type:     String,
      default: null
    },

    labelKey: {
      type:     String,
      default: null
    },

    tooltip: {
      type:    [String, Object],
      default: null
    },

    tooltipKey: {
      type:     String,
      default: null
    },

    required: {
      type:    Boolean,
      default: false,
    },

    min: {
      type:    [Number, String],
      default: 0
    }
  },

  computed: {
    addon() {
      if (!this.suffix) {
        return false;
      }

      return this.unit + this.suffix;
    },

    unit() {
      if ( this.inputExponent >= 0 ) {
        return UNITS[this.inputExponent];
      } else {
        return FRACTIONAL[-1 * this.inputExponent];
      }
    },

    // Parse string with unit modifier to base unit eg "1m" -> 0.001
    parsedValue() {
      return typeof this.value === 'string' ? parseSi(this.value) : this.value;
    },

    // Convert integer value
    displayValue() {
      let displayValue = '';

      if ( this.parsedValue || this.parsedValue === 0) {
        displayValue = formatSi(this.parsedValue, {
          increment:        this.increment,
          addSuffix:        false,
          maxExponent:      this.inputExponent,
        });
      }

      return displayValue ;
    }
  },

  methods: {
    update(displayValue) {
      let out = null;

      if ( displayValue ) {
        out = parseSi(`${ displayValue } ${ this.unit || '' }`, { increment: this.increment });
      }
      if (this.outputSuffixText) {
        out = out === null ? null : `${ displayValue }${ this.outputSuffixText }`;
      } else if ( this.outputAs === 'string' ) {
        out = out === null ? '' : `${ out }`;
      }

      this.$emit('input', out);
    },
  }
};
</script>

<template>
  <LabeledInput
    :value="displayValue"
    v-bind="$attrs"
    type="number"
    :min="min"
    :mode="mode"
    :label="label"
    :label-key="labelKey"
    :tooltip="tooltip"
    :tooltip-key="tooltipKey"
    :required="required"
    @input="update($event)"
  >
    <template #suffix>
      <div v-if="addon" class="addon" :class="{'with-tooltip': tooltip || tooltipKey}">
        {{ addon }}
      </div>
    </template>
  </LabeledInput>
</template>

<style lang="scss" scoped>
  .addon.with-tooltip {
    position: relative;
    right: 30px;
  }
</style>
