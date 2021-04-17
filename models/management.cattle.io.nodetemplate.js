export default {
  provider() {
    const allKeys = Object.keys(this);
    const configKey = allKeys.find( k => k.endsWith('Config'));

    if ( configKey ) {
      return configKey.replace(/config$/i, '');
    }
  },

  providerDisplay() {
    const provider = (this.provider || '').toLowerCase();

    return this.$rootGetters['i18n/withFallback'](`cluster.provider."${ provider }"`, null, 'generic.unknown', true);
  },
};
