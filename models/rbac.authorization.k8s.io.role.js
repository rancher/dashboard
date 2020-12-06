export default {
  nameWithinProduct() {
    return this.$rootGetters['i18n/withFallback'](`rbac.displayRole.${ this.name }`, this.name);
  },
};
