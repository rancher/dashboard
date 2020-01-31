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
    selected: {
      type:    Number,
      default: -1
    },
    labels: {
      type:    Array,
      default: null
    },
    row: {
      type:    Boolean,
      default: false
    }
  },
  data() {
    const statuses = {};

    this.options.forEach((option, index) => {
      statuses[option] = index === this.selected;
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
      const newSelection = this.options[this.selected + direction];

      this.select(newSelection);
    }
  }
};
</script>

<template>
  <div
    ref="radio-group"
    class="radio-group"
    :style="{display:row?'flex':'block'}"
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
      :class="{focused:focused&&selected===i}"
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
