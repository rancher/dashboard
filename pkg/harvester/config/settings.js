export const HCI_SETTING = {
  BACKUP_TARGET:                    'backup-target',
  LOG_LEVEL:                        'log-level',
  SERVER_VERSION:                   'server-version',
  UI_INDEX:                         'ui-index',
  UPGRADE_CHECKER_ENABLED:          'upgrade-checker-enabled',
  UPGRADE_CHECKER_URL:              'upgrade-checker-url',
  VLAN:                             'vlan',
  UI_SOURCE:                        'ui-source',
  HTTP_PROXY:                       'http-proxy',
  ADDITIONAL_CA:                    'additional-ca',
  OVERCOMMIT_CONFIG:                'overcommit-config',
  CLUSTER_REGISTRATION_URL:         'cluster-registration-url',
  DEFAULT_STORAGE_CLASS:            'default-storage-class',
  VIP:                              'vip-pools',
  SUPPORT_BUNDLE_TIMEOUT:           'support-bundle-timeout',
  SUPPORT_BUNDLE_IMAGE:             'support-bundle-image',
  VM_FORCE_RESET_POLICY:            'vm-force-reset-policy',
  SSL_CERTIFICATES:                 'ssl-certificates',
  SSL_PARAMETERS:                   'ssl-parameters',
  SUPPORT_BUNDLE_NAMESPACES:        'support-bundle-namespaces',
  AUTO_DISK_PROVISION_PATHS:        'auto-disk-provision-paths',
  RANCHER_MONITORING:               'fleet-local/rancher-monitoring',
  RELEASE_DOWNLOAD_URL:             'release-download-url',
  CCM_CSI_VERSION:                  'harvester-csi-ccm-versions',
};

export const HCI_ALLOWED_SETTINGS = {
  [HCI_SETTING.BACKUP_TARGET]: { kind: 'json', from: 'import' },
  [HCI_SETTING.LOG_LEVEL]:     {
    kind:    'enum',
    options: ['info', 'debug', 'trace']
  },
  [HCI_SETTING.VLAN]: {
    kind: 'custom', from: 'import', alias: 'vlan'
  },
  [HCI_SETTING.SERVER_VERSION]:                   { readOnly: true },
  [HCI_SETTING.UPGRADE_CHECKER_ENABLED]:          { kind: 'boolean' },
  [HCI_SETTING.UPGRADE_CHECKER_URL]:              { kind: 'url' },
  [HCI_SETTING.HTTP_PROXY]:                       { kind: 'json', from: 'import' },
  [HCI_SETTING.ADDITIONAL_CA]:                    {
    kind: 'multiline', canReset: true, from: 'import'
  },
  [HCI_SETTING.OVERCOMMIT_CONFIG]:                { kind: 'json', from: 'import' },
  [HCI_SETTING.SUPPORT_BUNDLE_TIMEOUT]:           {},
  [HCI_SETTING.SUPPORT_BUNDLE_IMAGE]:             { kind: 'json', from: 'import' },
  [HCI_SETTING.VM_FORCE_RESET_POLICY]:            { kind: 'json', from: 'import' },
  [HCI_SETTING.SSL_CERTIFICATES]:                 { kind: 'json', from: 'import' },
  [HCI_SETTING.VIP]:                      {
    kind: 'json', from: 'import', canReset: true
  },
  [HCI_SETTING.SSL_PARAMETERS]:                   {
    kind: 'json', from: 'import', canReset: true
  },
  [HCI_SETTING.SUPPORT_BUNDLE_NAMESPACES]: { from: 'import', canReset: true },
  [HCI_SETTING.AUTO_DISK_PROVISION_PATHS]: { canReset: true },
  [HCI_SETTING.RANCHER_MONITORING]:                {
    kind: 'custom', from: 'import', canReset: true, customFormatter: 'json', alias: 'harvester-monitoring'
  },
  [HCI_SETTING.RELEASE_DOWNLOAD_URL]: { kind: 'url' },
};

export const HCI_SINGLE_CLUSTER_ALLOWED_SETTING = {
  [HCI_SETTING.UI_SOURCE]: {
    kind:    'enum',
    options: ['auto', 'external', 'bundled']
  },
  [HCI_SETTING.UI_INDEX]:                 { kind: 'url' },
  [HCI_SETTING.CLUSTER_REGISTRATION_URL]: { kind: 'url' },
};
