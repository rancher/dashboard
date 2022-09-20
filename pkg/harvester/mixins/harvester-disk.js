import { findBy, isArray } from '@shell/utils/array';

export default {
  computed: {
    conditions() {
      return this.value?.conditions || [];
    },

    readyCondition() {
      if (isArray(this.conditions)) {
        return findBy(this.conditions, 'type', 'Ready') || {};
      } else {
        return this.conditions.Ready;
      }
    },

    schedulableCondition() {
      if (isArray(this.conditions)) {
        return findBy(this.conditions, 'type', 'Schedulable') || {};
      } else {
        return this.conditions.Schedulable;
      }
    },
  },
};
