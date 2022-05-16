<script>
import CompactInput from '@shell/mixins/compact-input';
import LabeledFormElement from '@shell/mixins/labeled-form-element';
import TextAreaAutoGrow from '@shell/components/form/TextAreaAutoGrow';
import { LabeledTooltip } from '@pkg/rancher-components/src/components/LabeledTooltip';
import { escapeHtml } from '@shell/utils/string';
import cronstrue from 'cronstrue';
import { isValidCron } from 'cron-validator';
import { debounce } from 'lodash';

export default {
  components: { LabeledTooltip, TextAreaAutoGrow },
  mixins:     [LabeledFormElement, CompactInput],

  props: {
    type: {
      type:    String,
      default: 'text',
    },

    status: {
      type:    String,
      default: null,
    },

    subLabel: {
      type:    String,
      default: null,
    },

    tooltip: {
      default: null,
      type:    [String, Object],
    },

    hoverTooltip: {
      type:    Boolean,
      default: true,
    },

    ignorePasswordManagers: {
      default: false,
      type:    Boolean,
    },

    maxlength: {
      type:    Number,
      default: null,
    },

    hideArrows: {
      type:    Boolean,
      default: false
    },

    /**
     * Optionally delay on input while typing
     */
    delay: {
      type:    Number,
      default: 0
    }
  },

  data() {
    return {
      updated:          false,
      validationErrors: '',
    };
  },

  computed: {
    onInput() {
      return this.delay ? debounce(this.delayInput, this.delay) : this.delayInput;
    },

    hasLabel() {
      return this.isCompact ? false : !!this.label || !!this.labelKey || !!this.$slots.label;
    },

    hasTooltip() {
      return !!this.tooltip || !!this.tooltipKey;
    },

    hasSuffix() {
      return !!this.$slots.suffix;
    },

    cronHint() {
      if (this.type !== 'cron' || !this.value) {
        return;
      }
      if (!isValidCron(this.value)) {
        return this.t('generic.invalidCron');
      }
      try {
        const hint = cronstrue.toString(this.value);

        return hint;
      } catch (e) {
        return this.t('generic.invalidCron');
      }
    },

    _placeholder() {
      if (this.placeholder) {
        return this.placeholder;
      }
      if (this.placeholderKey) {
        return this.t(this.placeholderKey);
      }

      return '';
    },

    _maxlength() {
      if (this.type === 'text' && this.maxlength) {
        return this.maxlength;
      }

      return null;
    },
  },

  methods: {
    focus() {
      const comp = this.$refs.value;

      if (comp) {
        comp.focus();
      }
    },

    select() {
      const comp = this.$refs.value;

      if (comp) {
        comp.select();
      }
    },

    /**
     * Emit on input with delay
     * Note: Arrow function is avoided due context binding
     */
    delayInput(value) {
      this.$emit('input', value);
    },

    onFocus() {
      this.onFocusLabeled();
    },

    onBlur(event) {
      this.$emit('blur', event);
      this.onBlurLabeled();
    },

    escapeHtml,
  },
};
</script>

<template>
  <div
    class="labeled-input"
    :class="{
      focused,
      [mode]: true,
      disabled: isDisabled,
      [status]: status,
      suffix: hasSuffix,
    }"
  >
    <slot name="label">
      <label>
        <t v-if="labelKey" :k="labelKey" />
        <template v-else-if="label">{{ label }}</template>

        <span v-if="required" class="required">*</span>
      </label>
    </slot>

    <slot name="prefix" />

    <slot name="field">
      <TextAreaAutoGrow
        v-if="type === 'multiline' || type === 'multiline-password'"
        ref="value"
        v-bind="$attrs"
        :maxlength="_maxlength"
        :disabled="isDisabled"
        :value="value"
        :placeholder="_placeholder"
        autocapitalize="off"
        :class="{ conceal: type === 'multiline-password' }"
        @input="onInput($event)"
        @focus="onFocus"
        @blur="onBlur"
      />
      <input
        v-else
        ref="value"
        :class="{ 'no-label': !hasLabel }"
        v-bind="$attrs"
        :maxlength="_maxlength"
        :disabled="isDisabled"
        :type="type === 'cron' ? 'text' : type"
        :value="value"
        :placeholder="_placeholder"
        autocomplete="off"
        autocapitalize="off"
        :data-lpignore="ignorePasswordManagers"
        @input="onInput($event.target.value)"
        @focus="onFocus"
        @blur="onBlur"
      />
    </slot>

    <slot name="suffix" />
    <LabeledTooltip
      v-if="tooltipKey && !focused"
      :hover="hoverTooltip"
      :value="t(tooltipKey)"
      :status="status"
    />
    <LabeledTooltip
      v-else-if="tooltip && !focused"
      :hover="hoverTooltip"
      :value="tooltip"
      :status="status"
    />
    <label v-if="cronHint" class="cron-label">{{ cronHint }}</label>
    <label v-if="subLabel" class="sub-label">{{ subLabel }}</label>
  </div>
  </div>
</template>

<style>
.validation-message {
  padding: 5px;
  position: absolute;
  bottom: -35px;
}
</style>
