<script>
import LabeledFormElement from '@/mixins/labeled-form-element';
import TextAreaAutoGrow from '@/components/form/TextAreaAutoGrow';
import { _EDIT } from '@/config/query-params';
import LabeledTooltip from '@/components/form/LabeledTooltip';
import { escapeHtml } from '@/utils/string';

export default {
  components: { LabeledTooltip, TextAreaAutoGrow },
  mixins:     [LabeledFormElement],

  props: {
    copyable: {
      default: false,
      type:    Boolean
    },
    disabled: {
      default: false,
      type:    Boolean
    },
    hoverTooltip: {
      default: false,
      type:    Boolean
    },
    mode: {
      default: _EDIT,
      type:    String
    },
    placeholder: {
      default: '',
      type:    String
    },
    required: {
      default: false,
      type:    Boolean
    },
    status: {
      default: null,
      type:    String
    },
    tooltip: {
      default: null,
      type:    String
    },
    type: {
      default: 'text',
      type:    String
    }
  },

  computed: {
    hasLabel() {
      return !!this.label || !!this.$slots.label;
    },

    hasSuffix() {
      return !!this.$slots.suffix;
    },

    isDisabled() {
      return this.disabled || this.isView;
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
    },
    escapeHtml
  }
};
</script>

<template>
  <div :class="{'labeled-input': true, focused, [mode]: true, disabled: isDisabled, [status]: status, suffix:hasSuffix}">
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
      <TextAreaAutoGrow
        v-if="type === 'multiline' || type === 'multiline-password'"
        ref="value"
        v-bind="$attrs"
        :disabled="isDisabled"
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
        :class="{'no-label': !hasLabel}"
        v-bind="$attrs"
        :disabled="isDisabled"
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
    <slot name="suffix" />
    <LabeledTooltip
      v-if="tooltip && !focused"
      :hover="hoverTooltip"
      :value="tooltip"
      :status="status"
    />
  </div>
</template>
