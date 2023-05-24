import { _EDIT } from '@shell/config/query-params';

export default {
  props: {
    question: {
      type:     Object,
      required: true,
    },

    mode: {
      type:    String,
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

    displayTooltip() {
      if (!this.question?.tooltip) {
        return null;
      }
      const variable = this.question?.variable;

      return this.$store.getters['i18n/withFallback'](`charts.${ this.chartName }."${ variable }".tooltip`, null, this.question?.tooltip);
    },

    rules() {
      return [
        (val) => {
          const errors = [];

          if (this.question?.valid_chars) {
            const validCharsRegExp = new RegExp(this.question?.valid_chars);

            if (!(val || '').match(validCharsRegExp)) {
              errors.push(this.$store.getters['i18n/t']('validation.invalid', { key: this.displayLabel }));
            }
          }
          if (this.question?.invalid_chars) {
            const invalidCharsRegExp = new RegExp(this.question?.invalid_chars);
            const match = (val || '').match(invalidCharsRegExp);

            if (match) {
              errors.push(this.$store.getters['i18n/t']('validation.chars', {
                key: this.displayLabel, count: match.length, chars: match.join(' ')
              }));
            }
          }

          if (this.question?.min && (val < this.question.min)) {
            errors.push(this.$store.getters['i18n/t']('validation.number.min', { key: this.displayLabel, val: this.question.min }));
          }
          if (this.question?.max && (val > this.question.max)) {
            errors.push(this.$store.getters['i18n/t']('validation.number.max', { key: this.displayLabel, val: this.question.max }));
          }
          if (this.question?.min_length && (val.length < this.question.min_length)) {
            errors.push(this.$store.getters['i18n/t']('validation.number.min', { key: this.displayLabel, val: this.question.min_length }));
          }
          if (this.question?.max_length && (val.length > this.question.max_length)) {
            errors.push(this.$store.getters['i18n/t']('validation.number.max', { key: this.displayLabel, val: this.question.max_length }));
          }

          return errors;
        }
      ];
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
