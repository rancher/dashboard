<script>
import { get } from '@/utils/object';
import isString from 'lodash/isString';
import VueSelectOverrides from '@/mixins/vue-select-overrides';

export default {
  mixins: [VueSelectOverrides],
  props:  {
    buttonLabel: {
      default: '',
      type:    String,
    },
    closeOnSelect: {
      default: true,
      type:    Boolean
    },
    disabled: {
      default: false,
      type:    Boolean,
    },
    // array of option objects containing at least a label and link, but also icon and action are available
    dropdownOptions: {
      // required: true,
      default: () => [],
      type:    Array,
    },
    optionKey: {
      default: null,
      type:    String,
    },
    optionLabel: {
      default: 'label',
      type:    String,
    },
    // sm, null(med), lg - no xs...its so small
    size: {
      default: null,
      type:    String,
    },
    value: {
      default: null,
      type:    String,
    },
  },
  data() {
    return { focused: false };
  },

  methods: {
    ddButtonAction(option) {
      this.focusSearch();
      this.$emit('dd-button-action', option);
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

    onFocus() {
      return this.onFocusLabeled();
    },

    onFocusLabeled() {
      this.focused = true;
    },

    onBlur() {
      return this.onBlurLabeled();
    },

    onBlurLabeled() {
      this.focused = false;
    },

    focusSearch() {
      this.$nextTick(() => {
        const el = this.$refs['button-dropdown'].searchEl;

        if ( el ) {
          el.focus();
        }
      });
    },
    get,
  },
};
</script>

<template>
  <v-select
    ref="button-dropdown"
    class="button-dropdown btn"
    :class="{
      disabled,
      focused,
      'btn-sm': size === 'sm',
      'btn-lg': size === 'lg',
    }"
    v-bind="$attrs"
    :searchable="false"
    :clearable="false"
    :close-on-select="closeOnSelect"
    :filterable="false"
    :value="buttonLabel"
    :options="dropdownOptions"
    :map-keydown="mappedKeys"
    :get-option-key="
      (opt) => (optionKey ? get(opt, optionKey) : getOptionLabel(opt))
    "
    :get-option-label="(opt) => getOptionLabel(opt)"
    @search:blur="onBlur"
    @search:focus="onFocus"
    @input="$emit('click-action', $event)"
  >
    <template #selected-option="option">
      <button
        tabindex="-1"
        type="button"
        class="dropdown-button-two btn"
        :class="{
          'btn-sm': size === 'sm',
          'btn-lg': size === 'lg',
        }"
        @click="ddButtonAction(option)"
        @focus="focusSearch"
      >
        {{ option.label }}
      </button>
    </template>
    <!-- Pass down templates provided by the caller -->
    <template v-for="(_, slot) of $scopedSlots" v-slot:[slot]="scope">
      <slot v-if="slot !== 'selected-option'" :name="slot" v-bind="scope" />
    </template>
  </v-select>
</template>

<style lang='scss' scoped>
.button-dropdown.btn-sm {
  ::v-deep > .vs__dropdown-toggle {
    .vs__actions {
      &:after {
        font-size: 1.6rem;
      }
    }
  }
}
.button-dropdown.btn-lg {
  ::v-deep > .vs__dropdown-toggle {
    .vs__actions {
      &:after {
        font-size: 2.6rem;
      }
    }
  }
}
.button-dropdown {
  background: var(--accent-btn);
  border: solid 1px var(--link-text);
  color: var(--link-text);
  padding: 0;

  &.vs--open ::v-deep {
    outline: none;
    border: var(--outline-width) solid var(--outline);
    border-bottom: none;
    box-shadow: none;
    border-bottom-left-radius: 0;
    border-bottom-right-radius: 0;
  }

  &:hover {
    ::v-deep .vs__dropdown-toggle .vs__actions,
    ::v-deep .vs__selected-options {
      background: var(--accent-btn-hover);
    }
    ::v-deep .vs__selected-options .vs__selected button {
      background-color: transparent;
    }
  }

  ::v-deep > .vs__dropdown-toggle {
    width: 100%;
    display: grid;
    grid-template-columns: 75% 25%;
    border: none;
    background: transparent;

    .vs__actions {
      justify-content: center;

      &:after {
        color: var(--link-text);
      }
    }
  }

  ::v-deep .vs__selected-options {
    .vs__selected {
      margin: unset;
      border: none;

      button {
        border: none;
        background: transparent;
        color: var(--link-text);
      }
    }
    .vs__search {
      // if you need to keep the dd open you can toggle these on and off
      // display: none;
      // visibility: hidden;
      position: absolute;
      opacity: 0;
      padding: 0;
    }
  }

  ::v-deep .vs__dropdown-menu {
    min-width: unset;
    width: fit-content;
  }
}
</style>
