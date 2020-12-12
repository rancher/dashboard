<script>
import { createPopper } from '@popperjs/core';
import LabeledFormElement from '@/mixins/labeled-form-element';
import { findBy } from '@/utils/array';
import { get } from '@/utils/object';
import LabeledTooltip from '@/components/form/LabeledTooltip';
import VueSelectOverrides from '@/mixins/vue-select-overrides';

export default {
  components: { LabeledTooltip },
  mixins:     [LabeledFormElement, VueSelectOverrides],

  props: {
    value: {
      type:    [String, Object, Number, Array, Boolean],
      default: null,
    },
    options: {
      type:    Array,
      default: null,
    },
    grouped: {
      type:    Boolean,
      default: false,
    },
    disabled: {
      type:    Boolean,
      default: false,
    },
    optionKey: {
      type:    String,
      default: null,
    },
    optionLabel: {
      type:    String,
      default: 'label',
    },
    placement: {
      type:    String,
      default: null,
    },
    tooltip: {
      type:    String,
      default: null,
    },
    hoverTooltip: {
      type:    Boolean,
      default: false,
    },
    localizedLabel: {
      type:    Boolean,
      default: false,
    },
    searchable: {
      default: false,
      type:    Boolean,
    },
    status: {
      type:    String,
      default: null,
    },
    reduce: {
      type:    Function,
      default: (e) => {
        if (e && typeof e === 'object' && e.value !== undefined) {
          return e.value;
        }

        return e;
      },
    },
  },

  data() {
    return { selectedVisibility: 'visible' };
  },

  computed: {
    currentLabel() {
      let entry;

      if (this.grouped) {
        for (let i = 0; i < this.options.length && !entry; i++) {
          entry = findBy(this.options[i].items || [], 'value', this.value);
        }
      } else {
        entry = findBy(this.options || [], 'value', this.value);
      }

      if (entry) {
        return entry.label;
      }

      return this.getOptionLabel(this.value);
    },
  },

  methods: {
    focusSearch() {
      this.$nextTick(() => {
        const el = this.$refs.input?.searchEl;

        if ( el ) {
          el.focus();
        }
      });
    },
    onFocus() {
      this.selectedVisibility = 'hidden';
      this.onFocusLabeled();
    },

    onBlur() {
      this.selectedVisibility = 'visible';
      this.onBlurLabeled();
    },

    getOptionLabel(option) {
      if (!option) {
        return;
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

    withPopper(dropdownList, component, { width }) {
      /**
       * We need to explicitly define the dropdown width since
       * it is usually inherited from the parent with CSS.
       */
      dropdownList.style.width = width;

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
        placement: this.placement,
        modifiers: [
          {
            name:    'offset',
            options: { offset: [0, 2] },
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
    open() {
      const input = this.$refs.input;

      if (input) {
        input.open = true;
      }
    },
    get,
  },
};
</script>

<template>
  <div
    class="labeled-select"
    :class="{
      disabled: isView || disabled,
      focused,
      [mode]: true,
      [status]: status,
      taggable: $attrs.taggable,
      taggable: $attrs.multiple,
      hoverable: hoverTooltip,
    }"
    @click="focusSearch"
    @focus="focusSearch"
  >
    <div
      :class="{ 'labeled-container': true, raised, empty, [mode]: true }"
      :style="{ border: 'none' }"
    >
      <label>
        <t v-if="labelKey" :k="labelKey" />
        <template v-else-if="label">{{ label }}</template>

        <span v-if="required" class="required">*</span>
      </label>
    </div>
    <v-select
      ref="input"
      v-bind="$attrs"
      class="inline"
      :append-to-body="!!placement"
      :calculate-position="placement ? withPopper : undefined"
      :class="{ 'no-label': !(label || '').length, }"
      :disabled="isView || disabled"
      :get-option-key="(opt) => (optionKey ? get(opt, optionKey) : getOptionLabel(opt))"
      :get-option-label="(opt) => getOptionLabel(opt)"
      :label="optionLabel"
      :options="options"
      :map-keydown="mappedKeys"
      :placeholder="placeholder"
      :reduce="(x) => reduce(x)"
      :searchable="isSearchable"
      :value="value != null ? value : ''"
      @input="(e) => $emit('input', e)"
      @search:blur="onBlur"
      @search:focus="onFocus"
    >
      <!-- Pass down templates provided by the caller -->
      <template v-for="(_, slot) of $scopedSlots" v-slot:[slot]="scope">
        <slot :name="slot" v-bind="scope" />
      </template>
    </v-select>
    <LabeledTooltip
      v-if="tooltip && !focused"
      :hover="hoverTooltip"
      :value="tooltip"
      :status="status"
    />
  </div>
</template>

<style lang='scss' scoped>
.labeled-select {
  .labeled-container {
    padding: 8px 0 0 8px;

    label {
      margin: 0;
    }

    .selected {
      background-color: transparent;
    }
  }

  &.view {
    &.labeled-input {
      .labeled-container {
        padding: 0;
      }
    }
  }
  ::v-deep .vs__selected-options {
    margin-top: -4px;
  }

  ::v-deep .v-select:not(.vs--single) {
    .vs__selected-options {
      padding: 5px 0;
    }
  }

  ::v-deep .vs__actions {
    &:after {
      line-height: 1.85rem;
      position: relative;
      right: 3px;
      top: -10px;
    }
  }

  ::v-deep &.disabled {
    .labeled-container,
    .vs__dropdown-toggle,
    input,
    label {
      cursor: not-allowed;
    }
  }

  .no-label ::v-deep {
    &.v-select:not(.vs--single) {
      min-height: 33px;
    }

    &.selected {
      padding-top: 8px;
      padding-bottom: 9px;
      position: relative;
      max-height: 2.3em;
      overflow: hidden;
    }

    .vs__selected-options {
      padding: 8px 0 7px 0;
    }
  }
}
</style>
