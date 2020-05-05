<script>
import { createPopper } from '@popperjs/core';
import LabeledFormElement from '@/mixins/labeled-form-element';
import { findBy } from '@/utils/array';
import { get } from '@/utils/object';

export default {
  mixins: [LabeledFormElement],

  props: {
    value: {
      type:    [String, Object],
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
      default: false
    },
    optionKey: {
      type:    String,
      default: null
    },
    optionLabel: {
      type:    String,
      default: 'label'
    },
    placement: {
      type:    String,
      default: null,
    },
    localizedLabel: {
      type:    Boolean,
      default: false
    },
    reduce: {
      type:     Function,
      default: (e) => {
        if ( e && typeof e === 'object' && e.value !== undefined ) {
          return e.value;
        }

        return e;
      }
    }
  },

  data() {
    return { selectedVisibility: 'visible' };
  },

  computed: {
    currentLabel() {
      let entry;

      if ( this.grouped ) {
        for ( let i = 0 ; i < this.options.length && !entry ; i++ ) {
          entry = findBy(this.options[i].items || [], 'value', this.value);
        }
      } else {
        entry = findBy(this.options || [], 'value', this.value);
      }

      if ( entry ) {
        return entry.label;
      }

      return this.getOptionLabel(this.value);
    },
  },

  methods: {
    onFocus() {
      this.selectedVisibility = 'hidden';
      this.onFocusLabeled();
      if ( this.$refs.input ) {
        this.$refs.input.placeholder = this.placeholder;
      }
    },

    onBlur() {
      this.selectedVisibility = 'visible';
      this.onBlurLabeled();
      if ( this.$refs.input ) {
        this.$refs.input.placeholder = '';
      }
    },

    getOptionLabel(option) {
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
            options: { offset: [0, -1] }
          },
          {
            name:    'toggleClass',
            enabled: true,
            phase:   'write',
            fn({ state }) {
              component.$el.setAttribute('x-placement', state.placement);
            },
          }]
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
    get
  },
};
</script>

<template>
  <div class="labeled-select labeled-input" :class="{disabled, focused, [mode]: true}">
    <div :class="{'labeled-container': true, raised, empty, [mode]: true}" :style="{border:'none'}">
      <label v-if="label">
        {{ label }}
        <span v-if="required && !value" class="required">*</span>
      </label>
      <label v-if="label" class="corner">
        <slot name="corner" />
      </label>
      <div v-if="isView" class="selected">
        {{ currentLabel }}&nbsp;
      </div>
      <div v-else class="selected" :class="{'no-label':!label}" :style="{visibility:selectedVisibility}">
        {{ currentLabel }}&nbsp;
      </div>
    </div>
    <v-select
      v-if="!isView"
      ref="input"
      :value="value ? value : ' '"
      class="inline"
      :disabled="isView || disabled"
      :options="options"
      :get-option-label="opt=>getOptionLabel(opt)"
      :get-option-key="opt=>optionKey ? get(opt, optionKey) : getOptionLabel(opt)"
      :label="optionLabel"
      :reduce="x => reduce(x)"
      v-bind="$attrs"
      :append-to-body="!!placement"
      :calculate-position="placement ? withPopper : undefined"
      @search:focus="onFocus"
      @search:blur="onBlur"
      @input="e=>$emit('input', e)"
    >
      <template v-slot:selected-option-container>
        <span style="display: none"></span>
      </template>
    </v-select>
  </div>
</template>

<style lang='scss'>
.labeled-select {
  position: relative;

  .labeled-container .selected {
    background-color: transparent;
  }

  &.view.labeled-input .labeled-container {
    padding: 0;
  }

  &.disabled {
    .labeled-container, .vs__dropdown-toggle, input, label  {
      cursor: not-allowed;
    }
  }

  .selected {
    padding-top: 17px;
  }

  &.focused .vs__dropdown-menu {
    outline: none;
    border: var(--outline-width) solid var(--outline);
    border-top: none;
  }

  .v-select.inline {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;

    &, .vs__dropdown-toggle, .vs__dropdown-toggle * {
      background-color: transparent;
      border:transparent;
    }

    .vs__search {
      background-color: transparent;
      padding: 17px 10px 0px 10px;
    }

    .vs__dropdown-menu {
      top: calc(100% - 4px);
      left: -2px;
      width: calc(100% + 4px);
    }

    .selected{
      position:relative;
      top: 1.4em;
      &.no-label{
        top:7px;
      }
    }
  }
}
</style>
