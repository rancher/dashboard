import { _EDIT } from '@shell/config/query-params';
import { validateChars, validateHostname, validateLength } from '@shell/utils/validators';
import { cronSchedule } from '@shell/utils/validators/cron-schedule';
import { isValidCIDR, isValidIP } from '@shell/utils/validators/cidr';

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
          let errors = [];

          errors = validateChars(
            val,
            {
              validChars:   this.question.valid_chars,
              invalidChars: this.question.invalid_chars
            },
            this.displayLabel,
            this.$store.getters,
            errors,
          );

          errors = validateLength(
            val,
            {
              minLength: this.question?.min_length,
              maxLenght: this.question?.max_length,
              min:       this.question?.min,
              max:       this.question?.max,
            },
            this.displayLabel,
            this.$store.getters,
            errors,
          );

          if (this.question.type === 'hostname') {
            errors = validateHostname(
              val,
              this.displayLabel,
              this.$store.getters,
              {},
              errors,
            );
          }

          if (this.question.type === 'cron') {
            cronSchedule(
              val,
              this.$store.getters,
              errors,
            );
          }

          if (this.question.type === 'cidr' && !isValidCIDR(val)) {
            errors.push(this.$store.getters['i18n/t']('validation.invalidCidr'));
          }

          if (this.question.type === 'ipaddr' && !isValidIP(val)) {
            errors.push(this.$store.getters['i18n/t']('validation.invalidIP'));
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
      this.$emit('update:value', def);
    }
  },
};
