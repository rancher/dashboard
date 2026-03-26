export default {
  props: {
    focusOnMount: {
      type:     Boolean,
      required: true,
    },

    name: {
      type:     String,
      required: true
    }
  },

  computed: {
    displayName() {
      const translationKey = this.name.replace('Provider', '');

      return this.t(`model.authConfig.provider.${ translationKey }`);
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
