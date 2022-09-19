// Added by Verrazzano
import { get, set } from '@shell/utils/object';

export default {
  computed: {
    neverEmptyDynamicTabFieldNames() {
      return [];
    },
  },
  methods: {
    isDynamicTabEmptyValue(fieldName, neu) {
      let result;

      if (typeof neu === 'undefined' || neu === null) {
        result = true;
      } else if (typeof neu === 'string' && neu.length === 0) {
        result = !this.neverEmptyDynamicTabFieldNames.includes(fieldName);
      } else if (Array.isArray(neu)) {
        result = !this.neverEmptyDynamicTabFieldNames.includes(fieldName);

        if (result) {
          for (let i = 0; i < neu.length; i++) {
            result = this.isDynamicTabEmptyValue(`${ fieldName }-item-${ i }`, neu[i]);
            if (!result) {
              break;
            }
          }
        }
      } else if (typeof neu === 'object') {
        result = !this.neverEmptyDynamicTabFieldNames.includes(fieldName);

        if (result) {
          for (const [key, value] of Object.entries(neu)) {
            result = this.isDynamicTabEmptyValue(key, value);
            if (!result) {
              break;
            }
          }
        }
      } else {
        // any other scalar type that is not undefined or null is considered not empty.
        result = false;
      }

      return result;
    },
    getDynamicTabField(value, fieldName) {
      return get(value, fieldName);
    },
    getDynamicTabListField(value, fieldName) {
      return this.getDynamicTabField(value, fieldName) || [];
    },
    setDynamicTabField(value, fieldName, neu, suppressEvent = false) {
      set(value, fieldName, neu);
      if (!suppressEvent) {
        this.$emit('input', value);
      }
    },
    setDynamicTabBooleanField(value, fieldName, neu, suppressEvent = false) {
      let newValue;

      if (typeof neu === 'undefined' || neu === null) {
        newValue = neu;
      } else if (typeof neu === 'string' && neu === '') {
        newValue = undefined;
      } else {
        newValue = Boolean(neu);
      }

      this.setDynamicTabField(value, fieldName, newValue, suppressEvent);
    },
    setDynamicTabNumberField(value, fieldName, neu, suppressEvent = false) {
      let newValue;

      if (typeof neu === 'undefined' || neu === null) {
        newValue = neu;
      } else if (typeof neu === 'string' && neu === '') {
        newValue = undefined;
      } else {
        newValue = Number(neu);
      }

      this.setDynamicTabField(value, fieldName, newValue, suppressEvent);
    },
    setDynamicTabFieldIfNotEmpty(value, fieldName, neu, suppressEvent = false) {
      let valueToSet = neu;

      if (this.isDynamicTabEmptyValue(fieldName, neu)) {
        valueToSet = undefined;
      }
      this.setDynamicTabField(value, fieldName, valueToSet, suppressEvent);
    },
  }
};
