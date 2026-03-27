export default {
  props: {
    focusOnMount: {
      type:     Boolean,
      required: true,
    },

    name: {
      type:     String,
      required: true
    },

    type: {
      type:     String,
      required: true,
    }
  },

  computed: {
    displayName() {
      const translationKey = this.type.replace('Provider', '');
      const providerString = this.t(`model.authConfig.provider.${ translationKey }`);

      return `${ providerString }: ${ this.name }`;
    }
  },

  mounted() {
    if ( this.focusOnMount ) {
      this.focus();
    }
  },

  methods: {
    focus() {
      this.$refs.btn.focus();
    },
  },
};
