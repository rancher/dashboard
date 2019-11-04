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
      default: () => {
        return this.options
        ;
      }
    }
  },
  data() {
    const statuses = {};

    this.options.forEach((option, index) => {
      statuses[option] = index === this.selected;
    });

    return { statuses };
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
    }
  }
};
</script>

<template>
  <div>
    <RadioButton
      v-for="(option, i) in options"
      :key="option"
      :value="statuses[option]"
      :label="labels[i]"
      @input="select(option)"
    />
  </div>
</template>
