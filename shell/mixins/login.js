import { loginDisplayName } from '@shell/composables/useLogin';

export default {
  props: {
    focusOnMount: {
      type:     Boolean,
      required: true,
    },

    /** The authconfig's name, which an admin is free to choose. */
    name: {
      type:     String,
      required: true
    },

    /** The provider the config is for, e.g. `githubProvider`. */
    type: {
      type:     String,
      required: true,
    }
  },

  computed: {
    displayName() {
      return loginDisplayName(this.t, this.name, this.type);
    }
  },

  mounted() {
    if ( this.focusOnMount ) {
      this.focus();
    }
  },

  methods: {
    focus() {
      this.$refs.btn?.focus();
    },
  },
};
