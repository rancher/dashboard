<script lang="ts">
import { defineComponent } from 'vue';
import TextAreaAutoGrow from '@components/Form/TextArea/TextAreaAutoGrow.vue';
import LabeledTooltip from '@components/LabeledTooltip/LabeledTooltip.vue';
import { escapeHtml } from '@shell/utils/string';
import cronstrue from 'cronstrue';
import { isValidCron } from 'cron-validator';
import { debounce } from 'lodash';
import { useLabeledFormElement, labeledFormElementProps } from '@shell/composables/useLabeledFormElement';
import { useCompactInput } from '@shell/composables/useCompactInput';

declare module 'vue/types/vue' {
  interface Vue {
    onInput: (event: Event) => void | ((event: Event) => void);
  }
}

export default defineComponent({
  components: { LabeledTooltip, TextAreaAutoGrow },

  inheritAttrs: false,

  props: {
    ...labeledFormElementProps,
    /**
     * The type of the Labeled Input.
     * @values text, cron, multiline, multiline-password
     */
    type: {
      type:    String,
      default: 'text'
    },

    /**
     * The status class of the Labeled Input and tooltip.
     * @values info, success, warning, error
     */
    status: {
      type:    String,
      default: null
    },

    /**
     * The sub-label for the Labeled Input.
     */
    subLabel: {
      type:    String,
      default: null
    },

    /**
     * The tooltip to display for the Labeled Input.
     */
    tooltip: {
      default: null,
      type:    [String, Object]
    },

    /**
     * Renders the tooltip when hovering the cursor over the Labeled Input.
     */
    hoverTooltip: {
      type:    Boolean,
      default: true
    },

    /**
     * Disables the password manager prompt to save the contents of the Labeled
     * Input.
     */
    ignorePasswordManagers: {
      default: false,
      type:    Boolean
    },

    /**
     * The max length of the Labeled Input.
     */
    maxlength: {
      type:    Number,
      default: null
    },

    /**
     * Hides arrows on the Labeled Input.
     * @deprecated This doesn't appear to be in use for Labeled Input.
     */
    hideArrows: {
      type:    Boolean,
      default: false
    },

    /**
     * Optionally delay on input while typing.
     */
    delay: {
      type:    Number,
      default: 0
    },
  },

  setup(props, { emit }) {
    const {
      focused,
      onFocusLabeled,
      onBlurLabeled,
      isDisabled,
      validationMessage,
      requiredField
    } = useLabeledFormElement(props, emit);
    const { isCompact } = useCompactInput(props);

    return {
      focused,
      onFocusLabeled,
      onBlurLabeled,
      isDisabled,
      validationMessage,
      requiredField,
      isCompact,
    };
  },

  data() {
    return {
      updated:          false,
      validationErrors: '',
    };
  },

  computed: {
    /**
     * Determines if the Labeled Input should display a label.
     */
    hasLabel(): boolean {
      return this.isCompact ? false : !!this.label || !!this.labelKey || !!this.$slots.label;
    },

    /**
     * Determines if the Labeled Input should display a tooltip.
     */
    hasTooltip(): boolean {
      return !!this.tooltip || !!this.tooltipKey;
    },

    tooltipValue(): string | Record<string, unknown> | undefined {
      if (this.hasTooltip) {
        return this.tooltipKey ? this.t(this.tooltipKey) : this.tooltip;
      }

      return undefined;
    },

    /**
     * Determines if the Labeled Input makes use of the suffix slot.
     */
    hasSuffix(): boolean {
      return !!this.$slots.suffix;
    },

    /**
     * Determines if the Labeled Input should display a cron hint.
     */
    cronHint(): string | undefined {
      if (this.type !== 'cron' || !this.value) {
        return;
      }
      if (typeof this.value === 'string' && !isValidCron(this.value)) {
        return this.t('generic.invalidCron');
      }
      try {
        const hint = cronstrue.toString(this.value);

        return hint;
      } catch (e) {
        return this.t('generic.invalidCron');
      }
    },

    /**
     * The placeholder value for the Labeled Input.
     */
    _placeholder(): string {
      if (this.placeholder) {
        return this.placeholder.toString();
      }
      if (this.placeholderKey) {
        return this.t(this.placeholderKey);
      }

      return '';
    },

    /**
     * The max length for the Labeled Input.
     */
    _maxlength(): number | undefined {
      if (this.type === 'text' && this.maxlength) {
        return this.maxlength;
      }

      return undefined;
    },
  },

  created() {
    /**
     * Determines if the Labeled Input @input event should be debounced.
    */
    this.onInput = this.delay ? debounce(this.delayInput, this.delay) : this.delayInput;
  },

  methods: {
    /**
     * Attempts to give the Labeled Input focus.
     */
    focus(): void {
      const comp = this.$refs.value as HTMLInputElement;

      if (comp) {
        comp.focus();
      }
    },

    /**
     * Attempts to select the Labeled Input.
     * @deprecated
     */
    select(): void {
      const comp = this.$refs.value as HTMLInputElement;

      if (comp) {
        comp.select();
      }
    },

    /**
     * Emit on input change
     */
    onChange(event: Event): void {
      this.$emit('change', event);
    },

    /**
     * Emit on input with delay. Note: Arrow function is avoided due context
     * binding.
     *
     * NOTE: In multiline, TextAreaAutoGrow emits a string with the value
     * https://github.com/rancher/dashboard/issues/10249
     */
    delayInput(val: string | Event): void {
      const value = typeof val === 'string' ? val : (val?.target as HTMLInputElement)?.value;

      this.$emit('input', value);
    },

    /**
     * Handles the behavior of the Labeled Input when given focus.
     * @see labeled-form-element.ts mixin for onFocusLabeled()
     */
    onFocus(): void {
      this.onFocusLabeled();
    },

    /**
     * Handles the behavior of the Labeled Input when blurred and emits the blur
     * event.
     * @see labeled-form-element.ts mixin for onBlurLabeled()
     */
    onBlur(event: string | FocusEvent): void {
      this.$emit('blur', event);
      this.onBlurLabeled();
    },

    escapeHtml
  }
});
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
        <t
          v-if="labelKey"
          :k="labelKey"
        />
        <template v-else-if="label">{{ label }}</template>

        <span
          v-if="requiredField"
          class="required"
        >*</span>
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
        @input="onInput"
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
        @input="onInput"
        @focus="onFocus"
        @blur="onBlur"
        @change="onChange"
      >
    </slot>

    <slot name="suffix" />
    <LabeledTooltip
      v-if="hasTooltip && !focused"
      :hover="hoverTooltip"
      :value="tooltipValue"
      :status="status"
    />
    <LabeledTooltip
      v-if="!!validationMessage"
      :hover="hoverTooltip"
      :value="validationMessage"
    />
    <div
      v-if="cronHint || subLabel"
      class="sub-label"
    >
      <div
        v-if="cronHint"
      >
        {{ cronHint }}
      </div>
      <div
        v-if="subLabel"
        v-clean-html="subLabel"
      />
    </div>
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
<style>
.validation-message {
  padding: 5px;
  position: absolute;
  bottom: -35px;
}
</style>
