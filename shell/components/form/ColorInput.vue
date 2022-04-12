<script>
import { _EDIT, _VIEW } from '@shell/config/query-params';

export default {
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
    }
  },

  mounted() {
    // Ensures that if the default value is used, the model is updated with it
    this.$emit('input', this.inputValue);
  }
};
</script>

<template>
  <div class="color-input" :class="{[mode]:mode, disabled: mode !== editMode}">
    <label class="text-label"><t v-if="labelKey" :k="labelKey" :raw="true" />{{ label }}</label>
    <div class="preview-container" @click.stop="$refs.input.click">
      <span :style="{'background-color': inputValue}" class="color-display">
        <input
          ref="input"
          type="color"
          :disabled="mode !== editMode"
          :value="inputValue"
          @input="$emit('input', $event.target.value)"
        />
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
