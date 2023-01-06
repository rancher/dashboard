// Settings
import { GC_DEFAULTS } from '../utils/gc/gc-types';
import { MANAGEMENT } from './types';
import { Store } from 'vuex';

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
     unit?: string
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
  SYSTEM_NAMESPACES:                    'system-namespaces',

  SYSTEM_GPU_MANAGEMENT_SCHEDULER_NAME: 'system-gpu-management-scheduler-name',
  UI_SESSION_LOGOUT_MINUTES:            'ui-session-logout-minutes',
  UI_LOGIN_LANDSCAPE:                   'ui-login-landscape',
  FOOTER_TEXT:                          'ui-footer-text',
  FOOTER_URL:                           'ui-footer-url',
  DISABLE_PASSWORD_ENCRYPT:             'disable-password-encrypt',
  AUDIT_LOG_SERVER_URL:                 'auditlog-server-url',
  WHITELIST_DOMAIN:                     'whitelist-domain',
  DOWNLOAD_FILE_SIZE_LIMIT:             'download-file-size-limit',
  PANDARIA_ENABLE_HEALTHCHECK_API:      'pandaria-enable-healthcheck-api',
  RESTRICTED_DEFAULT_ADMIN:             'restricted-default-admin',
  ROTATE_CERTS_IF_EXPIRING_IN_DAYS:     'rotate-certs-if-expiring-in-days',
  SYSTEM_CATALOG:                       'system-catalog',
  GLOBAL_MONITORING_ENABLED:            'global-monitoring-enabled',
  GLOBAL_MONITORING_ENABLED_V2:         'global-monitoring-enabled-v2',
  GLOBAL_MONITORING_CLUSTER_ID:         'global-monitoring-cluster-id',
  GLOBAL_MONITORING_V2:                 'global-monitoring-v2',
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

  [SETTING.UI_SESSION_LOGOUT_MINUTES]: {},
  [SETTING.FOOTER_TEXT]:               {},
  [SETTING.FOOTER_URL]:                { kind: 'url' },
  [SETTING.DISABLE_PASSWORD_ENCRYPT]:  { kind: 'boolean' },
  [SETTING.AUDIT_LOG_SERVER_URL]:      { kind: 'url' },
  [SETTING.DOWNLOAD_FILE_SIZE_LIMIT]:  {
    kind: 'int',
    unit: 'Mi'
  },
  [SETTING.PANDARIA_ENABLE_HEALTHCHECK_API]:  { kind: 'boolean' },
  [SETTING.RESTRICTED_DEFAULT_ADMIN]:         { kind: 'boolean' },
  [SETTING.ROTATE_CERTS_IF_EXPIRING_IN_DAYS]: { kind: 'int' },
  [SETTING.SYSTEM_CATALOG]:                   {
    kind:    'enum',
    options: ['external', 'bundled']
  },
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
  garbageCollection:            GC_DEFAULTS,
  forceNsFilter:                {
    enabled:   false,
    threshold: 1500,
  }
};

export const DEFAULT_GMV2_SETTING = {
  clusterId:          'local',
  enabled:            'false',
  enabledClusters:    [],
  otherClusterStores: [],
  useDefaultToken:    'true'
};

export const removeSetting = async(store: Store<any>, id: string) => {
  const setting = store.getters['management/byId'](MANAGEMENT.SETTING, id);

  await setting.remove();
};

export const getGlobalMonitoringV2Setting = (getters: any) => {
  // Compatible with older versions
  let legacyEnabled = 'false';
  let legacyClusterId = 'local';
  let setting: any = '';

  try {
    setting = getters['management/byId'](MANAGEMENT.SETTING, SETTING.GLOBAL_MONITORING_V2);
    legacyEnabled = getters['management/byId'](MANAGEMENT.SETTING, SETTING.GLOBAL_MONITORING_ENABLED_V2)?.value || 'false';
    legacyClusterId = getters['management/byId'](MANAGEMENT.SETTING, SETTING.GLOBAL_MONITORING_CLUSTER_ID)?.value || 'local';
  } catch (error) {}

  if (legacyEnabled === 'true' && (!setting || setting.value === '{}')) {
    const newSettings = {
      ...DEFAULT_GMV2_SETTING,
      clusterId: legacyClusterId,
      enabled:   'true',
    };

    return newSettings;
  }

  // New Version Policy
  let config = {};

  if (setting && setting.value) {
    try {
      config = JSON.parse(setting.value);
    } catch (e) {
      console.warn('global-monitoring-v2 setting contains invalid data'); // eslint-disable-line no-console
    }
  }

  // Start with the default and overwrite the values from the setting - ensures we have defaults for newly added options
  config = Object.assign({}, DEFAULT_GMV2_SETTING, config);

  return config;
};
