import { get } from '@shell/utils/object';
import { _EDIT } from '@shell/config/query-params';

export default {
  props: {
    mode: {
      type:     String,
      default: _EDIT
    },
    value: {
      type:     Object,
      required: true,
    }
  },
  data() {
    return {
      answers:        null,
      optionalFields: null,
      name:           null,
    };
  },

  created() {
  },

  methods: {
    validate() {
      const errors = this.value.errors || [];

      Object.keys(this.answers).forEach((key) => {
        if (!get(this.value, this.answers[key])) {
          errors.push(this.t('validation.required', { key: this.t(`globalMonitoringPage.store.${ this.name }.${ key }.label`) }, true));
        }
      });

      this.value.errors = errors;
    }
  },
};
