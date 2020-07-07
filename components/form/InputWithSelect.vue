<script>
import labeledFormElement from '@/mixins/labeled-form-element';
import LabeledInput from '@/components/form/LabeledInput';
import LabeledSelect from '@/components/form/LabeledSelect';
import { _VIEW } from '@/config/query-params';
import UnitInput from '@/components/form/UnitInput';
export default {
  components: {
    LabeledInput,
    LabeledSelect,
    UnitInput
  },

  mixins: [labeledFormElement],

  props:      {
    disabled: {
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
      type:    String,
      default: null
    },

    placeholder: {
      type:    String,
      default: ''
    },
  },

  data() {
    return { selected: this.selectValue || this.options[0], string: this.textValue };
  },

  computed: {
    isView() {
      return this.mode === _VIEW;
    }
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
  <div v-if="isView">
    <template v-if="!selectBeforeText">
      <UnitInput :label="textLabel" mode="view" :value="string" :suffix="selected">
        <template #label>
          <slot name="label" />
        </template>
      </UnitInput>
    </template>
  </div>
  <div v-else :class="{'select-after':!selectBeforeText}" class="input-container row" @input="change">
    <LabeledSelect
      v-model="selected"
      :label="selectLabel"
      :class="{ 'suffix': !selectBeforeText}"
      class="in-input"
      :options="options"
      :searchable="false"
      :disbaled="isView"
      :clearable="false"
      :disabled="disabled"
      :mode="mode"
      :option-label="optionLabel"
      @input="change"
    />
    <LabeledInput
      ref="text"
      v-model="string"
      class="input-string col span-8"
      :class="{ 'suffix': !selectBeforeText }"
      :label="textLabel"
      :placeholder="placeholder"
      :disabled="disabled"
      :required="textRequired"
      :mode="mode"
    >
      <template #label>
        <slot name="label" />
      </template>
    </LabeledInput>
  </div>
</template>

<style lang='scss'>
  .input-container {
    display: flex;
    height: 55px;

    &.select-after {
      flex-direction: row-reverse;
    }

    & .input-string {
      padding-right: 0;
      height: 50px;
      width:60%;
      flex-grow: 1;
      border-radius: 0 calc(var(--border-radius) * 2) calc(var(--border-radius) * 2) 0;
      border-left: 0;
      margin-left: -1px;

      &.suffix{
        border-radius:  calc(var(--border-radius) * 2) 0 0 calc(var(--border-radius) * 2);
        border: 1px solid var(--border);
        border-right: 0;
        margin-left:0;
        margin-right: 0;
      }
    }

    .in-input {
      border-radius: calc(var(--border-radius) * 2) 0 0 calc(var(--border-radius) * 2);
      margin-right: 0;

      &.suffix {
        border-radius: 0 calc(var(--border-radius) * 2) calc(var(--border-radius) * 2) 0;
      }

      &.labeled-select {
        display: block;
        box-shadow: none;
        width: 40%;
        height: 100%;
        background-color: var(--accent-btn);
        border-color: var(--primary);
        border-right-width: 2px;

        &.suffix {
          border-right-width: 1px;
          border-color: var(--border);
          background-color: var(--input-bg);
          width: 20%;

          .vs__selected {
            color: var(--input-text)
          }

          .vs__dropdown-menu {
           left: 0px;
           border: 1px solid var(--border);
          }

          .vs__dropdown-toggle {
            color: var(--input-label) !important;
            border-radius: 0 var(--border-radius) var(--border-radius) 0;
          }

          .vs__open-indicator {
            fill: var(--input-label);
          }
        }

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
