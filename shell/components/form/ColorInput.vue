<script>
import { _EDIT, _VIEW } from '@shell/config/query-params';

export default {
  emits: ['update:value'],

  props: {
    value: {
      type:    String,
      default: ''
    },

    defaultValue: {
      type:    String,
      default: ''
    },

    label: {
      type:    String,
      default: null
    },

    labelKey: {
      type:    String,
      default: null
    },

    mode: {
      type: String,
      validator(value) {
        return [_EDIT, _VIEW].includes(value);
      },
      default: _EDIT,
    },

    /**
     * Inherited global identifier prefix for tests
     * Define a term based on the parent component to avoid conflicts on multiple components
     */
    componentTestid: {
      type:    String,
      default: 'color-input'
    },

    disabled: {
      type:    Boolean,
      default: false,
    }
  },

  data() {
    return {
      viewMode: _VIEW,
      editMode: _EDIT
    };
  },

  computed: {
    /**
     * Allow UI to set a default value.
     */
    inputValue() {
      return this.value ? this.value : this.defaultValue;
    },

    isDisabled() {
      const disabled = this.disabled;

      return this.mode !== this.editMode || disabled;
    }
  },

  mounted() {
    // Ensures that if the default value is used, the model is updated with it
    this.$emit('update:value', this.inputValue);
  },

  methods: {
    handleKeyup(ev) {
      if (this.isDisabled) {
        return '';
      }

      return this.$refs.input.click(ev);
    }
  },

  // according to https://www.w3.org/TR/html-aria/
  // input type="color" has no applicable role
  // and only aria-label and aria-disabled
};
</script>

<template>
  <div
    class="color-input"
    :class="{[mode]:mode, disabled: isDisabled}"
    :data-testid="componentTestid + '-color-input'"
    :tabindex="isDisabled ? -1 : 0"
    @keydown.space.prevent
    @keyup.enter.space.stop="handleKeyup($event)"
  >
    <label class="text-label"><t
      v-if="labelKey"
      :k="labelKey"
      :raw="true"
    />{{ label }}</label>
    <div
      :data-testid="componentTestid + '-color-input_preview-container'"
      class="preview-container"
      @click.stop="$refs.input.click($event)"
    >
      <span
        :style="{'background-color': inputValue}"
        class="color-display"
      >
        <input
          ref="input"
          :aria-disabled="isDisabled ? 'true' : 'false'"
          :aria-label="t('generic.colorPicker')"
          type="color"
          :disabled="isDisabled"
          tabindex="-1"
          :value="inputValue"
          @input="$emit('update:value', $event.target.value)"
        >
      </span>
      <span class="text-muted color-value">{{ inputValue }}</span>
    </div>
  </div>
</template>

<style lang='scss' scoped>
.color-input {
  border: 1px solid var(--border);
  border-radius: var(--border-radius);
  padding: 10px;

  &:focus-visible {
    @include focus-outline;
  }

  &.disabled, &.disabled .selected, &[disabled], &[disabled]:hover {
    color: var(--input-disabled-text);
    background-color: var(--input-disabled-bg);
    outline-width: 0;
    border-color: var(--input-disabled-border);
    cursor: not-allowed;

    label, span, div, input {
      cursor: not-allowed !important;
    }

    label {
      color: var(--input-disabled-label);
      display: inline-block;
      z-index: 1;
    }
    &::placeholder {
        color: var(--input-disabled-placeholder);
    }
  }

  LABEL{
    display: block;
  }

  .preview-container{
    &:hover {
      cursor: pointer;
    }

    .color-value {
      margin-left: 4px;
    }
  }

  .color-display{
    border: 1px solid var(--border);

    &:focus {
      outline: none;
      box-shadow: 0 0 0 var(--outline-width) var(--outline);
      background: var(--input-focus-bg);
    }
  }

  INPUT{
    border: none;
    padding: 0;
    width: 23px;
    height: 23px;
    -webkit-appearance: none;
    opacity: 0;
    &:hover {
      cursor: pointer;
    }
  }
}
</style>
