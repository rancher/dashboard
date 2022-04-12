<script>
import CompactInput from '@shell/mixins/compact-input';
import LabeledFormElement from '@shell/mixins/labeled-form-element';
import TextAreaAutoGrow from '@shell/components/form/TextAreaAutoGrow';
import LabeledTooltip from '@shell/components/form/LabeledTooltip';
import { escapeHtml } from '@shell/utils/string';
import cronstrue from 'cronstrue';
import { isValidCron } from 'cron-validator';

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
    }
  },

  computed: {
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

    onFocus() {
      this.onFocusLabeled();
    },

    onBlur() {
      this.$emit('blur');
      this.onBlurLabeled();
    },

    escapeHtml,
  },
};
</script>

<template>
  <div
    :class="{
      'labeled-input': true,
      focused,
      [mode]: true,
      disabled: isDisabled,
      [status]: status,
      suffix: hasSuffix,
      'has-tooltip': hasTooltip,
      'compact-input': isCompact,
      hideArrows
    }"
  >
    <slot name="label">
      <label v-if="hasLabel">
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
        @input="$emit('input', $event)"
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
        @input="$emit('input', $event.target.value)"
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
</template>
<style scoped lang="scss">
  .labeled-input.view {
    input {
      text-overflow: ellipsis;
    }
  }

.hideArrows {
  /* Hide arrows on number input when it overlaps with the unit */
  /* Chrome, Safari, Edge, Opera */
  input::-webkit-outer-spin-button,
  input::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  /* Firefox */
  input[type=number] {
    -moz-appearance: textfield;
  }
}

</style>
