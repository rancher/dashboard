import { providerKey } from '@shell/models/management.cattle.io.authconfig';

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
      const key = providerKey(this.type);
      // `t` yields undefined for a provider nothing has been translated for, so
      // the key stands in - the same fallback the provider list is built with.
      const providerString = this.t(`model.authConfig.provider.${ key }`) || key;

      // A config named after its provider is the provider as far as anyone
      // signing in is concerned, so it is labelled with the vendor's name. One
      // an admin has named is labelled with the name they gave it, which is the
      // only thing telling it apart from its siblings.
      return this.name?.toLowerCase() === key ? providerString : this.name;
    }
  },

  mounted() {
    if ( this.focusOnMount ) {
      this.focus();
    }
  },

  methods: {
    focus() {
      // SAML's control is absent while a CLI login is being rejected.
      this.$refs.btn?.focus();
    },
  },
};
