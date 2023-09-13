<script>
import LabeledFormElement from '@shell/mixins/labeled-form-element';
import { LabeledInput } from '@components/Form/LabeledInput';
import { get } from '@shell/utils/object';
import isString from 'lodash/isString';
import { createPopper } from '@popperjs/core';
import $ from 'jquery';

export default {
  components: { LabeledInput },
  mixins:     [LabeledFormElement],
  props:      {
    disabled: {
      type:    Boolean,
      default: false,
    },

    required: {
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

    optionLabel: {
      type:    String,
      default: 'label',
    },

    textLabel: {
      type:    String,
      default: '',
    },

    placeholder: {
      type:    String,
      default: '',
    },

    tooltip: {
      default: null,
      type:    [String, Object],
    },

    // select
    closeOnSelect: {
      default: true,
      type:    Boolean
    },
    buttonLabel: {
      default: '',
      type:    String,
    },
    options: {
      // required: true,
      default: () => [],
      type:    Array,
    },
    optionKey: {
      default: null,
      type:    String,
    },
    selectable: {
      default: (opt) => {
        if ( opt ) {
          if ( opt.disabled || opt.kind === 'group' || opt.kind === 'divider' || opt.loading ) {
            return false;
          }
        }

        return true;
      },
      type: Function
    },
  },

  computed: {
    textValue: {
      get() {
        return this.value;
      },
      set(newVal) {
        this.$emit('input', newVal);
      },
    }
  },

  methods: {
    handleDropdown(c) {
      const value = c.value || c;

      this.textValue = value;
      this.$emit('onSearch', value);
    },
    withPopper(dropdownList, component, { width }) {
      this.$refs['text'].focus();
      const textEl = this.$refs['text'].$el;
      /**
       * We need to explicitly define the dropdown width since
       * it is usually inherited from the parent with CSS.
       */
      const textWidth = $(textEl).width();

      dropdownList.style.width = `${ textWidth + 35 }px`;
      /**
       * Here we position the dropdownList relative to the $refs.toggle Element.
       *
       * The 'offset' modifier aligns the dropdown so that the $refs.toggle and
       * the dropdownList overlap by 1 pixel.
       *
       * The 'toggleClass' modifier adds a 'drop-up' class to the Vue Select
       * wrapper so that we can set some styles for when the dropdown is placed
       * above.
       */
      const popper = createPopper(component.$refs.toggle, dropdownList, {
        placement: this.placement || 'bottom-start',
        modifiers: [
          {
            name:    'offset',
            options: { offset: [-textWidth - 10, 1] },
          },
          {
            name:    'toggleClass',
            enabled: true,
            phase:   'write',
            fn({ state }) {
              component.$el.setAttribute('x-placement', state.placement);
            },
          },
        ],
      });

      /**
       * To prevent memory leaks Popper needs to be destroyed.
       * If you return function, it will be called just before dropdown is removed from DOM.
       */
      return () => popper.destroy();
    },

    change() {
      this.$emit('onSearch', this.textValue);
    },

    onBlur() {
      this.$refs['button-dropdown'].closeSearchOptions();
    },

    getOptionLabel(option) {
      if (isString(option)) {
        return option;
      }

      if (this.$attrs['get-option-label']) {
        return this.$attrs['get-option-label'](option);
      }

      if (get(option, this.optionLabel)) {
        if (this.localizedLabel) {
          return this.$store.getters['i18n/t'](get(option, this.optionLabel));
        } else {
          return get(option, this.optionLabel);
        }
      } else {
        return option;
      }
    },
  },
};
</script>

<template>
  <div
    class="input-container row"
    @input="change"
  >
    <LabeledInput
      ref="text"
      v-model="textValue"
      class="input-string col span-8"
      :label="textLabel"
      :placeholder="placeholder"
      :disabled="disabled"
      :required="required"
      :mode="mode"
      :tooltip="tooltip"
      :rules="rules"
      v-bind="$attrs"
      @blur="onBlur"
    />
    <v-select
      ref="button-dropdown"
      class="button-dropdown btn input-action"
      :class="{
        disabled,
        focused,
      }"
      v-bind="$attrs"
      :no-drop="false"
      :disabled="isView || disabled"
      :append-to-body="true"
      :calculate-position="withPopper"
      :searchable="false"
      :selectable="selectable"
      :clearable="false"
      :close-on-select="closeOnSelect"
      :filterable="false"
      :value="buttonLabel"
      :options="options"
      :get-option-key="
        (opt) => (optionKey ? get(opt, optionKey) : getOptionLabel(opt))
      "
      :get-option-label="(opt) => getOptionLabel(opt)"
      @input="handleDropdown"
    />
  </div>
</template>

<style lang='scss' scoped>
.input-container {
  display: flex;

  & .input-string {
    padding-right: 0;
    height: 100%;
    width: 60%;
    flex-grow: 1;
    border-radius: var(--border-radius) 0 0 var(--border-radius);
    border-right: 0;
    margin-right: -1px;
    position: relative;
    display: table;
    border-collapse: separate;
  }

  .input-action {
    margin-left: 0;
    border-radius: 0 var(--border-radius) var(--border-radius) 0;
  }
}

.button-dropdown {
  background: var(--accent-btn);
  border: solid 1px var(--link);
  color: var(--link);
  padding: 0;

  &.vs--open ::v-deep {
    outline: none;
    box-shadow: none;
  }
  ::v-deep .vs__selected-options {
    display: none;
  }

  &:hover {
    ::v-deep .vs__dropdown-toggle .vs__actions,
    ::v-deep .vs__selected-options {
      background: var(--accent-btn-hover);
    }
    ::v-deep .vs__dropdown-toggle .vs__actions {
      &:after {
        color: var(--accent-btn-hover-text);
      }
    }
  }

  ::v-deep > .vs__dropdown-toggle {
    width: 100%;
    display: flex;
    border: none;
    background: transparent;

    .vs__actions {
      justify-content: center;

      &:after {
        color: var(--link);
      }
    }
  }

  ::v-deep .vs__actions {
    height: 59px;
    line-height: 18px;
  }

  ::v-deep .vs__selected-options {
    .vs__selected {
      margin: unset;
      border: none;

      button {
        border: none;
        background: transparent;
        color: var(--link);
      }
    }
  }

  ::v-deep .vs__dropdown-menu {
    min-width: unset;
    width: fit-content;
  }
}
</style>
