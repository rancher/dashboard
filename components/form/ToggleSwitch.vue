<script>
export default {
  props: {
    on: {
      type:    Boolean,
      default: false
    },
    labels: {
      type:    Array,
      default: () => ['', '']
    }
  },
  data() {
    return { state: !!this.on };
  },
  methods: {
    toggle() {
      this.state = !this.state;
      this.$emit('input', this.state);
    }
  }
};
</script>

<template>
  <span class="toggle-container">
    <span class="label" :class="{ active: !state}"> {{ labels[0] }}</span>
    <label class="switch">
      <input type="checkbox" :checked="state" @input="toggle">
      <span class="slider round"></span>
    </label>
    <span class="label" :class="{ active: state}">  {{ labels[1] }}</span>
  </span>
</template>

<style>
/* The switch - the box around the slider */
.switch {
  position: relative;
  display: inline-block;
  width: 32px;
  height: 10px;
}

/* Hide default HTML checkbox */
.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

/* The slider */
.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--dropdown-text);
  -webkit-transition: .4s;
  transition: .4s;
}

.slider:before {
  position: absolute;
  content: "";
  height: 16px;
  width: 16px;
  left: 0px;
  bottom: -3px;
  background-color: var(--input-text);
  -webkit-transition: .4s;
  transition: .4s;
}

input:focus + .slider {
  box-shadow: 0 0 1px #2196F3;
}

input:checked + .slider:before {
  -webkit-transform: translateX(16px);
  -ms-transform: translateX(16px);
  transform: translateX(16px);
}

/* Rounded sliders */
.slider.round {
  border-radius: 34px;
}

.slider.round:before {
  border-radius: 50%;
}
.label:not(.active){
  opacity: .3;
    -webkit-transition: .4s;
  transition: .4s;
}
</style>
