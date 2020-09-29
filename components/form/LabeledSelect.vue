<script>
import { createPopper } from '@popperjs/core';
import LabeledFormElement from '@/mixins/labeled-form-element';
import { findBy } from '@/utils/array';
import { get } from '@/utils/object';
import LabeledTooltip from '@/components/form/LabeledTooltip';

export default {
  components: { LabeledTooltip },
  mixins:     [LabeledFormElement],

  props: {
    value: {
      type:    [String, Object, Number, Array],
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
    tooltip: {
      type:    String,
      default: null
    },
    hoverTooltip: {
      type:    Boolean,
      default: false
    },
    localizedLabel: {
      type:    Boolean,
      default: false
    },
    status: {
      type:      String,
      default:   null
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
    },

    onBlur() {
      this.selectedVisibility = 'visible';
      this.onBlurLabeled();
    },

    getOptionLabel(option) {
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
  <div class="labeled-select labeled-input" :class="{disabled: disabled && !isView, focused, [mode]: true, [status]: status, taggable: $attrs.taggable }">
    <div :class="{'labeled-container': true, raised, empty, [mode]: true}" :style="{border:'none'}">
      <label v-if="label">
        {{ label }}
        <span v-if="required && !value" class="required">*</span>
      </label>
      <label v-if="label" class="corner">
        <slot name="corner" />
      </label>
      <div v-if="isView" :class="{'no-label':!(label||'').length}" class="selected">
        <span v-if="!currentLabel" class="text-muted">—</span>{{ currentLabel }}&nbsp;
      </div>
      <div v-else-if="!$attrs.multiple" :class="{'no-label':!(label||'').length}" class="selected" :style="{visibility:selectedVisibility}">
        {{ currentLabel }}&nbsp;
      </div>
    </div>
    <v-select
      v-if="!isView"
      ref="input"
      v-bind="$attrs"
      class="inline"
      :append-to-body="!!placement"
      :calculate-position="placement ? withPopper : undefined"
      :class="{'no-label':!(label||'').length}"
      :disabled="isView || disabled"
      :get-option-key="opt=>optionKey ? get(opt, optionKey) : getOptionLabel(opt)"
      :get-option-label="opt=>getOptionLabel(opt)"
      :label="optionLabel"
      :options="options"
      :placeholder="placeholder"
      :reduce="x => reduce(x)"
      :value="value ? value : ''"
      @input="e=>$emit('input', e)"
      @search:blur="onBlur"
      @search:focus="onFocus"
    >
      <template v-if="!$attrs.multiple" v-slot:selected-option-container>
        <span style="display: none"></span>
      </template>
    </v-select>
    <LabeledTooltip v-if="tooltip && !focused" v-tooltip="hoverTooltip ? {content: tooltip, classes: [`tooltip-${status}`]} : null" :value="hoverTooltip ? null : tooltip" :status="status" />
  </div>
</template>

<style lang='scss'>
.labeled-select {
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

  .selected, .vs__selected-options {
    .vs__search, .vs__search:hover {
      background-color: transparent;
      padding: 2px 0 0 0;
      flex: 1;
    }
  }

  .no-label {
    &.v-select:not(.vs--single) {
      min-height: 33px;
    }

    &.selected {
      padding-top:8px;
      padding-bottom: 9px;
      position: relative;
      max-height:2.3em;
      overflow:hidden;
    }

    .vs__selected-options {
      padding:8px 0 7px 0;
    }
  }

  &.focused .vs__dropdown-menu {
    outline: none;
    border: var(--outline-width) solid var(--outline);
    border-top: none;
  }

  &.taggable {
    .vs__selected-options {
      margin: 14px 0px 2px 0px;
    }
  }

  .v-select.inline {
    position: initial;

    &.vs--single {
      position: absolute;
      top: 0;
      bottom: 0;
      left: 0;
      right: 0;

      .vs__search {
        background-color: transparent;
        padding: 18px 0 0 10px;
      }
    }

    &, .vs__dropdown-toggle, .vs__dropdown-toggle > * {
      background-color: transparent;
      border:transparent;
    }

    .vs__dropdown-menu {
      top: calc(100% - 2px);
      left: -3px;
      width: calc(100% + 6px);
    }

    .selected{
      position:relative;
      top: 1.4em;
    }
  }
}
</style>
