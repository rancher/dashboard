<script>
import LabeledFormElement from '@/mixins/labeled-form-element';
import TextAreaAutoGrow from '@/components/form/TextAreaAutoGrow';
import { _EDIT, _VIEW } from '@/config/query-params';
import LabeledTooltip from '@/components/form/LabeledTooltip';

export default {
  components: { LabeledTooltip, TextAreaAutoGrow },
  mixins:     [LabeledFormElement],

  props: {

    type: {
      type:    String,
      default: 'text',
    },

    mode: {
      type:    String,
      default: _EDIT
    },

    disabled: {
      type:    Boolean,
      default: false,
    },

    placeholder: {
      type:    String,
      default: ''
    },

    status: {
      type:      String,
      default:   null
    },

    tooltip: {
      type:    String,
      default: null
    },

    required: {
      type:    Boolean,
      default: false,
    },

  },

  computed: {
    isViewing() {
      return this.mode === _VIEW;
    },

    hasLabel() {
      return !!this.label || !!this.$slots.label;
    },
  },

  methods: {
    focus() {
      const comp = this.$refs.value;

      if ( comp ) {
        comp.focus();
      }
    },

    select() {
      const comp = this.$refs.value;

      if ( comp ) {
        comp.select();
      }
    },

    onFocus() {
      this.onFocusLabeled();
    },

    onBlur() {
      this.onBlurLabeled();
    }
  }
};
</script>

<template>
  <div :class="{'labeled-input': true, raised, focused, [mode]: true, disabled: disabled && !isView, [status]: status}">
    <slot name="label">
      <label>
        {{ label }}
        <span v-if="required && !value" class="required">*</span>
      </label>
    </slot>
    <label v-if="!!(this.$slots.corner || [])[0]" class="corner">
      <slot name="corner" />
    </label>
    <slot name="prefix" />
    <slot name="field">
      <div v-if="isView && value">
        <slot name="view">
          {{ value }}
        </slot>
        <slot name="suffix" />
      </div>
      <div v-else-if="isView" class="text-muted">
        &mdash;
      </div>
      <TextAreaAutoGrow
        v-else-if="type === 'multiline'"
        ref="value"
        v-bind="$attrs"
        :disabled="disabled"
        :value="value"
        :placeholder="placeholder"
        autocapitalize="off"
        @input="$emit('input', $event)"
        @focus="onFocus"
        @blur="onBlur"
      />
      <input
        v-else
        ref="value"
        :class="{'no-label':!hasLabel}"
        v-bind="$attrs"
        :disabled="disabled"
        :type="type"
        :value="value"
        :placeholder="placeholder"
        autocomplete="off"
        autocapitalize="off"
        @input="$emit('input', $event.target.value)"
        @focus="onFocus"
        @blur="onBlur"
      >
    </slot>
    <slot v-if="!isView" name="suffix" />
    <LabeledTooltip v-if="tooltip && !focused" :value="tooltip" :status="status" />
  </div>
</template>
