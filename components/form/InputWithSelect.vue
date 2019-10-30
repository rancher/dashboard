<script>
import LabeledInput from '@/components/form/LabeledInput';
export default {
  components: { LabeledInput },
  props:      {
    label: {
      type:    String,
      default: ''
    },
    options: {
      type:     Array,
      required: true
    },
    inputString: {
      type:    String,
      default: ''
    }
  },
  data() {
    return {
      selected: this.options[0],
      string:   this.inputString
    };
  },
  methods: {
    change() {
      this.$emit('input', { option: this.selected, string: this.string });
    }
  }
};
</script>

<template>
  <span class="input-container" @input="change">
    <v-select
      v-model="selected"
      class="in-input"
      :options="options"
      :clearable="false"
      :searchable="false"
      @input="change"
    />
    <LabeledInput v-model="string" :label="label" :value="string" />
  </span>
</template>

<style lang='scss'>
.input-container{
    display: flex;
    align-items: stretch;
}
.v-select.in-input{
    flex-basis:20%;
    .vs__selected {
        margin: auto;
        color: var(--input-text)
    }
    .vs__dropdown-menu {
        min-width: 0px;
    }
    .vs__dropdown-toggle {
         background-color: var(--input-label);
        border:none;
        height: 100%;
        padding: none;
    }
    .vs__selected-options {
        display: -webkit-box;
    }
    .vs__search {
        display: none;
    }
    .vs__open-indicator{
        fill: var(--input-text);
    }
}
</style>
