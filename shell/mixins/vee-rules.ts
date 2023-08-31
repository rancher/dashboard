import Vue from 'vue';

interface Data {
}

export default Vue.extend<Data, any, any, any>({
  props: {},

  data() {
    return { };
  },

  computed: {
    /**
     * To check if rules IDs are uniq. Show errors if any
     */
    veeTokenRules() {
      return {
        ...(this.veeTokenRuleSets || {}),
        ...(this.value?.veeTokenCustomValidationRules || {}),
        ...(this.veeTokenExtraRules || {})
      };
    }
  },
});
