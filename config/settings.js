// Setttings

// Adapted from: https://github.com/rancher/ui/blob/08c379a9529f740666a704b52522a468986c3520/lib/shared/addon/utils/constants.js#L564

// Setting IDs
export const SETTING = {
  IMAGE_RANCHER:                    'server-image',
  VERSION_RANCHER:                  'server-version',
  VERSION_COMPOSE:                  'compose-version',
  VERSION_CLI:                      'cli-version',
  VERSION_MACHINE:                  'machine-version',
  VERSION_HELM:                     'helm-version',
  VERSIONS_K8S:                     'k8s-version-to-images',
  VERSION_RKE_K8S_DEFAULT:          'k8s-version',
  VERSION_K8S_SUPPORTED_RANGE:      'ui-k8s-supported-versions-range',
  VERSION_SYSTEM_K8S_DEFAULT_RANGE: 'ui-k8s-default-version-range',

  CLI_URL:                          {
    DARWIN:                         'cli-url-darwin',
    WINDOWS:                        'cli-url-windows',
    LINUX:                          'cli-url-linux',
  },

  API_HOST:                         'api-host',
  CA_CERTS:                         'cacerts',

  HIDE_LOCAL_CLUSTER:               'hide-local-cluster',
  // CLUSTER_DEFAULTS:              'cluster-defaults',
  AUTH_TOKEN_MAX_TTL_MINUTES:       'auth-token-max-ttl-minutes',
  ENGINE_URL:                       'engine-install-url',
  ENGINE_ISO_URL:                   'engine-iso-url',
  FIRST_LOGIN:                      'first-login',
  INGRESS_IP_DOMAIN:                'ingress-ip-domain',
  PL:                               'ui-pl',
  PL_RANCHER_VALUE:                 'rancher',
  UI_BANNERS:                       'ui-banners',
  UI_ISSUES:                        'ui-issues',
  SUPPORTED_DOCKER:                 'engine-supported-range',
  NEWEST_DOCKER:                    'engine-newest-version',
  SERVER_URL:                       'server-url',
  RKE_METADATA_CONFIG:              'rke-metadata-config',
  TELEMETRY:                        'telemetry-opt',
  EULA_AGREED:                      'eula-agreed',
  AUTH_USER_INFO_MAX_AGE_SECONDS:   'auth-user-info-max-age-seconds',
  AUTH_USER_SESSION_TTL_MINUTES:    'auth-user-session-ttl-minutes',
  AUTH_USER_INFO_RESYNC_CRON:       'auth-user-info-resync-cron',
  AUTH_LOCAL_VALIDATE_DESC:         'auth-password-requirements-description',
  FEEDBACK_FORM:                    'ui-feedback-form',
  CLUSTER_TEMPLATE_ENFORCEMENT:     'cluster-template-enforcement',
  UI_DEFAULT_LANDING:               'ui-default-landing',
  BRAND:                            'brand'
};

// These are the settings that are allowed to be edited via the UI
export const ALLOWED_SETTINGS = {
  [SETTING.CA_CERTS]:                       { kind: 'multiline', readOnly: true },
  // [SETTING.CLUSTER_DEFAULTS]:            { kind: 'json' },
  [SETTING.ENGINE_URL]:                     {},
  [SETTING.ENGINE_ISO_URL]:                 {},
  [SETTING.PL]:                             {},
  [SETTING.UI_ISSUES]:                      {},
  [SETTING.INGRESS_IP_DOMAIN]:              {},
  [SETTING.AUTH_USER_INFO_MAX_AGE_SECONDS]: {},
  [SETTING.AUTH_USER_SESSION_TTL_MINUTES]:  {},
  [SETTING.AUTH_TOKEN_MAX_TTL_MINUTES]:     {},
  [SETTING.AUTH_USER_INFO_RESYNC_CRON]:     {},
  [SETTING.SERVER_URL]:                     { kind: 'url' },
  [SETTING.RKE_METADATA_CONFIG]:            { kind: 'json' },
  [SETTING.UI_BANNERS]:                     { kind: 'json' },
  'system-default-registry':                  {},
  'ui-index':                                 {},
  [SETTING.BRAND]:                          {},
  [SETTING.CLUSTER_TEMPLATE_ENFORCEMENT]:   { kind: 'boolean' },

  [SETTING.UI_DEFAULT_LANDING]: {
    kind:    'enum',
    options: ['ember', 'vue']
  },
  [SETTING.TELEMETRY]: {
    kind:    'enum',
    options: ['prompt', 'in', 'out']
  },
};
