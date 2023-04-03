import Vue from 'vue';
// import * as validators from 'vuelidate/lib/validators';

export default Vue.extend({
  props: {},

  data() {
    return {
      // ...validators
    };
  },

  computed: {
    /**
     * Put custom validators here
     */
    test() {
      return null;
    },
  },
});
