<script>
export default {
  props: {
    value: {
      type:    [Boolean, String],
      default: false
    },
    name: {
      type:    String,
      default: ''
    },
    label: {
      type:    String,
      default: ''
    },
    grouped: {
      type:    Boolean,
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

  methods: {
    clicked() {
      this.$emit('input', this.value);
    },
  }
};
</script>

<template>
  <label class="radio-container" :class="{disabled}">
    <label
      ref="radio"
      class="radio-button"
      :tabindex="grouped ? -1 : 0"
    >
      <input
        :checked="value"
        type="radio"
        :name="name"
        :tabindex="-1"
        :indeterminate="disabled||indeterminate"
        @keyup.10="clicked"
        @click.stop="clicked"
      />
      <span class="radio-custom" :class="{indeterminate:indeterminate || disabled}"><span /></span>
    </label>
    <span class="radio-label" @click.stop="clicked">{{ label }}</span>
  </label>
</template>

<style lang='scss'>
.radio-button {
    display: block;
    position: relative;
    cursor: pointer;
    font-size: 12px;
    line-height: 18px;
    height: 12px;
    width: 12px;
    clear: both;
}

.radio-button input {
    position: absolute;
    opacity: 0;
    cursor: pointer;
}

.radio-button .radio-custom {
    position: absolute;
    top: 0px;
    left: 0px;
    height: 12px;
    width: 12px;
    background-color: transparent;
    border-radius: 50%;
    transition: all 0.3s ease-out;
    border: 1px solid var(--border);
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
}

.radio-button input:checked ~ .radio-custom {
    background-color: transparent;
    border-radius: 50%;
    /* -webkit-transform: rotate(0deg) scale(1);
    -ms-transform: rotate(0deg) scale(1);
    transform: rotate(0deg) scale(1); */
    opacity:1;
    // border: 2px solid var(--dropdown-text);
    border:none;
}

.radio-button .radio-custom > span {
    content: "";
    height: 0px;
    width: 0px;
    opacity:1;
}

.radio-button input:checked ~ .radio-custom > span {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--dropdown-text);

}

.radio-button input:checked ~ .radio-custom.indeterminate > span {
  width:3px;
  height: 3px;
  border-radius: 50%;
  background: var(--dropdown-text);
}

.radio-button input:checked ~ .radio-custom.indeterminate  {
  border: 2px solid var(--dropdown-text);

}

.radio-container{
  display: flex;
  align-items: center;
  & > * {
    margin: 3px;
  }
  &.disabled * {
    color: var(--input-disabled-text);
    border-color: var(--input-disabled-text)
  }
}
.radio-label {
  color:  var( --input-label );
}
</style>
