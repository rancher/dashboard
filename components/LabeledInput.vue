<script>
export default {
  inheritAttrs: false,

  props: {
    type: {
      type:    String,
      default: 'text',
    },

    label: {
      type:     String,
      required: true,
    },

    required: {
      type:    Boolean,
      default: false,
    },

    placeholder: {
      type:    String,
      default: ''
    },

    value: {
      type:    String,
      default: ''
    }
  },

  data() {
    return {
      raised:  this.value,
      focused: false
    };
  },

  methods: {
    onFocus() {
      this.raised = true;
      this.focused = true;
      this.$refs.input.placeholder = this.placeholder;
    },

    onBlur() {
      this.focused = false;

      if ( !this.value ) {
        this.raised = false;
      }

      this.$refs.input.placeholder = '';
    }
  }
};
</script>

<template>
  <div :class="{'labeled-input': true, raised, focused}">
    <label>
      {{ label }}
      <span v-if="required && !value" class="required">*</span>
    </label>
    <input
      ref="input"
      v-bind="$attrs"
      :type="type"
      :value="value"
      @input="$emit('input', $event.target.value)"
      @focus="onFocus"
      @blur="onBlur"
    >
    </label>
  </div>
</template>

<style lang="scss" scoped>
  .labeled-input {
    position: relative;
    padding: 0 8px;
    margin: 10px 0;
  }

  LABEL {
    position: absolute;
    font-size: 16px;
    transform: translate(0, -5px) scale(1);
    transform-origin: top left;
    transition: all 0.1s ease-in-out;
    z-index: 1;
    color: var(--input-placeholder);
  }

  .raised LABEL {
    transform: translate(0, -20px) scale(0.75);
    color: var(--input-label);
  }

  .required {
    color: red;
  }

  INPUT {
    position: relative;
    font-size: 16px;
    display: block;
    width: 100%;
    z-index: 2;
  }

  INPUT, INPUT:hover, INPUT:focus {
    border: none;
    background-color: transparent;
    outline: 0;
    box-shadow: none;
    padding: 16px 0 12px;
  }
</style>
