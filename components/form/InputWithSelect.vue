<script>
import labeledFormElement from '@/mixins/labeled-form-element';
import LabeledInput from '@/components/form/LabeledInput';
import LabeledSelect from '@/components/form/LabeledSelect';
import UnitInput from '@/components/form/UnitInput';
export default {
  components: {
    LabeledInput, LabeledSelect, UnitInput
  },
  mixins:     [labeledFormElement],
  props:      {
    disabled: {
      type:    Boolean,
      default: false,
    },

    searchable: {
      type:    Boolean,
      default: true,
    },

    taggable: {
      type:    Boolean,
      default: false,
    },

    selectLabel: {
      type:    String,
      default: ''
    },

    selectValue: {
      type:    String,
      default: null
    },

    optionLabel: {
      type:    String,
      default: 'label'
    },

    options: {
      type:     Array,
      required: true
    },

    selectBeforeText: {
      type:    Boolean,
      default: true,
    },

    textLabel: {
      type:    String,
      default: ''
    },

    textRequired: {
      type:    Boolean,
      default: false
    },

    textValue: {
      type:    [String, Number],
      default: ''
    },

    placeholder: {
      type:    String,
      default: ''
    },
  },

  data() {
    return { selected: this.selectValue || this.options[0], string: this.textValue };
  },

  methods: {
    focus() {
      const comp = this.$refs.text;

      if ( comp ) {
        comp.focus();
      }
    },

    change() {
      this.$emit('input', { selected: this.selected, text: this.string });
    },
  }
};
</script>

<template>
  <div v-if="isView && !selectBeforeText">
    <UnitInput mode="view" :value="string" :label="textLabel" :suffix="selected" />
  </div>
  <div v-else :class="{'select-after':!selectBeforeText}" class="input-container row" @input="change">
    <LabeledSelect
      v-model="selected"
      :label="selectLabel"
      :class="{'in-input': !isView}"
      :options="options"
      :searchable="searchable"
      :disbaled="isView"
      :clearable="false"
      :disabled="disabled"
      :taggable="taggable"
      :create-option="name => ({ label: name, value: name })"
      :multiple="false"
      :mode="mode"
      :option-label="optionLabel"
      :v-bind="$attrs"
      @input="change"
    />
    <LabeledInput
      v-if="textLabel"
      ref="text"
      v-model="string"
      class="input-string col span-8"
      :label="textLabel"
      :placeholder="placeholder"
      :disabled="disabled"
      :required="textRequired"
      :mode="mode"
      v-bind="$attrs"
    >
      <template #label>
        <slot name="label" />
      </template>
      <template #suffix>
        <slot name="suffix" />
      </template>
    </LabeledInput>
    <input
      v-else
      ref="text"
      v-model="string"
      class="input-string"
      :disabled="isView"
      :placeholder="placeholder"
      autocomplete="off"
    />
  </div>
</template>

<style lang='scss'>
  .input-container {
    display: flex;
    height: 52px;

    &.select-after {
      flex-direction: row-reverse;

      & .input-string {
        border-radius: var(--border-radius) 0 0  var(--border-radius);
        border-right: 0;
        border-left: 1px solid var(--border);
      }

      & .in-input {
        border-radius: 0 var(--border-radius) var(--border-radius) 0;
        border-left: 0;
        border-right: 1px solid var(--border);

        &.labeled-select {
          width: 20%;

          .selected{
            color: var(--input-text);
            text-align: center;
            margin-right: 1em;
          }
        }
      }
    }

    & .input-string {
      padding-right: 8px;
      height: 100%;
      width:60%;
      flex-grow: 1;
      border-radius: 0 var(--border-radius) var(--border-radius) 0;
      border-left: 0;
      margin-left: -1px;
      display: initial;
    }

    .in-input {
      margin-right: 0;
      border-radius: var(--border-radius) 0 0 var(--border-radius);

      &.labeled-select {
        display: block;
        box-shadow: none;
        width: 40%;
        height: 100%;
        background-color: var(--accent-btn);
        border: solid 1px var(--primary);
        position: relative;
        z-index: 1;

        .vs__selected {
          margin: 0;
          color: var(--input-text)
        }

        .vs__dropdown-menu {
          width: calc(100% + 2px);
          left: -1px;
          box-shadow: none;
          border: 1px solid var(--primary);
          .vs__dropdown-option {
            padding: 3px 5px;
          }
        }

        .vs__dropdown-toggle {
          color: var(--primary) !important;
          height: 100%;
          padding: none;
          display: flex;
          align-items: stretch;
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

        .vs__open-indicator {
          fill: var(--primary);
          transform: scale(0.75);
        }

        &.vs--open .vs__open-indicator {
          transform: rotate(180deg) scale(0.75);
        }
      }
    }
  }
</style>
