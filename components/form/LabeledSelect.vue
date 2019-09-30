<script>
import LabeledFormElement from '@/mixins/labeled-form-element';
import { findBy } from '@/utils/array';

export default {
  mixins: [LabeledFormElement],

  props: {
    options: {
      type:    Array,
      default: null,
    },
  },

  computed: {
    currentLabel() {
      const entry = findBy(this.options || [], 'value', this.value);

      if ( entry ) {
        return entry.label;
      }

      return this.value;
    },
  },

  methods: {
    onFocus() {
      this.onFocusLabeled();
      this.$refs.input.placeholder = this.placeholder;
    },

    onBlur() {
      this.onBlurLabeled();
      this.$refs.input.placeholder = '';
    }
  }
};
</script>

<template>
  <div :class="{'labeled-input': true, raised, focused, empty, [mode]: true}">
    <label>
      {{ label }}
      <span v-if="required && !value" class="required">*</span>
    </label>
    <div v-if="isView">
      {{ currentLabel }}
    </div>
    <select
      v-else
      ref="input"
      v-bind="$attrs"
      :value="value"
      @input="$emit('input', $event.target.value)"
      @focus="onFocus"
      @blur="onBlur"
    >
      <option v-if="!focused" disabled value=""></option>
      <option v-if="focused" disabled value="">
        {{ placeholder }}
      </option>
      <option v-for="opt in options" :key="opt.value" :value="opt.value">
        {{ opt.label }}
      </option>
    </select>
  </div>
</template>
