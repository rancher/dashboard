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

  text() {
    return this.nameDisplay;
  },

  url() {
    return {
      name:   'c-cluster-product-resource-namespace-id',
      params:   {
        resource:  this.type,
        id:        this.name,
        namespace: this.namespace
      }
    };
  }
};
