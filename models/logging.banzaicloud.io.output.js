export default {
  providers() {
    const spec = this.spec || {};

    return Object.keys(spec)
      .filter(provider => provider !== 'loggingRef');
  },

  providersDisplay() {
    return this.providers.map((p) => {
      const translation = this.t(`logging.outputProviders.${ p }`);

      return translation || this.t('logging.outputProviders.unknown');
    });
  },

  providersSortable() {
    const copy = [...this.providersDisplay];

    copy.sort();

    return copy.join('');
  },
};
