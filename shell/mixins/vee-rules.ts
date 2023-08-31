import Vue from 'vue';

interface Data {
}

export default Vue.extend<Data, any, any, any>({
  props: {},

  data() {
    return { };
  },

  computed: {
    veeTokenRules() {
      return {
        ...(this.veeTokenRuleSets || {}),
        ...(this.value?.veeTokenCustomValidationRules || {})
      };
    }
  },
});
