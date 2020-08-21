export default {
  props: {
    question: {
      type:     Object,
      required: true,
    },

    // targetNamespace: {
    //   type:     String,
    //   required: true,
    // },

    value: {
      type:     null,
      required: true,
    },
  },

  computed: {
    displayLabel() {
      return this.question?.label || this.question?.variable || '?';
    },

    showDescription() {
      function normalize(str) {
        return (str || '').toLowerCase().replace(/\s/g, '');
      }

      const desc = normalize(this.question?.description);
      const label = normalize(this.question?.label);

      return desc && desc !== label;
    }
  },

  created() {
    if ( !this.value && this.question.default !== undefined ) {
      this.$emit('input', this.question.default);
    }
  },
};
