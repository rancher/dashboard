import { _EDIT } from '@/config/query-params';

export default {
  props: {
    question: {
      type:     Object,
      required: true,
    },

    mode: {
      type:     String,
      default: _EDIT,
    },

    // targetNamespace: {
    //   type:     String,
    //   required: true,
    // },

    value: {
      type:     null,
      required: true,
    },

    disabled: {
      type:    Boolean,
      default: false,
    }
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
    let def = this.question.default;

    if ( this.question.type === 'boolean' && typeof def === 'string' ) {
      def = def === 'true';
    }

    if ( this.value === undefined && def !== undefined ) {
      this.$emit('input', def);
    }
  },
};
