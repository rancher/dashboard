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
  <div class="labeled-select labeled-input" :class="{disabled, focused}">
    <div v-if="isView">
      <div :class="{'labeled-container': true, raised, empty, [mode]: true}">
        <label>
          {{ label }}
          <span v-if="required && !value" class="required">*</span>
        </label>
        <label class="corner">
          <slot name="corner" />
        </label>
        <div class="selected" :class="{'no-label':!label}" :style="{visibility:selectedVisibility}">
          {{ currentLabel }}
        </div>
      </div>
    </div>
    <v-select
      v-else
      ref="input"
      class="inline"
      :disabled="isView || disabled"
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
        <div :class="{'labeled-container': true, raised, empty, [mode]: true}" :style="{border:'none'}">
          <label>
            {{ label }}
            <span v-if="required && !value" class="required">*</span>
          </label>
          <label class="corner">
            <slot name="corner" />
          </label>
          <div v-if="isView">
            {{ currentLabel }}
          </div>
          <div v-else class="selected" :class="{'no-label':!label}" :style="{visibility:selectedVisibility}">
            {{ currentLabel }}&nbsp;
          </div>
        </div>
      </template>
    </v-select>
  </div>
</template>

<style lang='scss'>
.labeled-select {
  position: relative;

  &.disabled {
    .labeled-container, .vs__dropdown-toggle, input, label  {
      cursor: not-allowed;
    }
  }

  &.focused .vs__dropdown-menu {
    outline: none;
    border: var(--outline-width) solid var(--outline);
    border-top: none;
  }

  .v-select.inline {
    position: initial;

    &, .vs__dropdown-toggle, .vs__dropdown-toggle * {
      background-color: transparent;
      border:transparent;
    }

    .labeled-container {
      width: 100%;
      padding-right:0;
      display: flex;
      flex-direction: column;

      &, .labeled-container * {
        background-color: transparent;
      }
    }

    .vs__search {
      background-color: transparent;
      padding: 3px 10px 0px 10px;
    }

    .vs__dropdown-menu {
      left: -3px;
      width: calc(100% + 6px);
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
