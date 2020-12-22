export const PROVIDERS = [
  {
    name:     'awsElasticsearch',
    labelKey: 'logging.outputProviders.awsElasticsearch',
    default:  { endpoint: {} },
  },
  {
    name:     'azurestorage',
    labelKey: 'logging.outputProviders.azurestorage',
    default:  { },
  },
  {
    name:     'cloudwatch',
    labelKey: 'logging.outputProviders.cloudwatch',
    default:  { },
  },
  {
    name:     'datadog',
    labelKey: 'logging.outputProviders.datadog',
    default:  { },
  },
  {
    name:     'elasticsearch',
    labelKey: 'logging.outputProviders.elasticsearch',
    default:  {},
  },
  {
    name:     'file',
    labelKey: 'logging.outputProviders.file',
    default:  { },
  },
  {
    name:     'forward',
    labelKey: 'logging.outputProviders.forward',
    default:  { servers: [{}] },
  },
  {
    name:     'gcs',
    labelKey: 'logging.outputProviders.gcs',
    default:  { },
  },
  {
    name:     'kafka',
    labelKey: 'logging.outputProviders.kafka',
    default:  { format: { type: 'json' } },
  },
  {
    name:     'kinesisStream',
    labelKey: 'logging.outputProviders.kinesisStream',
    default:  { },
  },
  {
    name:     'logdna',
    labelKey: 'logging.outputProviders.logdna',
    default:  { },
  },
  {
    name:     'logz',
    labelKey: 'logging.outputProviders.logz',
    default:  { endpoint: {} },
  },
  {
    name:     'loki',
    labelKey: 'logging.outputProviders.loki',
    default:  { configure_kubernetes_labels: true },
  },
  {
    name:     'newrelic',
    labelKey: 'logging.outputProviders.newrelic',
    default:  { },
  },
  {
    name:     'splunkHec',
    labelKey: 'logging.outputProviders.splunkHec',
    default:  {},
  },
  {
    name:     'sumologic',
    labelKey: 'logging.outputProviders.sumologic',
    default:  { },
  },
  {
    name:     'syslog',
    labelKey: 'logging.outputProviders.syslog',
    default:  { },
  },
  {

    name:     's3',
    labelKey: 'logging.outputProviders.s3',
    default:  { },
  },
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
  },

  customValidationRules() {
    return [
      {
        path:           'spec.logdna',
        validators:     ['logdna'],
      }
    ];
  },
};
