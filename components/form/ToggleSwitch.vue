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
    },
    pref: {
      type:    String,
      default: null
    }
  },
  data() {
    let state = !!this.on;

    if (this.pref) {
      state = this.$store.getters['prefs/get'](this.pref);
      this.$emit('input', state);
    }

    return { state };
  },
  methods: {
    toggle() {
      this.state = !this.state;
      if (this.pref) {
        this.$store.dispatch('prefs/set', { key: this.pref, value: this.state });
      }
      this.$emit('input', this.state);
    }
  }
};
</script>

<template>
  <span class="toggle-container">
    <span class="label" :class="{ active: !state}">{{ labels[0] }}</span>
    <label class="switch">
      <input type="checkbox" :checked="state" @input="toggle">
      <span class="slider round"></span>
    </label>
    <span class="label" :class="{ active: state}">{{ labels[1] }}</span>
  </span>
</template>

<style lang="scss" scoped>
$toggle-height: 16px;

.toggle-container {
  align-items: center;
  display: flex;

  span:first-child {
    padding-right: 6px;
  }
  span:last-child {
    padding-left: 6px;
  }
}
/* The switch - the box around the slider */
.switch {
  position: relative;
  display: inline-block;
  width: 48px;
  height: $toggle-height + 8px;
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
  background-color: var(--checkbox-disabled-bg);
  -webkit-transition: .4s;
  transition: .4s;
}

.slider:before {
  position: absolute;
  content: "";
  height: $toggle-height;
  width: $toggle-height;
  left: 4px;
  bottom: 4px;
  background-color: var(--checkbox-tick);
  -webkit-transition: .4s;
  transition: .4s;
}

input:checked + .slider {
  background-color: var(--checkbox-ticked-bg);
}

input:focus + .slider {
  box-shadow: 0 0 1px var(--checkbox-ticked-bg);
}

input:checked + .slider:before {
  transform: translateX(24px);
}

/* Rounded sliders */
.slider.round {
  border-radius: 34px;
}

.slider.round:before {
  border-radius: 50%;
}
</style>
