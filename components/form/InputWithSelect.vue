<script>
import labeledFormElement from '@/mixins/labeled-form-element';
import LabeledInput from '@/components/form/LabeledInput';
import LabeledSelect from '@/components/form/LabeledSelect';
import Select from '@/components/form/Select';
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
  },

  data() {
    return {
      selected: this.selectValue || this.options[0],
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
      :class="{ 'in-input': !isView }"
      :options="options"
      :searchable="false"
      :clearable="false"
      :disabled="disabled || isView"
      :taggable="taggable"
      :create-option="(name) => ({ label: name, value: name })"
      :multiple="false"
      :mode="mode"
      :option-label="optionLabel"
      :placement="$attrs.placement ? $attrs.placement : null"
      :v-bind="$attrs"
      @input="change"
    />
    <Select
      v-else
      v-model="selected"
      :options="options"
      :searchable="searchable"
      :disabled="disabled || isView"
      :clearable="false"
      :class="{ 'in-input': !isView }"
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
      border-left: 1px solid var(--border);
    }

    & .in-input {
      border-radius: 0 var(--border-radius) var(--border-radius) 0;
      border-left: 0;
      border-right: 1px solid var(--border);

      &.labeled-select {
        .selected {
          color: var(--input-text);
          text-align: center;
          margin-right: 1em;
        }
      }

    }
  }

  & .input-string {
    padding-right: 0;
    height: 100%;
    width: 60%;
    flex-grow: 1;
    border-radius: 0 var(--border-radius) var(--border-radius) 0;
    border-left: 0;
    margin-left: -1px;
    position: relative;
    display: table;
    border-collapse: separate;
  }

  & .in-input {
    margin-right: 0;
    border-radius: var(--border-radius) 0 0 var(--border-radius);

    &.labeled-select.focused ::v-deep,
    &.unlabeled-select.focused ::v-deep {
      outline: none;
    }

    &.labeled-select ::v-deep,
    &.unlabeled-select ::v-deep {
      box-shadow: none;
      width: 20%;
      background-color: var(--accent-btn);
      border: solid 1px var(--primary);
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

      .vs__dropdown-toggle {
        color: var(--primary) !important;
        border-radius: var(--border-radius) 0 0 var(--border-radius);
      }
    }
  }
}
</style>
