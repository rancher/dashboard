// Added by Verrazzano
import { get } from '@shell/utils/object';

export default {
  methods: {
    getNotSetPlaceholder(value, fieldPath) {
      let result;
      const val = get(value, fieldPath);

      if (!val || (Array.isArray(val) && val.length === 0)) {
        result = this.t('verrazzano.common.values.notSet');
      }

      return result;
    },
  }
};
