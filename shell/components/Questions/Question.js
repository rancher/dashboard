import { _EDIT } from '@shell/config/query-params';

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
    },

    chartName: {
      type:    String,
      default: ''
    },
  },

  computed: {
    displayLabel() {
      const variable = this.question?.variable;
      const displayLabel = this.$store.getters['i18n/withFallback'](`charts.${ this.chartName }."${ variable }".label`, null, '');

      return displayLabel || this.question?.label || variable || '?';
    },

    showDescription() {
      function normalize(str) {
        return (str || '').toLowerCase().replace(/\s/g, '');
      }

      const desc = normalize(this.question?.description);
      const label = normalize(this.question?.label);

      return desc && desc !== label;
    },

    displayDescription() {
      const variable = this.question?.variable;

      return this.$store.getters['i18n/withFallback'](`charts.${ this.chartName }."${ variable }".description`, null, this.question?.description);
    },
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
