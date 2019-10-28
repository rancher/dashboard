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
    <label class="corner">
      <slot name="corner" />
    </label>
    <slot name="prefix" />
    <slot name="field">
      <div v-if="isView && value">
        {{ value }}
      </div>
      <div v-else-if="isView" class="text-muted">
        &mdash;
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
    </slot>
    <slot name="suffix" />
  </div>
</template>
