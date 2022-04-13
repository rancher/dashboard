import {
  CONFIG_MAP,
  EVENT,
  NODE, SECRET, INGRESS,
  WORKLOAD, WORKLOAD_TYPES, SERVICE, HPA, NETWORK_POLICY, PV, PVC, STORAGE_CLASS, POD,
  RBAC,
  MANAGEMENT,
  NAMESPACE,
  NORMAN,
  VIRTUAL_TYPES,
} from '@shell/config/types';

import {
  STATE, NAME as NAME_COL, NAMESPACE as NAMESPACE_COL, AGE, KEYS,
  INGRESS_DEFAULT_BACKEND, INGRESS_TARGET,
  SPEC_TYPE, TARGET_PORT, SELECTOR, NODE as NODE_COL, TYPE, WORKLOAD_IMAGES, POD_IMAGES,
  USER_ID, USERNAME, USER_DISPLAY_NAME, USER_PROVIDER, WORKLOAD_ENDPOINTS, STORAGE_CLASS_DEFAULT,
  STORAGE_CLASS_PROVISIONER, PERSISTENT_VOLUME_SOURCE,
  HPA_REFERENCE, MIN_REPLICA, MAX_REPLICA, CURRENT_REPLICA,
  ACCESS_KEY, DESCRIPTION, EXPIRES, EXPIRY_STATE, SUB_TYPE, AGE_NORMAN, SCOPE_NORMAN, PERSISTENT_VOLUME_CLAIM, RECLAIM_POLICY, PV_REASON, WORKLOAD_HEALTH_SCALE
} from '@shell/config/table-headers';

import { DSL } from '@shell/store/type-map';

export const NAME = 'explorer';

