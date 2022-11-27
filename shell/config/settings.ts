// Settings
import { GC_DEFAULTS } from '../utils/gc/gc-types';

interface GlobalSettingRuleset {
  name: string,
  key?: string | number,
  arg?: string | number | (string | number)[]
}

interface GlobalSetting {
  [key: string]: {
    alias?: string,
    canReset?: boolean,
    customFormatter?: string,
    from?: string,
    kind?: string,
    options?: string[]
    readOnly?: boolean,
    /**
     * Function used from the form validation
     */
     ruleSet?: GlobalSettingRuleset[],
  };
}

// Adapted from: https://github.com/rancher/ui/blob/08c379a9529f740666a704b52522a468986c3520/lib/shared/addon/utils/constants.js#L564
// Setting IDs
export const SETTING = {
  VERSION_RANCHER: 'server-version',
  VERSION_CLI:     'cli-version',
  VERSION_MACHINE: 'machine-version',
  VERSION_HELM:    'helm-version',
  CLI_URL:         {
    DARWIN:  'cli-url-darwin',
    WINDOWS: 'cli-url-windows',
    LINUX:   'cli-url-linux',
  },
  API_HOST: 'api-host',
  CA_CERTS: 'cacerts',

  // Allow the local cluster to be hidden
  HIDE_LOCAL_CLUSTER:                   'hide-local-cluster',
  AUTH_TOKEN_MAX_TTL_MINUTES:           'auth-token-max-ttl-minutes',
  KUBECONFIG_GENERATE_TOKEN:            'kubeconfig-generate-token',
  KUBECONFIG_TOKEN_TTL_MINUTES:         'kubeconfig-token-ttl-minutes',
  KUBECONFIG_DEFAULT_TOKEN_TTL_MINUTES: 'kubeconfig-default-token-ttl-minutes',
  ENGINE_URL:                           'engine-install-url',
  ENGINE_ISO_URL:                       'engine-iso-url',
  FIRST_LOGIN:                          'first-login',
  INGRESS_IP_DOMAIN:                    'ingress-ip-domain',
  SERVER_URL:                           'server-url',
  RKE_METADATA_CONFIG:                  'rke-metadata-config',
  TELEMETRY:                            'telemetry-opt',
  EULA_AGREED:                          'eula-agreed',
  AUTH_USER_INFO_MAX_AGE_SECONDS:       'auth-user-info-max-age-seconds',
  AUTH_USER_SESSION_TTL_MINUTES:        'auth-user-session-ttl-minutes',
  AUTH_USER_INFO_RESYNC_CRON:           'auth-user-info-resync-cron',
  AUTH_LOCAL_VALIDATE_DESC:             'auth-password-requirements-description',
  CATTLE_PASSWORD_MIN_LENGTH:           'password-min-length',
  CLUSTER_TEMPLATE_ENFORCEMENT:         'cluster-template-enforcement',
  UI_INDEX:                             'ui-index',
  UI_DASHBOARD_INDEX:                   'ui-dashboard-index',
  UI_DASHBOARD_HARVESTER_LEGACY_PLUGIN: 'ui-dashboard-harvester-legacy-plugin',
  UI_OFFLINE_PREFERRED:                 'ui-offline-preferred',
  SYSTEM_DEFAULT_REGISTRY:              'system-default-registry',
  UI_ISSUES:                            'ui-issues',
  PL:                                   'ui-pl',
  PL_RANCHER_VALUE:                     'rancher',
  SUPPORTED:                            'has-support',
  BANNERS:                              'ui-banners',
  ISSUES:                               'ui-issues',
  BRAND:                                'ui-brand',
  LOGO_LIGHT:                           'ui-logo-light',
  LOGO_DARK:                            'ui-logo-dark',
  PRIMARY_COLOR:                        'ui-primary-color',
  LINK_COLOR:                           'ui-link-color',
  COMMUNITY_LINKS:                      'ui-community-links',
  FAVICON:                              'ui-favicon',
  UI_PERFORMANCE:                       'ui-performance',
  UI_CUSTOM_LINKS:                      'ui-custom-links',
  /**
   * Allow the backend to force a light/dark theme. Used in non-rancher world and results in the theme used
   * both pre and post log in. If not present defaults to the usual process
   */
  THEME:                                'ui-theme',
  SYSTEM_NAMESPACES:                    'system-namespaces'
};

// These are the settings that are allowed to be edited via the UI
export const ALLOWED_SETTINGS: GlobalSetting = {
  [SETTING.CA_CERTS]:                   { kind: 'multiline', readOnly: true },
  [SETTING.ENGINE_URL]:                 {},
  [SETTING.ENGINE_ISO_URL]:             {},
  [SETTING.CATTLE_PASSWORD_MIN_LENGTH]: {
    kind:    'integer',
    ruleSet: [
      {
        name: 'betweenValues',
        key:  'Password',
        arg:  [2, 256]
      }
    ],
  },
  [SETTING.INGRESS_IP_DOMAIN]:                    {},
  [SETTING.AUTH_USER_INFO_MAX_AGE_SECONDS]:       {},
  [SETTING.AUTH_USER_SESSION_TTL_MINUTES]:        {},
  [SETTING.AUTH_TOKEN_MAX_TTL_MINUTES]:           {},
  [SETTING.KUBECONFIG_GENERATE_TOKEN]:            { kind: 'boolean' },
  [SETTING.KUBECONFIG_TOKEN_TTL_MINUTES]:         {},
  [SETTING.KUBECONFIG_DEFAULT_TOKEN_TTL_MINUTES]: { kind: 'integer' },
  [SETTING.AUTH_USER_INFO_RESYNC_CRON]:           {},
  [SETTING.SERVER_URL]:                           { kind: 'url', canReset: true },
  [SETTING.RKE_METADATA_CONFIG]:                  { kind: 'json' },
  [SETTING.SYSTEM_DEFAULT_REGISTRY]:              {},
  [SETTING.UI_INDEX]:                             {},
  [SETTING.UI_DASHBOARD_INDEX]:                   {},
  [SETTING.UI_OFFLINE_PREFERRED]:                 {
    kind:    'enum',
    options: ['dynamic', 'true', 'false']
  },
  [SETTING.BRAND]:                        { canReset: true },
  [SETTING.CLUSTER_TEMPLATE_ENFORCEMENT]: { kind: 'boolean' },
  [SETTING.TELEMETRY]:                    {
    kind:    'enum',
    options: ['prompt', 'in', 'out']
  },
  [SETTING.HIDE_LOCAL_CLUSTER]: { kind: 'boolean' },
};

export const DEFAULT_PERF_SETTING = {
  incrementalLoading: {
    enabled:   true,
    threshold: 1500,
  },
  manualRefresh: {
    enabled:   false,
    threshold: 1500,
  },
  disableWebsocketNotification: true,
  garbageCollection:            GC_DEFAULTS
};
