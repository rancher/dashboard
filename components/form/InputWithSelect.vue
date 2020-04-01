<script>
import labeledFormElement from '@/mixins/labeled-form-element';
import LabeledInput from '@/components/form/LabeledInput';
import LabeledSelect from '@/components/form/LabeledSelect';
export default {
  components: { LabeledInput, LabeledSelect },
  mixins:     [labeledFormElement],
  props:      {
    textLabel: {
      type:    String,
      default: ''
    },
    selectLabel: {
      type:    String,
      default: ''
    },
    placeholder: {
      type:    String,
      default: ''
    },
    options: {
      type:     Array,
      required: true
    },
    textRequired: {
      type:    Boolean,
      default: false
    },
    textValue: {
      type:    String,
      default: ''
    },
    selectValue: {
      type:    String,
      default: null
    }
  },

  data() {
    return { selected: this.selectValue || this.options[0], string: this.textValue };
  },
  watch: {
    selected() {
      this.change();
    }
  },
  methods: {
    change() {
      this.$emit('input', { selected: this.selected, text: this.string });
    }
  }
};
</script>

<template>
  <div class="input-container row" @input="change">
    <LabeledSelect
      v-model="selected"
      :label="selectLabel"
      class="in-input col span-4"
      :options="options"
      :searchable="false"
      :disbaled="isView"
      :clearable="false"
      :mode="mode"
      @input="e=>selected=e.value"
    />
    <LabeledInput
      v-if="textLabel"
      ref="text"
      v-model="string"
      class="input-string col span-8"
      :label="textLabel"
      :placeholder="placeholder"
      :disabled="isView"
      :required="textRequired"
      :mode="mode"
    />
    <input
      v-else
      ref="text"
      v-model="string"
      class="input-string"
      :placeholder="placeholder"
      autocomplete="off"
    />
  </div>
</template>

<style lang='scss'>
.input-container{
    & .input-string{
      padding-right: 0;
      height: 50px;
      width:60%;
      flex-grow: 1;
      border-radius: 0 var(--border-radius) var(--border-radius) 0;
      border-left: 0;
      margin-left: -1px;
    }
}
.in-input {
    margin-right: 0;
    border-radius: var(--border-radius) 0 0 var(--border-radius);

& .v-select{
    height: 100%;

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
        background-color: var(--accent-btn);
        border-color: var(--primary);
        border-right: solid 2px;
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
        & .labeled-input {
          top:10px;
          & LABEL, .selected {
                color: var(--primary);
          }
        }
    }

    .vs__actions {
      padding: 2px;;
    }
    .vs__search {
        background-color: var(--default-text);
        width: 0px;
        padding: 0;
        align-self: center;
        border: 0;
    }

    .vs__open-indicator{
        fill: var(--primary);
        transform: scale(0.75);
    }

    &.vs--open .vs__open-indicator {
      transform: rotate(180deg) scale(0.75);
    }

}
}
</style>
