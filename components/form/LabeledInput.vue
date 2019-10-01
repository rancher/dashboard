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

  data() {
    return { actualPlaceholder: '' };
  },

  methods: {
    onFocus() {
      this.onFocusLabeled();
      this.actualPlaceholder = `${ this.placeholder }`;
    },

    onBlur() {
      this.onBlurLabeled();
      this.actualPlaceholder = null;
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
      :value="value"
      :placeholder="actualPlaceholder"
      @input="$emit('input', $event)"
      @focus="onFocus"
      @blur="onBlur"
    />
    <input
      v-else
      v-bind="$attrs"
      :type="type"
      :value="value"
      :placeholder="actualPlaceholder"
      @input="$emit('input', $event.target.value)"
      @focus="onFocus"
      @blur="onBlur"
    >
  </div>
</template>