export function init(store) {
  const {
    product,
    basicType,
    ignoreType,
    mapGroup,
    weightGroup,
    weightType,
    headers,
    virtualType,
    componentForType,
    configureType,
    setGroupDefaultType,
  } = DSL(store, NAME);

  product({
    removable:           false,
    weight:              3,
    showNamespaceFilter: true,
    icon:                'compass',
    typeStoreMap:        {
      [MANAGEMENT.PROJECT]:                       'management',
      [MANAGEMENT.CLUSTER_ROLE_TEMPLATE_BINDING]: 'management',
      [MANAGEMENT.PROJECT_ROLE_TEMPLATE_BINDING]: 'management'
    }
  });

  basicType(['cluster-dashboard', 'cluster-tools']);
  basicType([
    'cluster-dashboard',
    'projects-namespaces',
    'namespaces',
    NODE,
    VIRTUAL_TYPES.CLUSTER_MEMBERS,
  ], 'cluster');
  basicType([
    SERVICE,
    INGRESS,
    HPA,
    NETWORK_POLICY,
  ], 'serviceDiscovery');
  basicType([
    PV,
    PVC,
    STORAGE_CLASS,
    SECRET,
    CONFIG_MAP
  ], 'storage');
  basicType([
    WORKLOAD,
    WORKLOAD_TYPES.DEPLOYMENT,
    WORKLOAD_TYPES.DAEMON_SET,
    WORKLOAD_TYPES.STATEFUL_SET,
    WORKLOAD_TYPES.JOB,
    WORKLOAD_TYPES.CRON_JOB,
    POD,
  ], 'workload');

  weightGroup('cluster', 99, true);
  weightGroup('workload', 98, true);
  weightGroup('serviceDiscovery', 96, true);
  weightGroup('storage', 95, true);
  weightType(POD, -1, true);

  for (const key in WORKLOAD_TYPES) {
    componentForType(WORKLOAD_TYPES[key], WORKLOAD);
  }

  ignoreType('events.k8s.io.event'); // Old, moved into core
  ignoreType('extensions.ingress'); // Old, moved into networking
  ignoreType(MANAGEMENT.PROJECT);
  ignoreType(NAMESPACE);
  ignoreType(MANAGEMENT.CLUSTER_ROLE_TEMPLATE_BINDING);
  ignoreType(MANAGEMENT.PROJECT_ROLE_TEMPLATE_BINDING);

  mapGroup(/^(core)?$/, 'core');
  mapGroup('apps', 'apps');
  mapGroup('batch', 'Batch');
  mapGroup('autoscaling', 'Autoscaling');
  mapGroup('policy', 'Policy');
  mapGroup('networking.k8s.io', 'Networking');
  mapGroup(/^(.+\.)?api(server)?.*\.k8s\.io$/, 'API');
  mapGroup('rbac.authorization.k8s.io', 'RBAC');
  mapGroup('admissionregistration.k8s.io', 'admission');
  mapGroup('crd.projectcalico.org', 'Calico');
  mapGroup(/^(.+\.)?cert-manager\.(k8s\.)?io$/, 'Cert Manager');
  mapGroup(/^(.+\.)?(gateway|gloo)\.solo\.io$/, 'Gloo');
  mapGroup(/^(.*\.)?monitoring\.coreos\.com$/, 'Monitoring');
  mapGroup(/^(.*\.)?tekton\.dev$/, 'Tekton');
  mapGroup(/^(.*\.)?tigera\.io$/, 'Tigera');
  mapGroup(/^(.*\.)?longhorn(\.rancher)?\.io$/, 'Longhorn');
  mapGroup(/^(.*\.)?(fleet|gitjob)\.cattle\.io$/, 'Fleet');
  mapGroup(/^(.*\.)?(helm|k3s)\.cattle\.io$/, 'K3s');
  mapGroup(/^(.*\.)?upgrade\.cattle\.io$/, 'Upgrade Controller');
  mapGroup(/^(.*\.)?cis\.cattle\.io$/, 'CIS');
  mapGroup(/^(.*\.)?traefik\.containo\.us$/, 'Træfik');
  mapGroup(/^(catalog|management|project|ui)\.cattle\.io$/, 'Rancher');
  mapGroup(/^(.*\.)?istio\.io$/, 'Istio');
  mapGroup('split.smi-spec.io', 'SMI');
  mapGroup(/^(.*\.)*knative\.(io|dev)$/, 'Knative');
  mapGroup('argoproj.io', 'Argo');
  mapGroup('logging.banzaicloud.io', 'Logging');
  mapGroup(/^(.*\.)?resources\.cattle\.io$/, 'Backup-Restore');
  mapGroup(/^(.*\.)?cluster\.x-k8s\.io$/, 'clusterProvisioning');
  mapGroup(/^(aks|eks|gke|rke|rke-machine-config|provisioning)\.cattle\.io$/, 'clusterProvisioning');

  configureType(NODE, { isCreatable: false, isEditable: true });
  configureType(WORKLOAD_TYPES.JOB, { isEditable: false, match: WORKLOAD_TYPES.JOB });
  configureType(MANAGEMENT.CLUSTER_ROLE_TEMPLATE_BINDING, { isEditable: false });
  configureType(MANAGEMENT.PROJECT_ROLE_TEMPLATE_BINDING, { isEditable: false });
  configureType(MANAGEMENT.PROJECT, { displayName: store.getters['i18n/t']('namespace.project.label') });

  configureType(EVENT, { limit: 500 });

  // Allow Pods to be grouped by node
  configureType(POD, {
    listGroups: [
      {
        icon:       'icon-cluster',
        value:      'node',
        field:      'groupByNode',
        hideColumn: NODE_COL.name,
        tooltipKey: 'resourceTable.groupBy.node'
      }
    ]
  });

  setGroupDefaultType('serviceDiscovery', SERVICE);

  configureType('workload', {
    displayName: 'Workload',
    location:    {
      name:    'c-cluster-product-resource',
      params:  { resource: 'workload' },
    },
    resource: WORKLOAD_TYPES.DEPLOYMENT
  });

  headers(PV, [STATE, NAME_COL, RECLAIM_POLICY, PERSISTENT_VOLUME_CLAIM, PERSISTENT_VOLUME_SOURCE, PV_REASON, AGE]);
  headers(CONFIG_MAP, [NAME_COL, NAMESPACE_COL, KEYS, AGE]);
  headers(SECRET, [
    STATE,
    NAME_COL,
    NAMESPACE_COL,
    SUB_TYPE,
    {
      name:      'data',
      labelKey:  'tableHeaders.data',
      value:     'dataPreview',
      formatter: 'SecretData'
    },
    AGE
  ]);
  headers(INGRESS, [STATE, NAME_COL, NAMESPACE_COL, INGRESS_TARGET, INGRESS_DEFAULT_BACKEND, AGE]);
  headers(SERVICE, [STATE, NAME_COL, NAMESPACE_COL, TARGET_PORT, SELECTOR, SPEC_TYPE, AGE]);
  headers(HPA, [STATE, NAME_COL, HPA_REFERENCE, MIN_REPLICA, MAX_REPLICA, CURRENT_REPLICA, AGE]);

  headers(WORKLOAD, [STATE, NAME_COL, NAMESPACE_COL, TYPE, WORKLOAD_IMAGES, WORKLOAD_ENDPOINTS, AGE, WORKLOAD_HEALTH_SCALE]);
  headers(WORKLOAD_TYPES.DEPLOYMENT, [STATE, NAME_COL, NAMESPACE_COL, WORKLOAD_IMAGES, WORKLOAD_ENDPOINTS, 'Ready', 'Up-to-date', 'Available', AGE, WORKLOAD_HEALTH_SCALE]);
  headers(WORKLOAD_TYPES.DAEMON_SET, [STATE, NAME_COL, NAMESPACE_COL, WORKLOAD_IMAGES, WORKLOAD_ENDPOINTS, 'Ready', 'Current', 'Desired', AGE, WORKLOAD_HEALTH_SCALE]);
  headers(WORKLOAD_TYPES.REPLICA_SET, [STATE, NAME_COL, NAMESPACE_COL, WORKLOAD_IMAGES, WORKLOAD_ENDPOINTS, 'Ready', 'Current', 'Desired', AGE, WORKLOAD_HEALTH_SCALE]);
  headers(WORKLOAD_TYPES.STATEFUL_SET, [STATE, NAME_COL, NAMESPACE_COL, WORKLOAD_IMAGES, WORKLOAD_ENDPOINTS, 'Ready', AGE, WORKLOAD_HEALTH_SCALE]);
  headers(WORKLOAD_TYPES.JOB, [STATE, NAME_COL, NAMESPACE_COL, WORKLOAD_IMAGES, WORKLOAD_ENDPOINTS, 'Completions', 'Duration', AGE, WORKLOAD_HEALTH_SCALE]);
  headers(WORKLOAD_TYPES.CRON_JOB, [STATE, NAME_COL, NAMESPACE_COL, WORKLOAD_IMAGES, WORKLOAD_ENDPOINTS, 'Schedule', 'Last Schedule', AGE, WORKLOAD_HEALTH_SCALE]);
  headers(WORKLOAD_TYPES.REPLICATION_CONTROLLER, [STATE, NAME_COL, NAMESPACE_COL, WORKLOAD_IMAGES, WORKLOAD_ENDPOINTS, 'Ready', 'Current', 'Desired', AGE, WORKLOAD_HEALTH_SCALE]);
  headers(POD, [STATE, NAME_COL, NAMESPACE_COL, POD_IMAGES, 'Ready', 'Restarts', 'IP', NODE_COL, AGE]);
  headers(STORAGE_CLASS, [STATE, NAME_COL, STORAGE_CLASS_PROVISIONER, STORAGE_CLASS_DEFAULT, AGE]);

  headers(RBAC.ROLE, [
    STATE,
    NAME_COL,
    NAMESPACE_COL,
    AGE
  ]);

  headers(RBAC.CLUSTER_ROLE, [
    STATE,
    NAME_COL,
    AGE
  ]);

  headers(MANAGEMENT.USER, [
    STATE,
    USER_ID,
    USER_DISPLAY_NAME,
    USER_PROVIDER,
    USERNAME,
    AGE
  ]);

  headers(NORMAN.TOKEN, [
    EXPIRY_STATE,
    ACCESS_KEY,
    DESCRIPTION,
    SCOPE_NORMAN,
    EXPIRES,
    AGE_NORMAN
  ]);

  virtualType({
    label:       store.getters['i18n/t']('clusterIndexPage.header'),
    group:      'Root',
    namespaced:  false,
    name:        'cluster-dashboard',
    weight:      100,
    route:       { name: 'c-cluster-explorer' },
    exact:       true,
    overview:    true,
  });

  virtualType({
    label:       store.getters['i18n/t']('members.clusterMembers'),
    group:      'cluster',
    namespaced:  false,
    name:        VIRTUAL_TYPES.CLUSTER_MEMBERS,
    icon:       'globe',
    weight:      -1,
    route:       { name: 'c-cluster-product-members' },
    exact:       true,
    ifHaveType:  {
      type:   MANAGEMENT.CLUSTER_ROLE_TEMPLATE_BINDING,
      store: 'management'
    }
  });

  virtualType({
    label:          store.getters['i18n/t'](`typeLabel.${ WORKLOAD }`, { count: 2 }),
    group:          store.getters['i18n/t'](`typeLabel.${ WORKLOAD }`, { count: 2 }),
    namespaced:     true,
    name:           WORKLOAD,
    weight:         99,
    icon:           'folder',
    ifHaveSubTypes: Object.values(WORKLOAD_TYPES),
    route:          {
      name:     'c-cluster-product-resource',
      params:   { resource: WORKLOAD }
    },
    overview: true,
  });

  virtualType({
    label:            store.getters['i18n/t']('projectNamespaces.label'),
    group:            'cluster',
    icon:             'globe',
    namespaced:       false,
    ifRancherCluster: true,
    name:             VIRTUAL_TYPES.PROJECT_NAMESPACES,
    weight:           98,
    route:            { name: 'c-cluster-product-projectsnamespaces' },
    exact:            true,
  });

  virtualType({
    label:            store.getters['i18n/t'](`typeLabel.${ NAMESPACE }`, { count: 2 }),
    group:            'cluster',
    icon:             'globe',
    namespaced:       false,
    ifRancherCluster: false,
    name:             VIRTUAL_TYPES.NAMESPACES,
    weight:           98,
    route:            { name: 'c-cluster-product-namespaces' },
    exact:            true,
  });

  // Ignore these types as they are managed through the settings product
  ignoreType(MANAGEMENT.FEATURE);
  ignoreType(MANAGEMENT.SETTING);

  // Don't show Tokens/API Keys in the side navigation
  ignoreType(MANAGEMENT.TOKEN);
  ignoreType(NORMAN.TOKEN);

  // Ignore these types as they are managed through the auth product
  ignoreType(MANAGEMENT.USER);

  // Ignore these types as they are managed through the auth product
  ignoreType(MANAGEMENT.GLOBAL_ROLE);
  ignoreType(MANAGEMENT.ROLE_TEMPLATE);
}
