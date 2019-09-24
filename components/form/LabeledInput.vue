<script>
import LabeledFormElement from '@/mixins/labeled-form-element';

export default {
  mixins: [LabeledFormElement],

  props: {
    type: {
      type:    String,
      default: 'text',
    },

    placeholder: {
      type:    String,
      default: ''
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
  <div :class="{'labeled-input': true, raised, focused}">
    <label>
      {{ label }}
      <span v-if="required && !value" class="required">*</span>
    </label>
    <input
      ref="input"
      v-bind="$attrs"
      :type="type"
      :value="value"
      @input="$emit('input', $event.target.value)"
      @focus="onFocus"
      @blur="onBlur"
    >
    </label>
  </div>
</template>
