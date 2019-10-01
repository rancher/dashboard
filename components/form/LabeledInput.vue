<script>
import LabeledFormElement from '@/mixins/labeled-form-element';
import TextAreaAutoGrow from '@/components/form/TextAreaAutoGrow';

export default {
  components: { TextAreaAutoGrow },
  mixins:     [LabeledFormElement],

  props: {
    type: {
      type:    String,
      default: 'text',
    },
  },

  methods: {
    onFocus() {
      this.onFocusLabeled();
      if ( this.$refs.input ) {
        this.$refs.input.placeholder = this.placeholder;
      }
    },

    onBlur() {
      this.onBlurLabeled();
      if ( this.$refs.input ) {
        this.$refs.input.placeholder = '';
      }
    }
  }
};
</script>

<template>
  <div :class="{'labeled-input': true, raised, focused, [mode]: true}">
    <label>
      {{ label }}
      <span v-if="required && !value" class="required">*</span>
    </label>
    <div v-if="isView">
      {{ value }}
    </div>
    <TextAreaAutoGrow
      v-else-if="type === 'multiline'"
      ref="input"
      :value="value"
      @input="$emit('input', $event)"
      @focus="onFocus"
      @blur="onBlur"
    />
    <input
      v-else
      ref="input"
      v-bind="$attrs"
      :type="type"
      :value="value"
      @input="$emit('input', $event.target.value)"
      @focus="onFocus"
      @blur="onBlur"
    >
  </div>
</template>
