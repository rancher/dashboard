export const PROVIDERS = [
  {
    name:     'elasticsearch',
    labelKey: 'logging.outputProviders.elasticsearch',
    enabled:  false,
    default:  {},
    logo:     require(`~/assets/images/logo-color-elasticsearch.svg`)
  },
  {
    name:     'splunkHec',
    labelKey: 'logging.outputProviders.splunkHec',
    enabled:  false,
    default:  {},
    logo:     require(`~/assets/images/logo-color-splunk.svg`)
  },
  {
    name:     'kafka',
    labelKey: 'logging.outputProviders.kafka',
    enabled:  false,
    default:  { format: { type: 'json' } },
    logo:     require(`~/assets/images/logo-color-kafka.svg`)
  },
  {
    name:     'forward',
    labelKey: 'logging.outputProviders.forward',
    enabled:  false,
    default:  { servers: [{}] },
    logo:     require(`~/assets/images/logo-color-fluentd.svg`)
  },
  {
    name:     'loki',
    labelKey:   'logging.outputProviders.loki',
    enabled:  false,
    default:  { configure_kubernetes_labels: true },
    logo:     require(`~/assets/images/logo-color-loki.svg`)
  }
];

export default {
  canCustomEdit() {
    return this.allProvidersSupported;
  },

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

  isSupportedProvider() {
    return (provider) => {
      return !!PROVIDERS.find(p => p.name === provider);
    };
  },

  allProvidersSupported() {
    return this.providers.every(this.isSupportedProvider);
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
