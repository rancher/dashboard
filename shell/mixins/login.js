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
      return this.t(`model.authConfig.provider.${ this.name }`);
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
