<script>
import LabeledFormElement from '@/mixins/labeled-form-element';
import TextAreaAutoGrow from '@/components/form/TextAreaAutoGrow';
import LabeledTooltip from '@/components/form/LabeledTooltip';
import { escapeHtml } from '@/utils/string';
import cronstrue from 'cronstrue';
import { isValidCron } from 'cron-validator';

export default {
  components: { LabeledTooltip, TextAreaAutoGrow },
  mixins:     [LabeledFormElement],

  props: {
    type: {
      type:    String,
      default: 'text',
    },

    status: {
      type:      String,
      default:   null
    },

    tooltip: {
      default: null,
      type:    [String, Object]
    },

    hoverTooltip: {
      type:    Boolean,
      default: true,
    },

    ignorePasswordManagers: {
      default: false,
      type:    Boolean,
    },

    validators: {
      // validators is expected to be an array of functions
      // where each function takes the input value as an
      // argument. If the validation passes, the function
      // returns { isValid: true }. If the validation fails,
      // the function returns:
      //
      // { isValid: false, errorMessage: "Error goes here." }
      type:    Array,
      default: () => {
        return [];
      },
    },
  },

  data() {
    return {
      touched:          false,
      validationErrors: ''
    };
  },

  computed: {
    hasLabel() {
      return !!this.label || !!this.labelKey || !!this.$slots.label;
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

    validationErrors() {
      if (!this.touched) {
        return '';
      }

      // Combine all active validation
      // errors into a string to be displayed
      // beneath the input.
      return this.validators
        .map((validator) => {
          try {
            const validationResult = validator(this.value);

            if (!validationResult.isValid) {
              return validationResult.errorMessage;
            }

            return '';
          } catch {
            alert(`Could not validate the field using the validator ${ validator.name }.`);
          }
        })
        .join('');
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
      this.touched = true;
    },

    onBlur() {
      this.$emit('blur');
      this.onBlurLabeled();
    },

    updateValidationErrors() {
      // Can be used to update the validity of a form as a whole.
      this.$emit('setValid');

      // Don't show error messages if the user hasn't entered input or
      // if no validators apply.
      if (!this.touched || this.value.length === 0 || this.validators.length === 0) {
        return;
      }

      // Combine all active validation errors for this field
      // into a string to be displayed beneath the input.
      const errorMessageReducer = ( previousValue, currentValidator ) => {
        try {
          const validationResult = currentValidator(this.value);

          if (!validationResult.isValid) {
            return `${ previousValue } ${ validationResult.errorMessage }`;
          }

          return previousValue;
        } catch (error) {
          alert(`Could not validate the field using the validator ${ currentValidator.name }. ${ error }`);
        }
      };

      const errorString = this.validators.reduce(errorMessageReducer, '');

      this.validationErrors = errorString;
    },

    escapeHtml,
  },
};
</script>

<template>
  <div>
    <div
      :class="{
        'labeled-input': true,
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
          @keyup="updateValidationErrors"
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
    </div>
    <div
      v-if="validationErrors.length > 0"
      class="validation-message"
    >
      {{ validationErrors }}
    </div>
  </div>
</template>

<style>
.validation-message {
  padding: 5px;
}
</style>
