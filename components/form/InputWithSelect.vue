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
    },
    blurred() {
      console.log('blurred');
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
      @search:focused="blurred"
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
       margin: 0;
        color: var(--input-text)
    }
    .vs__dropdown-menu {
        min-width: 0px;
        .vs__dropdown-option {
          padding: 3px 5px;
        }
    }
    .vs__dropdown-toggle {
        background-color: var(--primary-transparent);
        border-color: var(--primary);
        color: var(--primary) !important;
        height: 100%;
        padding: none;
        display: flex;
        align-items: stretch;
        padding: 0 8px 0 8px;
        border-radius: var(--border-radius) 0 0 var(--border-radius);
        & * {
          padding: 0
          }
    }
    .vs__selected-options {
        display: -webkit-box;
    }
    .vs__actions {
      padding: 2px;;
    }
    .vs__search {
        background-color: var(--default-text);
        width: 0px;
        padding: 0;
        align-self: center;
    }
    .vs__open-indicator{
        fill: var(--input-text);
        transform: scale(0.75)
    }
}
</style>
