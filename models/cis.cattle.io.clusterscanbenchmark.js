import { CATALOG } from '@/config/types';

export default {
  warnDeletionMessage() {
    return (toRemove = []) => {
      return this.$rootGetters['i18n/t']('cis.deleteBenchmarkWarning', { count: toRemove.length });
    };
  },

  isDefault() {
    const { relationships = [] } = this.metadata;

    if (!relationships) {
      return false;
    }

    return relationships.filter(rel => rel.fromType === CATALOG.APP ).length > 0;
  }
};
