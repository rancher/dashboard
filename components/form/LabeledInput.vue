<script>
import LabeledFormElement from '@/mixins/labeled-form-element';
import TextAreaAutoGrow from '@/components/form/TextAreaAutoGrow';
import { _EDIT, _VIEW } from '@/config/query-params';

export default {
  components: { TextAreaAutoGrow },
  mixins:     [LabeledFormElement],

  props: {
    type: {
      type:    String,
      default: 'text',
    },
    // if true, hide placeholder text until field is focused, then show until field has value
    // If false, show placeholder text until field is focused
    hidePlaceholder: {
      type:    Boolean,
      default: true
    },
    mode: {
      type:    String,
      default: _EDIT
    },
    disabled: {
      type:    Boolean,
      default: false,
    }
  },

  data() {
    const actualPlaceholder = this.hidePlaceholder ? '' : this.placeholder;

    return { actualPlaceholder };
  },

  computed: {
    isViewing() {
      return this.mode === _VIEW;
    }
  },

  methods: {
    focus() {
      const comp = this.$refs.value;

      if ( comp ) {
        comp.focus();
      }
    },

    select() {
      const comp = this.$refs.value;

      if ( comp ) {
        comp.select();
      }
    },

    onFocus() {
      this.onFocusLabeled();
      if (this.hidePlaceholder) {
        this.actualPlaceholder = `${ this.placeholder }`;
      } else {
        this.actualPlaceholder = '';
      }
    },

    onBlur() {
      this.onBlurLabeled();
      if (this.hidePlaceholder) {
        this.actualPlaceholder = null;
      } else {
        this.actualPlaceholder = `${ this.placeholder }`;
      }
    }
  }
};
</script>

<template>
  <div v-if="isViewing" :class="{'labeled-input': true, [mode]: true}">
    <label>
      {{ label }}
      <span v-if="required && !value" class="required">*</span>
    </label>
    <label v-if="!!(this.$slots.corner || [])[0]" class="corner">
      <slot name="corner" />
    </label>
    <slot name="prefix" />
    <div>{{ value || 'n/a' }}</div>
  </div>
  <div v-else :class="{'labeled-input': true, raised, focused, [mode]: true}">
    <slot name="label">
      <label v-if="i18nLabel" k-t="i18nLabel" />
      <label v-else>
        {{ label }}
        <span v-if="required && !value" class="required">*</span>
      </label>
    </slot>
    <label v-if="!!(this.$slots.corner || [])[0]" class="corner">
      <slot name="corner" />
    </label>
    <slot name="prefix" />
    <slot name="field">
      <div v-if="isView && value">
        <slot name="view">
          {{ value }}
        </slot>
      </div>
      <div v-else-if="isView" class="text-muted">
        &mdash;
      </div>
      <TextAreaAutoGrow
        v-else-if="type === 'multiline'"
        ref="value"
        v-bind="$attrs"
        :disabled="disabled"
        :value="value"
        :placeholder="actualPlaceholder"
        @input="$emit('input', $event)"
        @focus="onFocus"
        @blur="onBlur"
      />
      <input
        v-else
        ref="value"
        v-bind="$attrs"
        :disabled="disabled"
        :type="type"
        :value="value"
        :placeholder="actualPlaceholder"
        autocomplete="off"
        @input="$emit('input', $event.target.value)"
        @focus="onFocus"
        @blur="onBlur"
      >
    </slot>
    <slot name="suffix" />
  </div>
</template>
