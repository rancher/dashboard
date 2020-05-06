<script>
import LabeledFormElement from '@/mixins/labeled-form-element';
import { findBy } from '@/utils/array';
import { get } from '@/utils/object';

export default {
  mixins: [LabeledFormElement],

  props: {
    value: {
      type:    String,
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
    reduce(e) {
      if ( e && typeof e === 'object' && e.value !== undefined ) {
        return e.value;
      }

      return e;
    },

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
        return get(option, this.optionLabel);
      } else {
        return option;
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
      class="inline"
      :disabled="disabled"
      :value="value"
      :options="options"
      :get-option-label="opt=>getOptionLabel(opt)"
      :get-option-key="opt=>optionKey ? get(opt, optionKey) : getOptionLabel(opt)"
      :label="optionLabel"
      :reduce="x => reduce(x)"
      v-bind="$attrs"
      @input="x => $emit('input', reduce(x))"
      @search:focus="onFocus"
      @search:blur="onBlur"
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
