import { CATALOG } from '@/config/types';

export default {
  warnDeletionMessage() {
    return (toRemove = []) => {
      return this.$rootGetters['i18n/t']('cis.deleteBenchmarkWarning', { count: toRemove.length });
    };
  },

  isCustom() {
    const { relationships = [] } = this.metadata;

    if (!relationships) {
      return;
    }

    return relationships.filter(rel => rel.fromType === CATALOG.APP ).length > 0;
  }
};
