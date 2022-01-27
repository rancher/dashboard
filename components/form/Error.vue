<script>
export default {
  props: {
    value: {
      default: null,
      type:    Object
    },
    rules: {
      default:   () => [],
      type:      Array,
      // we only want functions in the rules array
      validator: rules => rules.every(rule => ['function'].includes(typeof rule))
    }
  },
  data() {
    return {};
  },
  computed: {
    validationMessage() {
      const ruleMessages = [];
      const value = this.value;

      for (const rule of this.rules) {
        ruleMessages.push(rule(value));
      }
      if (ruleMessages.length > 0) {
        return ruleMessages.join(', ');
      }

      return undefined;
    }
  }
};
</script>
<template>
  <span class="text-error">{{ validationMessage }}</span>
</template>
