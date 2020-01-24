<script>
export default {
  props: {
    value: {
      type:    Boolean,
      default: false
    },
    label: {
      type:    [String, Boolean],
      default: false
    },
    disabled: {
      type:    Boolean,
      default: false
    },
    indeterminate: {
      type:    Boolean,
      default: false
    }
  },
  computed: {
    isDisabled() {
      return (this.disabled );
    }
  },
  methods: {
    clicked() {
      if (!this.isDisabled) {
        this.$el.click();
        this.$emit('input', !this.value);
      }
    }
  }
};
</script>

<template>
  <label
    class="checkbox-container"
  >
    <label class="checkbox-box">
      <input
        :checked="value"
        :v-model="value"
        type="checkbox"
        :tabindex="-1"
        @click.stop.prevent
      />
      <span
        class="checkbox-custom"
        :class="{indeterminate: indeterminate}"
        :tabindex="isDisabled ? -1 : 0"
        :aria-label="label"
        :aria-checked="!!value"
        role="checkbox"
        @keyup.16="clicked"
        @click.stop="clicked"
      ></span>
    </label>
    <span
      v-if="label"
      class="checkbox-label"
      @click.stop="clicked"
    >
      <slot name="label">  {{ label }}</slot>
    </span>
  </label>
</template>

<style lang='scss'>
.checkbox-container {
  display: inline-flex;
  align-items: center;
}
.checkbox-label {
  color: var(--input-label);
  margin: 3px 10px 3px 0;
}
.checkbox-box {
    display: inline-block;
    position: relative;
    cursor: pointer;
    font-size: 18px;
    line-height: 24px;
    height: 0.8em;
    width: 18px;
    clear: both;
}

.checkbox-box input {
    position: absolute;
    left: 0;
    opacity: 0;
    cursor: pointer;
}

.checkbox-box .checkbox-custom {
    position: absolute;
    top: 0px;
    left: 0px;
    height: 14px;
    width: 14px;
    background-color: transparent;
    border-radius: 2px;
    transition: all 0.3s ease-out;
    border: 1px solid var(--border);
}

.checkbox-box input:checked ~ .checkbox-custom {
    background-color:var(--dropdown-text);
    border-radius: 3px;
    -webkit-transform: rotate(0deg) scale(1);
    -ms-transform: rotate(0deg) scale(1);
    transform: rotate(0deg) scale(1);
    opacity:1;
    border: 1px solid var(--input-label);
    &.indeterminate{
      background-color: transparent;
      border: 1px solid var(--border)
    }
}

.checkbox-box .checkbox-custom::after {
    position: absolute;
    content: "";
    left: 0px;
    top: 0px;
    height: 0px;
    width: 0px;
    border-radius: 3px;
    border: solid;
    border-color: var(--input-text);
    border-width: 0 3px 3px 0;
    -webkit-transform: rotate(0deg) scale(0);
    -ms-transform: rotate(0deg) scale(0);
    transform: rotate(0deg) scale(0);
    opacity:1;
}

.checkbox-box input:checked ~ .checkbox-custom::after {
  -webkit-transform: rotate(45deg) scale(1);
  -ms-transform: rotate(45deg) scale(1);
  transform: rotate(45deg) scale(1);
  opacity:1;
  left: 4px;
  width: 4px;
  height: 10px;
  border: solid;
  border-color: var(--input-text);
  border-width: 0 2px 2px 0;
  background-color: transparent;
  border-radius: 0;
}
.checkbox-box input:checked ~ .checkbox-custom.indeterminate::after {
  -webkit-transform:  scale(1);
  -ms-transform:  scale(1);
  transform:  scale(1);
  opacity:1;
  left: 2px;
  top:2px;
  width: 7px;
  height: 5px;
  border: solid;
  border-color: var(--dropdown-text);
  border-width: 0 0 2px 0;
  background-color: transparent;
  border-radius: 0;
}
</style>
