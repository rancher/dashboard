export const NORMAN_NAME = 'field.cattle.io/name';
export const DESCRIPTION = 'field.cattle.io/description';
export const HOSTNAME = 'kubernetes.io/hostname';
export const TIMESTAMP = 'cattle.io/timestamp';
export const SYSTEM_NAMESPACE = 'management.cattle.io/system-namespace';
export const PROJECT = 'field.cattle.io/projectId';
export const DEFAULT_PROJECT = 'authz.management.cattle.io/default-project';
export const SYSTEM_PROJECT = 'authz.management.cattle.io/system-project';
export const CONTAINER_DEFAULT_RESOURCE_LIMIT = 'field.cattle.io/containerDefaultResourceLimit';
export const CATTLE_PUBLIC_ENDPOINTS = 'field.cattle.io/publicEndpoints';
export const TARGET_WORKLOADS = 'field.cattle.io/targetWorkloadIds';
export const UI_MANAGED = 'management.cattle.io/ui-managed';
export const CREATOR_ID = 'field.cattle.io/creatorId';
export const RESOURCE_QUOTA = 'field.cattle.io/resourceQuota';
export const AZURE_MIGRATED = 'auth.cattle.io/azuread-endpoint-migrated';

export const KUBERNETES = {
  SERVICE_ACCOUNT_UID:  'kubernetes.io/service-account.uid',
  SERVICE_ACCOUNT_NAME: 'kubernetes.io/service-account.name',
  MANAGED_BY:           'app.kubernetes.io/managed-by',
  MANAGED_NAME:         'app.kubernetes.io/name',
  INSTANCE:             'app.kubernetes.io/instance',
};

export const CERTMANAGER = { ISSUER: 'cert-manager.io/issuer-name' };

export const STORAGE = {
  DEFAULT_STORAGE_CLASS:      'storageclass.kubernetes.io/is-default-class',
  BETA_DEFAULT_STORAGE_CLASS: 'storageclass.beta.kubernetes.io/is-default-class'
};

export const MANAGEMENT_NODE = { NODE_NAME: 'management.cattle.io/nodename' };

export const NODE_ROLES = {
  CONTROL_PLANE_OLD: 'node-role.kubernetes.io/controlplane',
  CONTROL_PLANE:     'node-role.kubernetes.io/control-plane',
  WORKER:            'node-role.kubernetes.io/worker',
  ETCD:              'node-role.kubernetes.io/etcd',
};

export const MACHINE_ROLES = {
  CONTROL_PLANE: 'rke.cattle.io/control-plane-role',
  WORKER:        'rke.cattle.io/worker-role',
  ETCD:          'rke.cattle.io/etcd-role',
};

export const CAPI = {
  DEPLOYMENT_NAME:      'cluster.x-k8s.io/deployment-name',
  CREDENTIAL_DRIVER:    'provisioning.cattle.io/driver',
  CLUSTER_NAMESPACE:    'cluster.x-k8s.io/cluster-namespace',
  FORCE_MACHINE_REMOVE: 'provisioning.cattle.io/force-machine-remove',
  MACHINE_NAME:         'cluster.x-k8s.io/machine',
  DELETE_MACHINE:       'cluster.x-k8s.io/delete-machine',
  PROVIDER:             'provider.cattle.io',
  SECRET_AUTH:          'v2prov-secret-authorized-for-cluster',
  SECRET_WILL_DELETE:   'v2prov-authorized-secret-deletes-on-cluster-removal'
};

export const CATALOG = {
  CERTIFIED:     'catalog.cattle.io/certified',
  _RANCHER:      'rancher',
  _PARTNER:      'partner',
  _OTHER:         'other',

  EXPERIMENTAL:  'catalog.cattle.io/experimental',
  NAMESPACE:     'catalog.cattle.io/namespace',
  RELEASE_NAME:  'catalog.cattle.io/release-name',

  REQUIRES_GVK:     'catalog.cattle.io/requires-gvr',
  PROVIDES:         'catalog.cattle.io/provides-gvr',
  AUTO_INSTALL_GVK: 'catalog.cattle.io/auto-install-gvr',
  AUTO_INSTALL:     'catalog.cattle.io/auto-install',
  HIDDEN:           'catalog.cattle.io/hidden',
  REQUESTS_CPU:     'catalog.cattle.io/requests-cpu',
  REQUESTS_MEMORY:  'catalog.cattle.io/requests-memory',

  SCOPE:            'catalog.cattle.io/scope',
  _MANAGEMENT:      'management',
  _DOWNSTREAM:      'downstream',

  TYPE:             'catalog.cattle.io/type',
  _APP:             'app',
  _CLUSTER_TPL:     'cluster-template',
  _CLUSTER_TOOL:    'cluster-tool',

  COMPONENT:        'catalog.cattle.io/ui-component',
  SOURCE_REPO_TYPE: 'catalog.cattle.io/ui-source-repo-type',
  SOURCE_REPO_NAME: 'catalog.cattle.io/ui-source-repo',
  COLOR:            'catalog.cattle.io/ui-color',
  DISPLAY_NAME:     'catalog.cattle.io/display-name',

  SUPPORTED_OS: 'catalog.cattle.io/os',
  PERMITTED_OS: 'catalog.cattle.io/permits-os',
  DEPLOYED_OS:   'catalog.cattle.io/deploys-on-os',

  MIGRATED: 'apps.cattle.io/migrated',
  MANAGED:  'catalog.cattle.io/managed'
};

