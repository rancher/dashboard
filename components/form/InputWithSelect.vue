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
      console.log('inputwithselect change');
      this.$emit('input', { option: this.selected, string: this.string });
    }
  }
};
</script>

<template>
  <div class="input-container" @input="change" @change="change">
    <v-select
      v-model="selected"
      class="in-input"
      :options="options"
      :clearable="false"
      :searchable="false"
      @input="change"
    />
    <LabeledInput v-model="string" class="input-string" :label="label" :value="string" />
  </div>
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
        background-color: var(--default-text);
        border:none;
        height: 100%;
        padding: none;
        display: flex;
        align-items: center;
    }
    .vs__selected-options {
        display: -webkit-box;
    }
    .vs__actions {
      padding: 0 4px 0 0;
    }
    .vs__search {
        display: none;
    }
    .vs__open-indicator{
        fill: var(--input-text);
        transform: scale(0.75)
    }
}
</style>
