// Settings
import { GC_DEFAULTS, GC_PREFERENCES } from '@shell/utils/gc/gc-types';
import { PaginationSettings } from '@shell/types/resources/settings';

interface GlobalSettingRuleset {
  name: string,
  key?: string | number,
  factoryArg?: string | number | (string | number)[]
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
    warning?: string
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
  HIDE_LOCAL_CLUSTER:                            'hide-local-cluster',
  AUTH_TOKEN_MAX_TTL_MINUTES:                    'auth-token-max-ttl-minutes',
  KUBECONFIG_GENERATE_TOKEN:                     'kubeconfig-generate-token',
  KUBECONFIG_DEFAULT_TOKEN_TTL_MINUTES:          'kubeconfig-default-token-ttl-minutes',
  ENGINE_URL:                                    'engine-install-url',
  ENGINE_ISO_URL:                                'engine-iso-url',
  FIRST_LOGIN:                                   'first-login',
  INGRESS_IP_DOMAIN:                             'ingress-ip-domain',
  SERVER_URL:                                    'server-url',
  RKE_METADATA_CONFIG:                           'rke-metadata-config',
  EULA_AGREED:                                   'eula-agreed',
  AUTH_USER_INFO_MAX_AGE_SECONDS:                'auth-user-info-max-age-seconds',
  AUTH_USER_SESSION_TTL_MINUTES:                 'auth-user-session-ttl-minutes',
  AUTH_USER_INFO_RESYNC_CRON:                    'auth-user-info-resync-cron',
  AUTH_LOCAL_VALIDATE_DESC:                      'auth-password-requirements-description',
  PASSWORD_MIN_LENGTH:                           'password-min-length', // CATTLE_PASSWORD_MIN_LENGTH
  CLUSTER_TEMPLATE_ENFORCEMENT:                  'cluster-template-enforcement',
  UI_INDEX:                                      'ui-index',
  UI_DASHBOARD_INDEX:                            'ui-dashboard-index',
  UI_DASHBOARD_HARVESTER_LEGACY_PLUGIN:          'ui-dashboard-harvester-legacy-plugin',
  UI_OFFLINE_PREFERRED:                          'ui-offline-preferred',
  SYSTEM_DEFAULT_REGISTRY:                       'system-default-registry',
  UI_ISSUES:                                     'ui-issues',
  PL:                                            'ui-pl',
  PL_RANCHER_VALUE:                              'rancher',
  SUPPORTED:                                     'has-support',
  BANNERS:                                       'ui-banners',
  ISSUES:                                        'ui-issues',
  BRAND:                                         'ui-brand',
  LOGO_LIGHT:                                    'ui-logo-light',
  LOGO_DARK:                                     'ui-logo-dark',
  BANNER_LIGHT:                                  'ui-banner-light',
  BANNER_DARK:                                   'ui-banner-dark',
  LOGIN_BACKGROUND_LIGHT:                        'ui-login-background-light',
  LOGIN_BACKGROUND_DARK:                         'ui-login-background-dark',
  PRIMARY_COLOR:                                 'ui-primary-color',
  LINK_COLOR:                                    'ui-link-color',
  COMMUNITY_LINKS:                               'ui-community-links',
  FAVICON:                                       'ui-favicon',
  UI_PERFORMANCE:                                'ui-performance',
  UI_CUSTOM_LINKS:                               'ui-custom-links',
  UI_SUPPORTED_K8S_VERSIONS:                     'ui-k8s-supported-versions-range',
  /**
   * Allow the backend to force a light/dark theme. Used in non-rancher world and results in the theme used
   * both pre and post log in. If not present defaults to the usual process
   */
  THEME:                                         'ui-theme',
  SYSTEM_NAMESPACES:                             'system-namespaces',
  /**
   * Cluster Agent configuration
   */
  CLUSTER_AGENT_DEFAULT_AFFINITY:                'cluster-agent-default-affinity',
  FLEET_AGENT_DEFAULT_AFFINITY:                  'fleet-agent-default-affinity',
  /**
   * manage rancher repositories in extensions (official, partners repos)
  */
  ADD_EXTENSION_REPOS_BANNER_DISPLAY:            'display-add-extension-repos-banner',
  AGENT_TLS_MODE:                                'agent-tls-mode',
  /**
   * User retention settings
   */
  USER_RETENTION_CRON:                           'user-retention-cron',
  USER_RETENTION_DRY_RUN:                        'user-retention-dry-run',
  USER_LAST_LOGIN_DEFAULT:                       'user-last-login-default',
  DISABLE_INACTIVE_USER_AFTER:                   'disable-inactive-user-after',
  DELETE_INACTIVE_USER_AFTER:                    'delete-inactive-user-after',
  K3S_UPGRADER_UNINSTALL_CONCURRENCY:            'k3s-based-upgrader-uninstall-concurrency',
  IMPORTED_CLUSTER_VERSION_MANAGEMENT:           'imported-cluster-version-management',
  CLUSTER_AGENT_DEFAULT_PRIORITY_CLASS:          'cluster-agent-default-priority-class',
  CLUSTER_AGENT_DEFAULT_POD_DISTRIBUTION_BUDGET: 'cluster-agent-default-pod-disruption-budget'
} as const;

