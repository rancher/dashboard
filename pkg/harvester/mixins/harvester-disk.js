import { findBy } from '@shell/utils/array';

export default {
  computed: {
    conditions() {
      return this.value?.conditions || [];
    },

    readyCondition() {
      return findBy(this.conditions, 'type', 'Ready') || {};
    },

    schedulableCondition() {
      return findBy(this.conditions, 'type', 'Schedulable') || {};
    },
  },
};
