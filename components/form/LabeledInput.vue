<script>
import LabeledFormElement from '@/mixins/labeled-form-element';
import TextAreaAutoGrow from '@/components/form/TextAreaAutoGrow';
import { _EDIT, _VIEW } from '@/config/query-params';

export default {
  components: { TextAreaAutoGrow },
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
    }

  },

  computed: {
    isViewing() {
      return this.mode === _VIEW;
    }
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
  <div v-if="isViewing" :class="{'labeled-input': true, [mode]: true, disabled}">
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
    <div>
      <span v-if="value">
        {{ value }}
        <slot name="suffix" />
      </span>
      <span v-else>
        <t k="generic.na" :raw="true" />
      </span>
    </div>
  </div>
  <div v-else :class="{'labeled-input': true, raised, focused, [mode]: true, disabled}">
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
        @input="$emit('input', $event)"
        @focus="onFocus"
        @blur="onBlur"
      />
      <input
        v-else
        ref="value"
        v-bind="$attrs"
        :disabled="disabled"
        :type="type"
        :value="value"
        :placeholder="placeholder"
        autocomplete="off"
        @input="$emit('input', $event.target.value)"
        @focus="onFocus"
        @blur="onBlur"
      >
    </slot>
    <slot name="suffix" />
  </div>
</template>
