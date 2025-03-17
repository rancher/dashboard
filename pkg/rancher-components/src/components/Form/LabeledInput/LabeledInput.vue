<script lang="ts">
import { defineComponent, inject } from 'vue';
import TextAreaAutoGrow from '@components/Form/TextArea/TextAreaAutoGrow.vue';
import LabeledTooltip from '@components/LabeledTooltip/LabeledTooltip.vue';
import { escapeHtml, generateRandomAlphaString } from '@shell/utils/string';
import cronstrue from 'cronstrue';
import { isValidCron } from 'cron-validator';
import { debounce } from 'lodash';
import { useLabeledFormElement, labeledFormElementProps } from '@shell/composables/useLabeledFormElement';
import { useCompactInput } from '@shell/composables/useCompactInput';

interface NonReactiveProps {
  onInput: (event: Event) => void | ((event: Event) => void);
}

const provideProps: NonReactiveProps = {
  onInput() {
    // noop
  },
};

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

    class: {
      type:    String,
      default: ''
    },

    /**
     * Optionally use this to comply with a11y IF there's no label
     * associated with the input
     */
    ariaLabel: {
      type:    String,
      default: ''
    }
  },

  emits: ['change', 'update:value', 'blur', 'update:validation'],

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

    const onInput = inject('onInput', provideProps.onInput);

    return {
      focused,
      onFocusLabeled,
      onBlurLabeled,
      onInput,
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
      inputId:          `input-${ generateRandomAlphaString(12) }`
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

      // TODO - #13202: This is required due use of 2 libraries and 3 different libraries through the code.
      const predefined = [
        '@yearly',
        '@annually',
        '@monthly',
        '@weekly',
        '@daily',
        '@midnight',
        '@hourly'
      ];
      const isPredefined = predefined.includes(this.value as string);

      // refer https://github.com/GuillaumeRochat/cron-validator#readme
      if (!isPredefined && !isValidCron(this.value as string, {
        alias:              true,
        allowBlankDay:      true,
        allowSevenAsSunday: true,
      })) {
        return this.t('generic.invalidCron');
      }

      try {
        const hint = cronstrue.toString(this.value as string || '', { verbose: true });

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

    className() {
      return this.class;
    }
  },

  mounted() {
    const id = this.$attrs?.id as string | undefined;

    if (id) {
      this.inputId = id;
    }
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

      this.$emit('update:value', value);
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
      'v-popper--has-tooltip': hasTooltip,
      'compact-input': isCompact,
      hideArrows,
      [className]: true
    }"
  >
    <slot name="label">
      <label
        v-if="hasLabel"
        :for="inputId"
      >
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
        :id="inputId"
        ref="value"
        v-bind="$attrs"
        v-stripped-aria-label="!hasLabel && ariaLabel ? ariaLabel : undefined"
        :maxlength="_maxlength"
        :disabled="isDisabled"
        :value="value || ''"
        :placeholder="_placeholder"
        autocapitalize="off"
        :class="{ conceal: type === 'multiline-password' }"
        @update:value="onInput"
        @focus="onFocus"
        @blur="onBlur"
      />
      <input
        v-else
        :id="inputId"
        ref="value"
        v-stripped-aria-label="!hasLabel && ariaLabel ? ariaLabel : undefined"
        role="textbox"
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
    <!-- informational tooltip about field -->
    <LabeledTooltip
      v-if="hasTooltip"
      :hover="hoverTooltip"
      :value="tooltipValue"
      :status="status"
    />
    <!-- validation tooltip -->
    <LabeledTooltip
      v-if="!!validationMessage"
      :hover="hoverTooltip"
      :value="validationMessage"
    />
    <div
      v-if="cronHint || subLabel"
      class="sub-label"
      data-testid="sub-label"
    >
      <div
        v-if="cronHint"
        role="alert"
        :aria-label="cronHint"
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
