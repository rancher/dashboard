<script>
import { parseSi, UNITS, FRACTIONAL } from '@/utils/units';
import LabeledInput from '@/components/form/LabeledInput';
import { _EDIT } from '@/config/query-params';

export default {
  components: { LabeledInput },

  props: {
    mode: {
      type:    String,
      default: _EDIT
    },

    value: {
      type:    [Number, String],
      default: null
    },

    inputExponent: {
      type:    Number,
      default: 0,
    },

    increment: {
      type:    Number,
      default: 1,
    },

    suffix: {
      type:    String,
      default: 'B',
    },

    outputExponent: {
      type:    Number,
      default: 0,
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
      return this.unit + this.suffix;
    },

    unit() {
      if ( this.inputExponent >= 0 ) {
        return UNITS[this.inputExponent];
      } else {
        return FRACTIONAL[-1 * this.inputExponent];
      }
    },
    userValue() {
      let userValue = '';

      if ( this.value !== null && this.value !== undefined ) {
        userValue = parseSi(`${ this.value } ${ this.unit || '' }`, {
          addSuffix:   false,
          increment:   this.increment,
          minExponent: this.inputExponent,
          maxExponent: this.outputExponent,
        });
      }

      return userValue ;
    }
  },

  methods: {
    update(userValue) {
      let out = null;

      if ( userValue ) {
        out = parseSi(`${ userValue } ${ this.unit || '' }`, { increment: this.increment });
      }

      this.$emit('input', out);
    },
  }
};
</script>

<template>
  <LabeledInput
    :value="userValue"
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
