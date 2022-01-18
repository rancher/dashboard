<script>
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
      type:    String,
      default: 'edit'
    }
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
  <div class="color-input" :class="{[mode]:mode}">
    <label class="text-label"><t v-if="labelKey" :k="labelKey" :raw="true" />{{ label }}</label>
    <div class="preview-container" @click.stop="$refs.input.click">
      <span :style="{'background-color': inputValue}" class="color-display">
        <input ref="input" type="color" :value="inputValue" @input="$emit('input', $event.target.value)" />
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