export const FLEET = {
  CLUSTER_DISPLAY_NAME: 'management.cattle.io/cluster-display-name',
  CLUSTER_NAME:         'management.cattle.io/cluster-name',
  BUNDLE_ID:            'fleet.cattle.io/bundle-id',
  MANAGED:              'fleet.cattle.io/managed'
};

export const RBAC = { PRODUCT: 'management.cattle.io/ui-product' };

export const RKE = { EXTERNAL_IP: 'rke.cattle.io/external-ip' };

export const SNAPSHOT = { CLUSTER_NAME: 'rke.cattle.io/cluster-name' };

export const ISTIO = { AUTO_INJECTION: 'istio-injection' };

const CATTLE_REGEX = /cattle\.io\//;

export const LABELS_TO_IGNORE_REGEX = [
  CATTLE_REGEX
];

export const ANNOTATIONS_TO_IGNORE_REGEX = [
  CATTLE_REGEX
];

export const ANNOTATIONS_TO_FOLD = [
  /^kubectl\.kubernetes\.io\/.*$/,
  /^objectset\.rio\.cattle\.io\/.*$/,
];

export const HCI = {
  CLUSTER_ID:                   'harvesterhci.io/clusterId',
  CLOUD_INIT:                   'harvesterhci.io/cloud-init-template',
  CURRENT_IP:                   'rke2.io/internal-ip',
  OWNED_BY:                     'harvesterhci.io/owned-by',
  CREATED_BY:                   'kubevirt.io/created-by',
  IMAGE_ID:                     'harvesterhci.io/imageId',
  SSH_NAMES:                    'harvesterhci.io/sshNames',
  CIRD_NETWORK:                 'k8s.v1.cni.cncf.io/networks',
  NETWORK_IPS:                  'network.harvesterhci.io/ips',
  TEMPLATE_VERSION_CUSTOM_NAME: 'template-version.harvesterhci.io/customName',
  CREATOR:                      'harvesterhci.io/creator',
  OS:                           'harvesterhci.io/os',
  NETWORK_TYPE:                 'network.harvesterhci.io/type',
  VM_NAME:                      'harvesterhci.io/vmName',
  VM_NAME_PREFIX:               'harvesterhci.io/vmNamePrefix',
  VM_RESERVED_MEMORY:           'harvesterhci.io/reservedMemory',
  MAINTENANCE_STATUS:           'harvesterhci.io/maintain-status',
  HOST_CUSTOM_NAME:             'harvesterhci.io/host-custom-name',
  HOST_CONSOLE_URL:             'harvesterhci.io/host-console-url',
  BACKUP_TARGET:                'backup.harvesterhci.io/backup-target',
  RESTORE_NAME:                 'restore.harvesterhci.io/name',
  NODE_ROLE_MASTER:             'node-role.kubernetes.io/master',
  NODE_ROLE_CONTROL_PLANE:      'node-role.kubernetes.io/control-plane',
  PROMOTE_STATUS:               'harvesterhci.io/promote-status',
  MIGRATION_STATE:              'harvesterhci.io/migrationState',
  VOLUME_CLAIM_TEMPLATE:        'harvesterhci.io/volumeClaimTemplates',
  IMAGE_NAME:                   'harvesterhci.io/image-name',
  INIT_IP:                      'etcd.rke2.cattle.io/node-address',
  NODE_SCHEDULABLE:             'kubevirt.io/schedulable',
  NETWORK_ROUTE:                'network.harvesterhci.io/route',
  CLOUD_PROVIDER_IPAM:          'cloudprovider.harvesterhci.io/ipam',
  OS_UPGRADE_IMAGE:             'harvesterhci.io/os-upgrade-image',
  UPGRADE_IMAGE:                'harvesterhci.io/upgradeImage',
  LATEST_UPGRADE:               'harvesterhci.io/latestUpgrade',
  UPGRADE_STATE:                'harvesterhci.io/upgradeState',
  REAY_MESSAGE:                 'harvesterhci.io/read-message',
  DYNAMIC_SSHKEYS_NAMES:        'harvesterhci.io/dynamic-ssh-key-names',
  DYNAMIC_SSHKEYS_USERS:        'harvesterhci.io/dynamic-ssh-key-users',
  VM_VOLUME_STATUS:             'harvesterhci.io/volume-status',
  IMAGE_SUFFIX:                 'harvesterhci.io/image-type',
  OS_TYPE:                      'harvesterhci.io/os-type',
  HOST_REQUEST:                 'management.cattle.io/pod-requests',
};

// Annotations that can be on management.cattle.io.cluster to configure a custom badge
// Can't use ui.cattle.io - it seems to strip these out - so using io.rancher
export const CLUSTER_BADGE = {
  // Badge text - badge is only shown if badge text is not empty
  TEXT:        'ui.rancher/badge-text',
  // Badge color - as a hex color - e.g. #ff00ff
  COLOR:       'ui.rancher/badge-color',
  // Custom icon text - max 2 characters
  ICON_TEXT:   'ui.rancher/badge-icon-text',
};
