import Vue from 'vue';
import { uniq } from 'lodash';
import { veeTokenValidateUtil, VeeTokenRule } from '@shell/utils/vee-validators';

interface Data {
}

export default Vue.extend<Data, any, any, any>({
  props: {},

  data() {
    return { };
  },

  computed: {},

  watch: {
    resource: {

      /**
       * Can be triggered on parent component with emit()
       */

      async handler(neu) {
        if (!this.$refs.validator) {
          return;
        }
        const veeTokenRules: VeeTokenRule = this.$parent.veeTokenRules;

        const rules = Object.values(veeTokenRules).map(({ id }) => id);

        const unreportedRule = rules.find((id) => !Object.keys(this.$refs.validator.fields).includes(id));

        if (unreportedRule) {
          const selectedRule = Object.values(veeTokenRules).find((r) => r.id === unreportedRule);

          const rule = await this.veeTokenValidate(neu, selectedRule);

          // each rule has errors
          Vue.set(this, 'veeTokenErrors', uniq(rule.errors[0]));
        }
      },
      deep:      true,
      immediate: true
    }
  },

  methods: {
    async veeTokenValidate(value: any, rule: any ) {
      const res = await veeTokenValidateUtil(value, rule, this.$store.getters);

      return res;
    },
  }
});
