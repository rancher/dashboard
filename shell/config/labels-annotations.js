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
export const CREATOR_PRINCIPAL_ID = 'field.cattle.io/creator-principal-name';
export const RESOURCE_QUOTA = 'field.cattle.io/resourceQuota';
export const AZURE_MIGRATED = 'auth.cattle.io/azuread-endpoint-migrated';
export const WORKSPACE_ANNOTATION = 'objectset.rio.cattle.io/id';
export const NODE_ARCHITECTURE = 'kubernetes.io/arch';
export const IMPORTED_CLUSTER_VERSION_MANAGEMENT = 'rancher.io/imported-cluster-version-management';

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
  /**
   * RKE2 - metadata.name is human name
   * RKE1 and some others - metadata.name is v1 mgmt id and it's the v1 mgmt cluster that contains human name
   * This label ensures something is in the v1 prov cluster that can be sorted/filtered on
   */
  HUMAN_NAME:           'provisioning.cattle.io/management-cluster-display-name',
  SECRET_AUTH:          'v2prov-secret-authorized-for-cluster',
  SECRET_WILL_DELETE:   'v2prov-authorized-secret-deletes-on-cluster-removal',
  /**
   * Annotation for overriding the cluster provider,
   */
  UI_CUSTOM_PROVIDER:   'ui.rancher/provider'
};

export const CATALOG = {
  CERTIFIED: 'catalog.cattle.io/certified',
  _RANCHER:  'rancher',
  _PARTNER:  'partner',
  _OTHER:    'other',

  EXPERIMENTAL: 'catalog.cattle.io/experimental',
  NAMESPACE:    'catalog.cattle.io/namespace',
  RELEASE_NAME: 'catalog.cattle.io/release-name',
  FEATURED:     'catalog.cattle.io/featured',

  REQUIRES_GVK:     'catalog.cattle.io/requires-gvr',
  PROVIDES:         'catalog.cattle.io/provides-gvr',
  AUTO_INSTALL_GVK: 'catalog.cattle.io/auto-install-gvr',
  AUTO_INSTALL:     'catalog.cattle.io/auto-install',
  HIDDEN:           'catalog.cattle.io/hidden',
  REQUESTS_CPU:     'catalog.cattle.io/requests-cpu',
  REQUESTS_MEMORY:  'catalog.cattle.io/requests-memory',

  SCOPE:       'catalog.cattle.io/scope',
  _MANAGEMENT: 'management',
  _DOWNSTREAM: 'downstream',

  TYPE:          'catalog.cattle.io/type',
  _APP:          'app',
  _CLUSTER_TPL:  'cluster-template',
  _CLUSTER_TOOL: 'cluster-tool',

  COMPONENT:         'catalog.cattle.io/ui-component',
  SOURCE_REPO_TYPE:  'catalog.cattle.io/ui-source-repo-type',
  SOURCE_REPO_NAME:  'catalog.cattle.io/ui-source-repo',
  COLOR:             'catalog.cattle.io/ui-color',
  DISPLAY_NAME:      'catalog.cattle.io/display-name',
  CLUSTER_REPO_NAME: 'catalog.cattle.io/cluster-repo-name',

  SUPPORTED_OS: 'catalog.cattle.io/os',
  PERMITTED_OS: 'catalog.cattle.io/permits-os',
  DEPLOYED_OS:  'catalog.cattle.io/deploys-on-os',

  MIGRATED: 'apps.cattle.io/migrated',
  MANAGED:  'catalog.cattle.io/managed',

  HIDDEN_REPO: 'clusterrepo.cattle.io/hidden'
};

export const FLEET = {
  REPO_NAME:            'fleet.cattle.io/repo-name',
  CLUSTER_DISPLAY_NAME: 'management.cattle.io/cluster-display-name',
  CLUSTER_NAME:         'management.cattle.io/cluster-name',
  BUNDLE_ID:            'fleet.cattle.io/bundle-id',
  BUNDLE_NAME:          'fleet.cattle.io/bundle-name',
  BUNDLE_NAMESPACE:     'fleet.cattle.io/bundle-namespace',
  MANAGED:              'fleet.cattle.io/managed',
  CLUSTER_NAMESPACE:    'fleet.cattle.io/cluster-namespace',
  CLUSTER:              'fleet.cattle.io/cluster',
  CREATED_BY_USER_ID:   'fleet.cattle.io/created-by-user-id',
  CREATED_BY_USER_NAME: 'fleet.cattle.io/created-by-display-name',
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
  CLOUD_INIT:          'harvesterhci.io/cloud-init-template',
  CLOUD_PROVIDER_IPAM: 'cloudprovider.harvesterhci.io/ipam',
  NETWORK_ROUTE:       'network.harvesterhci.io/route',
  IMAGE_NAME:          'harvesterhci.io/image-name',
  NETWORK_TYPE:        'network.harvesterhci.io/type',
  CLUSTER_NETWORK:     'network.harvesterhci.io/clusternetwork',
  PRIMARY_SERVICE:     'cloudprovider.harvesterhci.io/primary-service',
};

// Annotations that can be on management.cattle.io.cluster to configure a custom badge
// Can't use ui.cattle.io - it seems to strip these out - so using io.rancher
export const CLUSTER_BADGE = {
  // Badge text - badge is only shown if badge text is not empty
  TEXT:      'ui.rancher/badge-text',
  // Badge color - as a hex color - e.g. #ff00ff
  COLOR:     'ui.rancher/badge-color',
  // Custom icon text - max 3 characters
  ICON_TEXT: 'ui.rancher/badge-icon-text',
};

export const SYSTEM_LABELS = [
  'io.cattle.lifecycle.',
  'beta.kubernetes.io',
  'failure-domain.beta.kubernetes.io',
  'node-role.kubernetes.io',
  'kubernetes.io',
  'cattle.io',
  'authz.management.cattle.io',
  'rke.cattle.io',
  'field.cattle.io',
  'workload.user.cattle.io',
  'k3s.io',
  'node.kubernetes.io',
  'egress.rke2.io'
];

export const CLOUD_CREDENTIALS = { EXPIRATION: 'rancher.io/expiration-timestamp' };
