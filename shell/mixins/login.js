import { providerKey } from '@shell/models/management.cattle.io.authconfig';

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
      const providerString = this.t(`model.authConfig.provider.${ providerKey(this.type) }`);

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
