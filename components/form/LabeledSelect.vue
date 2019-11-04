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
    }
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

      return this.value;
    },
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
    }
  }
};
</script>

<template>
  <div :class="{'labeled-input': true, raised, focused, empty, [mode]: true}">
    <label>
      {{ label }}
      <span v-if="required && !value" class="required">*</span>
    </label>
    <div v-if="isView">
      {{ currentLabel }}
    </div>
    <select
      v-else
      ref="input"
      v-bind="$attrs"
      :value="value"
      @input="$emit('input', $event.target.value)"
      @focus="onFocus"
      @blur="onBlur"
    >
      <option v-if="!focused" disabled value=""></option>
      <option v-if="focused" disabled value="">
        {{ placeholder }}
      </option>
      <slot name="options" :options="options">
        <template v-if="grouped">
          <optgroup v-for="grp in options" :key="grp.group" :label="grp.group">
            <option v-for="opt in grp.items" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </option>
          </optgroup>
        </template>
        <option v-for="opt in options" v-else :key="opt.value" :value="opt.value">
          <slot name="label" :opt="opt">
            {{ opt.label }}
          </slot>
        </option>
      </slot>
    </select>
  </div>
</template>
