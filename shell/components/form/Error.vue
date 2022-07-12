<script lang="ts">
import Vue, { PropType } from 'vue';

type Rule = (v?: string) => undefined | string;

export default Vue.extend<any, any, any, any>({
  props: {
    value: {
      default: null,
      type:    [String, Object, Number, Array]
    },
    rules: {
      default:   () => [],
      type:       Array as PropType<Rule[]>,
    }
  },
  data() {
    return {};
  },
  computed: {
    validationMessage(): undefined | string {
      const ruleMessages = [];
      const value = this.value;

      for (const rule of this.rules) {
        const message = rule(value);

        if (message) {
          ruleMessages.push(message);
        }
      }
      if (ruleMessages.length > 0) {
        return ruleMessages.join(', ');
      }

      return '';
    }
  }
});
</script>
<template>
  <span class="text-error" data-testid="error-span">{{ validationMessage }}</span>
</template>
