<script>
export default {
  props: {
    value: {
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
  }
};
</script>

<template>
  <div class="color-input" :class="{[mode]:mode}">
    <label class="text-label"><t v-if="labelKey" :k="labelKey" :raw="true" />{{ label }}</label>
    <div class="preview-container" @click.stop="$refs.input.click">
      <span :style="{'background-color': value}" class="color-display">
        <input ref="input" type="color" :value="value" @input="$emit('input', $event.target.value)" />
      </span>
      <span class="text-muted">{{ value }}</span>
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

  }

  .color-display{
    border: 1px solid var(--border);

    &:focus {
      outline: none;
      box-shadow: 0 0 0 var(--outline-width) var(--outline);
      background: var(--input-focus-bg);
      color: var(--outline);
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
