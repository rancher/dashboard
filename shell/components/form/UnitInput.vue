<script>
import { parseSi, formatSi, UNITS, FRACTIONAL } from '@shell/utils/units';
import { LabeledInput } from '@components/Form/LabeledInput';
import { _EDIT } from '@shell/config/query-params';

export default {
  components: { LabeledInput },

  props: {
    /**
     * Convert output to string
     * Output will also be a string regardless of this prop if outputModifier = true
     */
    outputAs: {
      type:    String,
      default: 'number',
    },

    /**
     * Append exponential modifier in output, eg "123Mi"
     * If this is false while inputExponent is true, the output val will be converted to base units
     * eg user is views in terms of MiB but integer values corresponding to B are actually emitted
     */
    outputModifier: {
      type:    Boolean,
      default: false
    },

    /**
     * Set modifier on base unit - positive vals map to UNITS array, negative to FRACTIONAL
     * String input values with SI notation will be converted to this measurement unit,
     * eg "1Gi" will become "1024Mi" if this is set to 2
     * UNITS = ['', 'K', 'M', 'G', 'T', 'P', 'E', 'Z', 'Y'];
     * FRACTIONAL = ['', 'm', 'u', 'n', 'p', 'f', 'a', 'z', 'y'];
     */
    inputExponent: {
      type:    Number,
      default: 0,
    },

    /**
     * Combines with inputExponent to make displayed unit.
     * Use 'suffix' if the input's units are strictly for display
     */
    baseUnit: {
      type:    String,
      default: 'B',
    },

    /**
     * Hide arrows on number input when it overlaps with the unit
     */
    hideArrows: {
      type:    Boolean,
      default: false
    },

    /**
     * If set to 1024, binary modifier will be used eg MiB instead of MB
     */
    increment: {
      type:    Number,
      default: 1000,
    },

    /**
     * Ignore baseUnit and inputExponent in favor of a display-only suffix
     * display/emit integers without SI conversion
     */
    suffix: {
      type:    String,
      default: null,
    },

    /**
     * LabeledInput props
     */
    mode: {
      type:    String,
      default: _EDIT
    },

    value: {
      type:    [Number, String],
      default: null
    },

    label: {
      type:    String,
      default: null
    },

    labelKey: {
      type:    String,
      default: null
    },

    tooltip: {
      type:    [String, Object],
      default: null
    },

    tooltipKey: {
      type:    String,
      default: null
    },

    required: {
      type:    Boolean,
      default: false,
    },

    min: {
      type:    [Number, String],
      default: 0
    },

    placeholder: {
      type:    [String, Number],
      default: ''
    },

    /**
     * Optionally delay on input while typing
     */
    delay: {
      type:    Number,
      default: 0
    }
  },

  computed: {
    unit() {
      let out;

      if ( this.inputExponent >= 0 ) {
        out = UNITS[this.inputExponent];
      } else {
        out = FRACTIONAL[-1 * this.inputExponent];
      }
      if (this.increment === 1024 && out) {
        out += 'i';
      }

      return out;
    },

    /**
     * Parse string with unit modifier to base unit eg "1m" -> 0.001
     */
    parsedValue() {
      return typeof this.value === 'string' ? parseSi(this.value) : this.value;
    },

    /**
     * Convert integer value
     */
    displayValue() {
      let displayValue = '';

      if ( this.parsedValue || this.parsedValue === 0) {
        displayValue = formatSi(this.parsedValue, {
          increment:   this.increment,
          addSuffix:   false,
          maxExponent: this.inputExponent,
          minExponent: this.inputExponent,
        });
      }

      return displayValue ;
    },

    /**
     * Conditionally display value with unit or SI suffix
     */
    displayUnit() {
      if (this.suffix) {
        return this.suffix;
      }

      return this.unit + this.baseUnit;
    }
  },

  methods: {
    focus() {
      const comp = this.$refs.value;

      if (comp) {
        comp.focus();
      }
    },

    update(inputValue) {
      let out = inputValue === '' ? null : inputValue;

      if (this.outputModifier) {
        out = out === null ? null : `${ inputValue }${ this.unit }`;
      } else if ( this.outputAs === 'string' ) {
        out = out === null ? '' : `${ inputValue }`;
      } else if (out) {
        out = this.unit ? parseSi(`${ out }${ this.unit }`) : parseInt(out);
      }

      this.$emit('input', out);
    },
  }
};
</script>

<template>
  <LabeledInput
    ref="value"
    :value="displayValue"
    v-bind="$attrs"
    type="number"
    :min="min"
    :mode="mode"
    :label="label"
    :delay="delay"
    :label-key="labelKey"
    :tooltip="tooltip"
    :tooltip-key="tooltipKey"
    :required="required"
    :placeholder="placeholder"
    :hide-arrows="hideArrows"
    @blur="update($event.target.value)"
  >
    <template #suffix>
      <div
        v-if="displayUnit"
        class="addon"
        :class="{'with-tooltip': tooltip || tooltipKey}"
      >
        {{ displayUnit }}
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
