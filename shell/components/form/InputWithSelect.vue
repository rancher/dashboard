<script>
import labeledFormElement from '@shell/mixins/labeled-form-element';
import LabeledInput from '@shell/components/form/LabeledInput';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import Select from '@shell/components/form/Select';
export default {
  components: {
    LabeledInput,
    LabeledSelect,
    Select,
  },
  mixins: [labeledFormElement],
  props:  {
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
      default: '',
    },

    selectValue: {
      type:    String,
      default: null,
    },

    optionLabel: {
      type:    String,
      default: 'label',
    },

    options: {
      type:     Array,
      required: true,
    },

    selectBeforeText: {
      type:    Boolean,
      default: true,
    },

    textLabel: {
      type:    String,
      default: '',
    },

    textRequired: {
      type:    Boolean,
      default: false,
    },

    textValue: {
      type:    [String, Number],
      default: '',
    },

    placeholder: {
      type:    String,
      default: '',
    },

    validators: {
      type:    Array,
      default: () => {
        return [];
      }
    }
  },

  data() {
    return {
      selected: this.selectValue || this.options[0].value,
      string:   this.textValue,
    };
  },

  methods: {
    focus() {
      const comp = this.$refs.text;

      if (comp) {
        comp.focus();
      }
    },

    change() {
      this.$emit('input', { selected: this.selected, text: this.string });
    },
  },

  watch: {
    textValue(value) {
      this.string = value;
    },
  },
};
</script>

<template>
  <div
    :class="{ 'select-after': !selectBeforeText }"
    class="input-container row"
    @input="change"
  >
    <LabeledSelect
      v-if="selectLabel"
      v-model="selected"
      :label="selectLabel"
      :class="{ 'in-input': !isView, 'validation-space': true}"
      :options="options"
      :searchable="false"
      :clearable="false"
      :disabled="disabled || isView"
      :taggable="taggable"
      :create-option="(name) => ({ label: name, value: name })"
      :multiple="false"
      :mode="mode"
      :validators="validators"
      :option-label="optionLabel"
      :placement="$attrs.placement ? $attrs.placement : null"
      :v-bind="$attrs"
      @setValid="(isValid) => { $emit('setValid', isValid) }"
      @input="change"
    />
    <Select
      v-else
      v-model="selected"
      :options="options"
      :searchable="searchable"
      :disabled="disabled || isView"
      :clearable="false"
      class="in-input"
      :taggable="taggable"
      :create-option="(name) => ({ label: name, value: name })"
      :multiple="false"
      :mode="mode"
      :option-label="optionLabel"
      :placement="$attrs.placement ? $attrs.placement : null"
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

<style lang='scss' scoped>
.input-container {
  display: flex;

  &.select-after {
    height: 100%;
    flex-direction: row-reverse;

    & .input-string {
      border-radius: var(--border-radius) 0 0 var(--border-radius);
      border-right: 0;
      border-left-width: 1px;
    }

    & .in-input {
      border-radius: 0 var(--border-radius) var(--border-radius) 0;

      &.labeled-select {
        .selected {
          color: var(--input-text);
          text-align: center;
          margin-right: 1em;
        }
      }

      &.focused:not(.vs__dropdown-up) {
        border-bottom-right-radius: 0;
      }

      &.focused.vs__dropdown-up {
        border-top-right-radius: 0;
      }
    }

    .input-string {
      &:hover:not(.focused):not(.disabled):not(:focus) {
        padding-left: 10px !important;
      }
      &.focused, &:focus {
        padding-left: 10px !important;
      }
    }
  }

  & .input-string {
    padding-right: 0;
    width: 60%;
    flex-grow: 1;
    border-radius: 0 var(--border-radius) var(--border-radius) 0;
    border-left-width: 0;
    margin-left: -1px;
    position: relative;
    display: table;
    border-collapse: separate;

    &:hover:not(.focused):not(.disabled):not(:focus):not(.view) {
      border-left: 1px solid var(--input-hover-border);
      border-right: 1px solid var(--input-hover-border);
      padding-left: 9px;
    }
    &.focused, &:focus {
      border-left: 1px solid var(--outline) !important;
      border-right: 1px solid var(--outline) !important;
      padding-left: 9px;
    }
  }

  & .in-input {
    margin-right: 0;

    &:hover:not(.focused):not(.disabled):not(.view) {
      border: 1px solid var(--input-hover-border) !important;
    }

    &.focused {
      border: 1px solid var(--outline) !important;
    }

    &:hover:not(.focused):not(.disabled) {
      border: 1px solid var(--input-hover-border) !important;
    }

    &.focused {
      border: 1px solid var(--outline) !important;
    }

    &.labeled-select.focused ::v-deep,
    &.unlabeled-select.focused ::v-deep {
      outline: none;
    }

    &.labeled-select:not(.disabled):not(.view) ::v-deep,
    &.unlabeled-select:not(.disabled):not(.view) ::v-deep {
      border: solid 1px var(--input-border);
    }

    &.labeled-select ::v-deep,
    &.unlabeled-select ::v-deep {
      box-shadow: none;
      width: 20%;
      margin-right: 1px; // push the input box right so the full focus outline of the select can be seen, z-index borks
      // position: relative;

      .vs__selected {
        color: var(--input-text);
      }

      .vs__dropdown-menu {
        box-shadow: none;
        .vs__dropdown-option {
          padding: 3px 5px;
        }
      }

      .v-select:not(.vs--disabled) {
        .vs__dropdown-toggle {
          border-radius: var(--border-radius) 0 0 var(--border-radius);
        }
        &.vs--open {
          .vs__dropdown-toggle {
            color: var(--outline) !important;
          }
        }
      }
    }
  }
}

.validation-space {
  // Prevent an input from growing if the input next to
  // it has validation errors
  height: 61px;
}
</style>
