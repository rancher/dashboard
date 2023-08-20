import Vue from 'vue';
import { validate } from 'vee-validate';

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
  methods: {
    async veeTokenValidate(val: any, rule: any ) {
      const res = await validate(val, rule);

      return res.valid;
    },
  }
});
