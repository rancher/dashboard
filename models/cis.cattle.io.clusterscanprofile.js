
export default {
  warnDeletionMessage() {
    return (toRemove = []) => {
      return this.$rootGetters['i18n/t']('cis.deleteProfileWarning', { count: toRemove.length });
    };
  }
};
