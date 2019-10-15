<script>
import { parseSi, formatSi, UNITS, FRACTIONAL } from '../../utils/units';
import LabeledInput from '@/components/form/LabeledInput';

export default {
  components: { LabeledInput },

  props: {
    inputExponent: {
      type:    Number,
      default: 2,
    },

    increment: {
      type:    Number,
      default: 1000,
    },

    suffix: {
      type:    String,
      default: 'B',
    },

    outputExponent: {
      type:    Number,
      default: 0,
    },
  },

  data() {
    let userValue = '';

    if ( this.value ) {
      userValue = formatSi(`${ this.value } ${ this.unit }`, {
        addSuffix:   false,
        increment:   this.increment,
        minExponent: this.inputExponent,
        maxExponent: this.outputExponent,
      });
    }

    return { userValue };
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
    }
  },

  methods: {
    update(userValue) {
      let out = null;

      if ( userValue ) {
        out = parseSi(userValue + this.unit, { increment: this.increment });
      }

      this.$emit('input', out);
    },
  }
};
</script>

<template>
  <LabeledInput
    v-model="userValue"
    v-bind="$attrs"
    type="number"
    min="0"
    @input="update($event)"
  >
    <template #suffix>
      <div class="addon">
        {{ addon }}
      </div>
    </template>
  </LabeledInput>
</template>
