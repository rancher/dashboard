<script>
import LabeledFormElement from '@/mixins/labeled-form-element';
import { findBy } from '@/utils/array';

export default {
  mixins: [LabeledFormElement],

  props: {
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
    multiple: {
      type:    Boolean,
      default: false
    },
    optionLabel: {
      type:    String,
      default: 'label'
    }
  },
  data() {
    return { selectedDisplay: 'block' };
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
      if (this.optionLabel && typeof this.value === 'object') {
        return this.value[this.optionLabel];
      }

      return this.value;
    },
    shownValue() {
      return this.value ? this.value : ' ';
    }
  },

  methods: {
    onFocus() {
      this.onFocusLabeled();
      if ( this.$refs.input ) {
        this.$refs.input.placeholder = this.placeholder;
      }
    },

    onBlur() {
      this.onBlurLabeled();
      if ( this.$refs.input ) {
        this.$refs.input.placeholder = '';
      }
    },

    searchFocus() {
      this.selectedDisplay = 'none';
    },

    searchBlur() {
      this.selectedDisplay = 'block';
    }
  },
};
</script>

<template>
  <div>
    <div v-if="isView">
      {{ currentLabel }}
    </div>
    <v-select
      v-else
      ref="input"
      class="inline"
      v-bind="$attrs"
      :disabled="isView || disabled"
      :value="shownValue"
      :options="options"
      :multiple="multiple"
      :get-option-label="opt=>opt[optionLabel]||opt"
      :label="optionLabel"
      @input="e=>e.value ? $emit('input', e.value) : $emit('input', e) "
      @search:focus="searchFocus"
      @search:blur="searchBlur"
      @focus="onFocus"
      @blur="onBlur"
    >
      <template v-slot:selected-option-container>
        <div :class="{'labeled-input': true, raised, focused, empty, [mode]: true}" :style="{border:'none'}">
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
          <div class="selected" :class="{'no-label':!label}" :style="{display:selectedDisplay}">
            {{ currentLabel }}
          </div>
        </div>
      </template>
    </v-select>
  </div>
</template>

<style lang='scss'>
.v-select.inline {

  & .labeled-input {
    background-color: rgba(0,0,0,0);
    padding-right:0;
    display: flex;
    flex-direction: column;

     & *{
      background-color: rgba(0,0,0,0);
    }
  }

  & .vs__search {
    background-color: none;
    padding: 3px 10px 0px 10px;
  }

  &  .selected{
    position:relative;
    top: 1.4em;
    &.no-label{
      top:7px;
    }
  }
}
</style>