// These are the settings that are allowed to be edited via the UI
export const ALLOWED_SETTINGS: GlobalSetting = {
  [SETTING.CA_CERTS]:            { kind: 'multiline', readOnly: true },
  [SETTING.ENGINE_URL]:          {},
  [SETTING.ENGINE_ISO_URL]:      {},
  [SETTING.PASSWORD_MIN_LENGTH]: {
    kind:    'integer',
    ruleSet: [
      {
        name:       'betweenValues',
        key:        'Password',
        factoryArg: [2, 256]
      },
      {
        name: 'isInteger',
        key:  'Password',
      },
      {
        name: 'isPositive',
        key:  'Password',
      },
      {
        name: 'isOctal',
        key:  'Password',
      }
    ],
  },
  [SETTING.INGRESS_IP_DOMAIN]:                    {},
  [SETTING.AUTH_USER_INFO_MAX_AGE_SECONDS]:       {},
  [SETTING.AUTH_USER_SESSION_TTL_MINUTES]:        {},
  [SETTING.AUTH_TOKEN_MAX_TTL_MINUTES]:           {},
  [SETTING.KUBECONFIG_GENERATE_TOKEN]:            { kind: 'boolean' },
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
  [SETTING.HIDE_LOCAL_CLUSTER]:           { kind: 'boolean' },
  [SETTING.AGENT_TLS_MODE]:               {
    kind:    'enum',
    options: ['strict', 'system-store'],
    warning: 'agent-tls-mode'
  },
  [SETTING.K3S_UPGRADER_UNINSTALL_CONCURRENCY]: {
    kind:    'integer',
    ruleSet: [{ name: 'minValue', factoryArg: 1 }]
  },
  [SETTING.IMPORTED_CLUSTER_VERSION_MANAGEMENT]:           { kind: 'boolean' },
  [SETTING.CLUSTER_AGENT_DEFAULT_PRIORITY_CLASS]:          { kind: 'json' },
  [SETTING.CLUSTER_AGENT_DEFAULT_POD_DISTRIBUTION_BUDGET]: { kind: 'json' }

};

export const PROVISIONING_SETTINGS = ['engine-iso-url', 'engine-install-url', 'imported-cluster-version-management', 'cluster-agent-default-priority-class', 'cluster-agent-default-pod-disruption-budget'];
/**
 * Settings on how to handle warnings returning in api responses, specifically which to show as growls
 */
export interface PerfSettingsWarningHeaders {
  /**
   * Warning is a string containing multiple entries. This determines how they are split up
   *
   * See https://github.com/kubernetes/enhancements/tree/master/keps/sig-api-machinery/1693-warnings#design-details
   */
  separator: string,
  /**
   * Show warnings in a notification if they're not in this block list
   */
  notificationBlockList: string[]
}

export interface PerfSettingsKubeApi {
  /**
   * Settings related to the response header `warnings` value
   */
  warningHeader: PerfSettingsWarningHeaders
}

export interface PerfSettings {
  inactivity: {
      enabled: boolean;
      threshold: number;
  };
  incrementalLoading: {
      enabled: boolean;
      threshold: number;
  };
  manualRefresh: {};
  disableWebsocketNotification: boolean;
  garbageCollection: GC_PREFERENCES;
  forceNsFilterV2: any;
  advancedWorker: {};
  kubeAPI: PerfSettingsKubeApi;
  serverPagination: PaginationSettings;
}

export const DEFAULT_PERF_SETTING: PerfSettings = {
  inactivity: {
    enabled:   false,
    threshold: 900,
  },
  incrementalLoading: {
    enabled:   true,
    threshold: 1500,
  },
  manualRefresh: {
    enabled:   false,
    threshold: 1500,
  },
  disableWebsocketNotification: true,
  garbageCollection:            GC_DEFAULTS,
  forceNsFilterV2:              { enabled: false },
  advancedWorker:               { enabled: false },
  kubeAPI:                      {
    /**
     * Settings related to the response header `warnings` value
     */
    warningHeader: {
      /**
       * Warning is a string containing multiple entries. This determines how they are split up
       *
       * See https://github.com/kubernetes/enhancements/tree/master/keps/sig-api-machinery/1693-warnings#design-details
       */
      separator:             '299 - ',
      /**
       * Show warnings in a notification if they're not in this block list
       */
      notificationBlockList: ['299 - unknown field']
    }
  },
  serverPagination: {
    enabled:          false,
    useDefaultStores: true,
    stores:           undefined,
  }
};
