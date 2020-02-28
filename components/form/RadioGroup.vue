<script>
import RadioButton from '@/components/form/RadioButton';
export default {
  components: { RadioButton },
  props:      {
    options: {
      type:     Array,
      required: true
    },
    canNone: {
      type:    Boolean,
      default: false
    },
    value: {
      type:    [Boolean, String],
      default: null
    },
    labels: {
      type:    Array,
      default: null
    },
    row: {
      type:    Boolean,
      default: false
    },
    disabled: {
      type:    Boolean,
      default: false
    },
    mode: {
      type:    String,
      default: 'edit'
    }
  },
  data() {
    const statuses = {};

    this.options.forEach((option, index) => {
      statuses[option] = option === this.value;
    });

    return { statuses, focused: false };
  },
  computed: {
    labelsToUse() {
      if (this.labels) {
        return this.labels;
      } else {
        return this.options;
      }
    },
    selectedIndex() {
      if (this.value) {
        return this.options.indexOf(this.value);
      } else {
        for (const option in this.statuses) {
          if (this.statuses[option]) {
            return this.options.indexOf(option);
          }
        }

        return 0;
      }
    },
  },
  watch: {
    value() {
      this.options.forEach((option, index) => {
        this.statuses[option] = option === this.value;
      });
    }
  },
  methods: {
    select(option) {
      const newStatus = this.canNone ? !this.statuses[option] : true;

      this.clear();
      this.statuses[option] = newStatus;
      this.$emit('input', option);
    },
    clear() {
      for (const option of this.options) {
        this.statuses[option] = false;
      }
    },

    focusGroup() {
      this.focused = true;
    },
    blurred() {
      this.focused = false;
    },

    clickNext(direction) {
      const newSelection = this.options[this.value + direction];

      this.select(newSelection);
    }
  }
};
</script>

<template>
  <div
    ref="radio-group"
    class="radio-group"
    tabindex="0"
    @focus="focusGroup"
    @blur="blurred"
    @keyup.39.stop="clickNext(1)"
    @keyup.37.stop="clickNext(-1)"
  >
    <RadioButton
      v-for="(option, i) in options"
      :key="option"
      :ref="`radio-${i}`"
      :value="statuses[option]"
      :label="labelsToUse[i]"
      grouped
      :class="{focused:focused&&selectedIndex===i}"
      :disabled="disabled || mode=='view'"
      @input="select(option)"
    />
  </div>
</template>

<style>
.radio-group:focus{
  border:none;
  outline:none;
}
</style>
