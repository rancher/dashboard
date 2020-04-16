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
    multiple: {
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
  <div>
    <div v-if="isView">
      <div :class="{'labeled-input': true, raised, focused, empty, [mode]: true}">
        <label>
          {{ label }}
          <span v-if="required && !value" class="required">*</span>
        </label>
        <label class="corner">
          <slot name="corner" />
        </label>
        <div class="selected" :class="{'no-label':!label}" :style="{display:selectedDisplay}">
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
      :multiple="multiple"
      :get-option-label="opt=>getOptionLabel(opt)"
      :get-option-key="opt=>optionKey ? get(opt, optionKey) : getOptionLabel(opt)"
      :label="optionLabel"
      :reduce="x => reduce(x)"
      @input="x => $emit('input', reduce(x))"
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
          <div v-else class="selected" :class="{'no-label':!label}" :style="{display:selectedDisplay}">
            {{ currentLabel }}&nbsp;
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
