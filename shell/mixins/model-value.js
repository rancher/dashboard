/**
 * Allow to maintain current 2 way binding behavior for v-model in Vue 3.
 * In Vue 3, props mutation is not allowed since they are read-only.
 * v-model="foo" is short for :model-value="foo" @update:model-value="foo = $event"
 * Docs: https://vuejs.org/guide/components/props.html#one-way-data-flow
 * Linter: https://eslint.vuejs.org/rules/no-mutating-props.html
 * IMPORTANT: This mixin is temporary and the logic should be replaced with something to be defined in the future.
 */
export default {
  props: {
    modelValue: {
      type:     Object,
      required: true,
      default:  () => {}
    }
  },
  computed: {
    value: {
      get() {
        return this.modelValue;
      },
      set(value) {
        this.$emit('update:modelValue', value);
      }
    }
  }
};
