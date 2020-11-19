<script>
import { parseSi, UNITS, FRACTIONAL } from '@/utils/units';
import LabeledInput from '@/components/form/LabeledInput';

export default {
  components: { LabeledInput },

  props: {
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

    mode: {
      type:    String,
      default: 'edit'
    },

    placeholder: {
      type:    String,
      default: null
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
    min="0"
    :placeholder="placeholder"
    :mode="mode"
    @input="update($event)"
  >
    <template #suffix>
      <div v-if="addon" class="addon">
        {{ addon }}
      </div>
    </template>
    <template #corner>
      <slot name="corner" />
    </template>
    <template #label>
      <slot name="label" />
    </template>
  </LabeledInput>
</template>
