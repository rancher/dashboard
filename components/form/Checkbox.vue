<script>
export default {
  props: {
    value: {
      type:    Boolean,
      default: false
    },
    label: {
      type:    String,
      default: ''
    }
  },
  data() {
    return { status: this.value };
  },
  methods: {
    clicked() {
      this.status = !this.status;
      this.$emit('input', this.status);
    }
  }
};
</script>

<template>
  <label class="checkbox-container">
    <label class="checkbox-box">
      <input
        :checked="value"
        type="checkbox"
        @input="clicked"
      />
      <span class="checkbox-custom"></span>
    </label>
    <span v-if="label" class="checkbox-label">{{ label }}</span>
  </label>
</template>

<style>
.checkbox-container {
  display: flex;
  align-items: center;
  margin-right: 10px;
}
.checkbox-label {
  color: var(--input-label);
}
.checkbox-box {
    display: block;
    position: relative;
    margin-right: 3px;
    cursor: pointer;
    font-size: 18px;
    line-height: 24px;
    height: 18px;
    width: 18px;
    clear: both;
}

.checkbox-box input {
    position: absolute;
    opacity: 0;
    cursor: pointer;
}

.checkbox-box .checkbox-custom {
    position: absolute;
    top: 0px;
    left: 0px;
    height: 18px;
    width: 18px;
    background-color: transparent;
    border-radius: 3px;
    transition: all 0.3s ease-out;
    border: 1px solid var( --input-label );
}

.checkbox-box input:checked ~ .checkbox-custom {
    background-color:var(--dropdown-text);
    border-radius: 3px;
    -webkit-transform: rotate(0deg) scale(1);
    -ms-transform: rotate(0deg) scale(1);
    transform: rotate(0deg) scale(1);
    opacity:1;
    border: 1px solid var(--dropdown-text);
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
  width: 6px;
  height: 12px;
  border: solid;
  border-color: var(--input-text);
  border-width: 0 2px 2px 0;
  background-color: transparent;
  border-radius: 0;
}
</style>
