import {
  CATALOG,
  CONFIG_MAP,
  EVENT,
  NODE, SECRET, INGRESS,
  WORKLOAD, WORKLOAD_TYPES, SERVICE, HPA, NETWORK_POLICY, PV, PVC, STORAGE_CLASS, POD, POD_DISRUPTION_BUDGET, LIMIT_RANGE, RESOURCE_QUOTA,
  MANAGEMENT,
  NAMESPACE,
  NORMAN,
  SNAPSHOT,
  VIRTUAL_TYPES,
  CAPI,
} from '@shell/config/types';

import {
  STATE, USER_STATE, NAME as NAME_COL, NAMESPACE as NAMESPACE_COL, AGE, KEYS,
  INGRESS_DEFAULT_BACKEND, INGRESS_TARGET, INGRESS_CLASS,
  SPEC_TYPE, TARGET_PORT, SELECTOR, NODE as NODE_COL, TYPE, WORKLOAD_IMAGES, POD_IMAGES,
  USER_ID, USERNAME, USER_DISPLAY_NAME, USER_PROVIDER, USER_LAST_LOGIN, USER_DISABLED_IN, USER_DELETED_IN, WORKLOAD_ENDPOINTS, STORAGE_CLASS_DEFAULT,
  STORAGE_CLASS_PROVISIONER, PERSISTENT_VOLUME_SOURCE,
  HPA_REFERENCE, MIN_REPLICA, MAX_REPLICA, CURRENT_REPLICA,
  ACCESS_KEY, DESCRIPTION, EXPIRES, EXPIRY_STATE, LAST_USED, SUB_TYPE, AGE_NORMAN, SCOPE_NORMAN, PERSISTENT_VOLUME_CLAIM, RECLAIM_POLICY, PV_REASON, WORKLOAD_HEALTH_SCALE, POD_RESTARTS,
  DURATION, MESSAGE, REASON, EVENT_TYPE, OBJECT, ROLE, ROLES, VERSION, INTERNAL_EXTERNAL_IP, KUBE_NODE_OS, CPU, RAM, SECRET_DATA,
  EVENT_LAST_SEEN_TIME
} from '@shell/config/table-headers';

import { DSL } from '@shell/store/type-map';
import {
  STEVE_AGE_COL, STEVE_EVENT_LAST_SEEN, STEVE_EVENT_OBJECT, STEVE_EVENT_TYPE, STEVE_LIST_GROUPS, STEVE_NAMESPACE_COL, STEVE_NAME_COL, STEVE_STATE_COL
} from '@shell/config/pagination-table-headers';

import { COLUMN_BREAKPOINTS } from '@shell/types/store/type-map';
import { STEVE_CACHE } from '@shell/store/features';
import { configureConditionalDepaginate } from '@shell/store/type-map.utils';
import { CATTLE_PUBLIC_ENDPOINTS } from '@shell/config/labels-annotations';

export const NAME = 'explorer';

export function init(store) {
  const {
    product,
    basicType,
    ignoreType,
    ignoreGroup,
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
      [MANAGEMENT.PROJECT_ROLE_TEMPLATE_BINDING]: 'management',
      [NORMAN.CLUSTER_ROLE_TEMPLATE_BINDING]:     'rancher',
      [NORMAN.PROJECT_ROLE_TEMPLATE_BINDING]:     'rancher',
      [CAPI.RANCHER_CLUSTER]:                     'management',
    }
  });

  basicType(['cluster-dashboard', 'cluster-tools']);
  basicType([
    'cluster-dashboard',
    'projects-namespaces',
    'namespaces',
    NODE,
    VIRTUAL_TYPES.CLUSTER_MEMBERS,
    EVENT,
    'c-cluster-explorer-tools'
  ], 'cluster');
  basicType([
    LIMIT_RANGE,
    NETWORK_POLICY,
    POD_DISRUPTION_BUDGET,
    RESOURCE_QUOTA,
  ], 'policy');

  basicType([
    SERVICE,
    INGRESS,
    HPA,
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
  weightGroup('policy', 94, true);
  weightType(POD, -1, true);

  // here is where we define the usage of the WORKLOAD custom list view for
  // all the workload types (ex: deployments, cron jobs, daemonsets, etc)
  for (const key in WORKLOAD_TYPES) {
    componentForType(WORKLOAD_TYPES[key], WORKLOAD);
  }

  ignoreType(MANAGEMENT.GLOBAL_DNS_PROVIDER); // Old, managed in multi-cluster-apps
  ignoreType('events.k8s.io.event'); // Old, moved into core
  ignoreType('extensions.ingress'); // Old, moved into networking
  ignoreType(MANAGEMENT.PROJECT);
  ignoreType(NAMESPACE);
  ignoreType(MANAGEMENT.CLUSTER_ROLE_TEMPLATE_BINDING);
  ignoreType(MANAGEMENT.PROJECT_ROLE_TEMPLATE_BINDING);

  ignoreGroup('harvesterhci.io', (getters) => {
    return getters['currentCluster']?.isHarvester && getters['isExplorer'];
  });
  ignoreGroup('kubevirt.io', (getters) => {
    return getters['currentCluster']?.isHarvester && getters['isExplorer'];
  });
  ignoreGroup('network.harvesterhci.io', (getters) => {
    return getters['currentCluster']?.isHarvester && getters['isExplorer'];
  });
  ignoreGroup('node.harvesterhci.io', (getters) => {
    return getters['currentCluster']?.isHarvester && getters['isExplorer'];
  });

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
  mapGroup(/^(.*\.)?(k3s)\.cattle\.io$/, 'K3s');
  mapGroup(/^(.*\.)?(helm)\.cattle\.io$/, 'Helm');
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
  mapGroup(/^(aks|eks|gke|rke|rke-machine-config|rke-machine|provisioning)\.cattle\.io$/, 'clusterProvisioning');

  const dePaginateBindings = configureConditionalDepaginate({ maxResourceCount: 5000 });
  const dePaginateNormanBindings = configureConditionalDepaginate({ maxResourceCount: 5000, isNorman: true }) ;

  configureType(NODE, { isCreatable: false, isEditable: true });
  configureType(WORKLOAD_TYPES.JOB, { isEditable: false, match: WORKLOAD_TYPES.JOB });
  configureType(MANAGEMENT.CLUSTER_ROLE_TEMPLATE_BINDING, { isEditable: false, depaginate: dePaginateBindings });
  configureType(MANAGEMENT.PROJECT_ROLE_TEMPLATE_BINDING, { isEditable: false, depaginate: dePaginateBindings });
  configureType(MANAGEMENT.PROJECT, { displayName: store.getters['i18n/t']('namespace.project.label') });
  configureType(NORMAN.CLUSTER_ROLE_TEMPLATE_BINDING, { depaginate: dePaginateNormanBindings });
  configureType(NORMAN.PROJECT_ROLE_TEMPLATE_BINDING, { depaginate: dePaginateNormanBindings });
  configureType(SNAPSHOT, { depaginate: true });
  configureType(NORMAN.ETCD_BACKUP, { depaginate: true });

  configureType(EVENT, { limit: 500 });
  weightType(EVENT, -1, true);

  configureType(POD, {
    listGroups: [
      ...STEVE_LIST_GROUPS,
      // Allow Pods to be grouped by node
      {
        icon:          'icon-cluster',
        value:         'role',
        field:         'spec.nodeName',
        hideColumn:    NODE_COL.name,
        groupLabelKey: 'groupByNode',
        tooltipKey:    'resourceTable.groupBy.node'
      }
    ],
    listGroupsWillOverride: true,
  });

  setGroupDefaultType('serviceDiscovery', SERVICE);

  configureType(WORKLOAD, {
    displayName: store.getters['i18n/t'](`typeLabel.${ WORKLOAD }`, { count: 1 }).trim(),
    location:    {
      name:   'c-cluster-product-resource',
      params: { resource: WORKLOAD },
    },
  });

  /** This CRD is installed on provisioned clusters because rancher webhook, used for both local and provisioned clusters, expects it to be there
   * Creating instances of this resource on downstream clusters wont do anything - Only show them for the local cluster
   */
  configureType(MANAGEMENT.PSA, { localOnly: true });

  headers(PV,
    [STATE, NAME_COL, RECLAIM_POLICY, PERSISTENT_VOLUME_CLAIM, PERSISTENT_VOLUME_SOURCE, PV_REASON, AGE],
    [
      STEVE_STATE_COL,
      STEVE_NAME_COL,
      RECLAIM_POLICY,
      {
        ...PERSISTENT_VOLUME_CLAIM,
        sort:   ['metadata.fields.5'],
        search: ['metadata.fields.5'],
      }, {
        ...PERSISTENT_VOLUME_SOURCE,
        sort:   false,
        search: false,
      },
      PV_REASON,
      STEVE_AGE_COL,
    ]
  );

  headers(CONFIG_MAP,
    [NAME_COL, NAMESPACE_COL, KEYS, AGE],
    [
      STEVE_NAME_COL,
      STEVE_NAMESPACE_COL, {
        ...KEYS,
        sort:   false,
        search: false,
      },
      STEVE_AGE_COL
    ]
  );

  headers(SECRET, [
    STATE,
    NAME_COL,
    NAMESPACE_COL,
    SUB_TYPE,
    SECRET_DATA,
    AGE
  ], [
    STEVE_STATE_COL,
    STEVE_NAME_COL,
    STEVE_NAMESPACE_COL, {
      ...SUB_TYPE,
      value:  'metadata.fields.1',
      sort:   'metadata.fields.1',
      search: 'metadata.fields.1',
    }, {
      ...SECRET_DATA,
      sort:   false,
      search: false,
    },
    STEVE_AGE_COL
  ]);

  headers(INGRESS,
    [STATE, NAME_COL, NAMESPACE_COL, INGRESS_TARGET, INGRESS_DEFAULT_BACKEND, INGRESS_CLASS, AGE],
    [
      STEVE_STATE_COL,
      STEVE_NAME_COL,
      STEVE_NAMESPACE_COL,
      {
        ...INGRESS_TARGET,
        sort:   'spec.rules[0].host', // Pending API support https://github.com/rancher/rancher/issues/48473 (index fields)
        search: false, // This is broken in normal world, so disable here
      },
      {
        ...INGRESS_DEFAULT_BACKEND,
        sort:   false,
        search: false,
      },
      {
        ...INGRESS_CLASS,
        sort:   'spec.ingressClassName',
        search: 'spec.ingressClassName', // Pending API support  (blocked https://github.com/rancher/rancher/issues/48473 (index fields)
      },
      STEVE_AGE_COL
    ]
  );

  headers(SERVICE,
    [STATE, NAME_COL, NAMESPACE_COL, TARGET_PORT, SELECTOR, SPEC_TYPE, AGE],
    [
      STEVE_STATE_COL,
      STEVE_NAME_COL,
      STEVE_NAMESPACE_COL,
      TARGET_PORT,
      {
        // Selector is an object. This is broken in non-SSP world anyway (won't sort on object, filtering on `$[x][y]` paths are broken )
        ...SELECTOR,
        sort:   false,
        search: false,
      },
      {
        ...SPEC_TYPE,
        sort:   false, // ['spec.type', 'spec.clusterIP'] Pending API support  (blocked https://github.com/rancher/rancher/issues/48473 (index fields)
        search: 'spec.type',
      },
      STEVE_AGE_COL
    ]
  );

  headers(EVENT,
    [STATE, EVENT_LAST_SEEN_TIME, EVENT_TYPE, REASON, OBJECT, 'Subobject', 'Source', MESSAGE, 'First Seen', 'Count', NAME_COL, NAMESPACE_COL],
    [
      STEVE_STATE_COL,
      STEVE_EVENT_LAST_SEEN,
      STEVE_EVENT_TYPE,
      REASON,
      STEVE_EVENT_OBJECT,
      'Subobject',
      'Source',
      MESSAGE,
      'First Seen',
      'Count',
      STEVE_NAME_COL,
      STEVE_NAMESPACE_COL,
    ]
  );
  headers(HPA,
    [STATE, NAME_COL, NAMESPACE_COL, HPA_REFERENCE, MIN_REPLICA, MAX_REPLICA, CURRENT_REPLICA, AGE],
    [
      STEVE_STATE_COL,
      STEVE_NAME_COL,
      STEVE_NAMESPACE_COL,
      HPA_REFERENCE, // Pending API support https://github.com/rancher/rancher/issues/48479 (hpa filtering)
      MIN_REPLICA, // Pending API support https://github.com/rancher/rancher/issues/48479 (hpa filtering)
      MAX_REPLICA, // Pending API support https://github.com/rancher/rancher/issues/48479 (hpa filtering)
      CURRENT_REPLICA, // Pending API support https://github.com/rancher/rancher/issues/48479 (hpa filtering)
      STEVE_AGE_COL
    ]
  );

  const STEVE_WORKLOAD_ENDPOINTS = {
    ...WORKLOAD_ENDPOINTS,
    sort:   [`metadata.annotations[${ CATTLE_PUBLIC_ENDPOINTS }]`],
    search: [`metadata.annotations[${ CATTLE_PUBLIC_ENDPOINTS }]`],
  };

  const createSteveWorkloadImageCol = (resourceFieldPos) => ({
    ...WORKLOAD_IMAGES,
    sort:   `metadata.fields.${ resourceFieldPos }`,
    search: `metadata.fields.${ resourceFieldPos }`,
  });

  headers(WORKLOAD, [STATE, NAME_COL, NAMESPACE_COL, TYPE, WORKLOAD_IMAGES, WORKLOAD_ENDPOINTS, POD_RESTARTS, AGE, WORKLOAD_HEALTH_SCALE]);
  headers(WORKLOAD_TYPES.DEPLOYMENT,
    [STATE, NAME_COL, NAMESPACE_COL, WORKLOAD_IMAGES, WORKLOAD_ENDPOINTS, 'Ready', 'Up-to-date', 'Available', POD_RESTARTS, AGE, WORKLOAD_HEALTH_SCALE],
    [STEVE_STATE_COL, STEVE_NAME_COL, STEVE_NAMESPACE_COL, createSteveWorkloadImageCol(6), STEVE_WORKLOAD_ENDPOINTS, 'Ready', 'Up-to-date', 'Available', STEVE_AGE_COL],
  );
  headers(WORKLOAD_TYPES.DAEMON_SET,
    [STATE, NAME_COL, NAMESPACE_COL, WORKLOAD_IMAGES, WORKLOAD_ENDPOINTS, 'Ready', 'Current', 'Desired', POD_RESTARTS, AGE, WORKLOAD_HEALTH_SCALE],
    [STEVE_STATE_COL, STEVE_NAME_COL, STEVE_NAMESPACE_COL, createSteveWorkloadImageCol(9), STEVE_WORKLOAD_ENDPOINTS, 'Ready', 'Current', 'Desired', STEVE_AGE_COL]
  );
  headers(WORKLOAD_TYPES.REPLICA_SET,
    [STATE, NAME_COL, NAMESPACE_COL, WORKLOAD_IMAGES, WORKLOAD_ENDPOINTS, 'Ready', 'Current', 'Desired', POD_RESTARTS, AGE, WORKLOAD_HEALTH_SCALE],
    [STEVE_STATE_COL, STEVE_NAME_COL, STEVE_NAMESPACE_COL, createSteveWorkloadImageCol(6), STEVE_WORKLOAD_ENDPOINTS, 'Ready', 'Current', 'Desired', STEVE_AGE_COL],
  );
  headers(WORKLOAD_TYPES.STATEFUL_SET,
    [STATE, NAME_COL, NAMESPACE_COL, WORKLOAD_IMAGES, WORKLOAD_ENDPOINTS, 'Ready', POD_RESTARTS, AGE, WORKLOAD_HEALTH_SCALE],
    [STEVE_STATE_COL, STEVE_NAME_COL, STEVE_NAMESPACE_COL, createSteveWorkloadImageCol(4), STEVE_WORKLOAD_ENDPOINTS, 'Ready', STEVE_AGE_COL],
  );
  headers(WORKLOAD_TYPES.JOB,
    [STATE, NAME_COL, NAMESPACE_COL, WORKLOAD_IMAGES, WORKLOAD_ENDPOINTS, 'Completions', DURATION, POD_RESTARTS, AGE, WORKLOAD_HEALTH_SCALE],
    [STEVE_STATE_COL, STEVE_NAME_COL, STEVE_NAMESPACE_COL, createSteveWorkloadImageCol(6), STEVE_WORKLOAD_ENDPOINTS, 'Completions', {
      ...DURATION,
      value:     'metadata.fields.3',
      sort:      false,
      search:    'metadata.fields.3',
      formatter: undefined, // Now that sort/search is remote we're not doing weird things with start time (see `duration` in model)
    }, STEVE_AGE_COL],
  );
  headers(WORKLOAD_TYPES.CRON_JOB,
    [STATE, NAME_COL, NAMESPACE_COL, WORKLOAD_IMAGES, WORKLOAD_ENDPOINTS, 'Schedule', 'Last Schedule', POD_RESTARTS, AGE, WORKLOAD_HEALTH_SCALE],
    [STEVE_STATE_COL, STEVE_NAME_COL, STEVE_NAMESPACE_COL, createSteveWorkloadImageCol(8), STEVE_WORKLOAD_ENDPOINTS, 'Schedule', 'Last Schedule', STEVE_AGE_COL]
  );
  headers(WORKLOAD_TYPES.REPLICATION_CONTROLLER,
    [STATE, NAME_COL, NAMESPACE_COL, WORKLOAD_IMAGES, WORKLOAD_ENDPOINTS, 'Ready', 'Current', 'Desired', POD_RESTARTS, AGE, WORKLOAD_HEALTH_SCALE],
    [STEVE_STATE_COL, STEVE_NAME_COL, STEVE_NAMESPACE_COL, createSteveWorkloadImageCol(6), STEVE_WORKLOAD_ENDPOINTS, 'Ready', 'Current', 'Desired', STEVE_AGE_COL],
  );

  headers(POD,
    [STATE, NAME_COL, NAMESPACE_COL, POD_IMAGES, 'Ready', 'Restarts', 'IP', NODE_COL, AGE],
    [
      STEVE_STATE_COL,
      STEVE_NAME_COL,
      STEVE_NAMESPACE_COL, {
        ...POD_IMAGES,
        sort:   false,
        search: 'spec.containers.image'
      }, 'Ready', 'Restarts', 'IP', {
        ...NODE_COL,
        search: 'spec.nodeName'
      },
      STEVE_AGE_COL
    ]
  );

  headers(NODE,
    [
      STATE,
      NAME_COL,
      ROLES,
      VERSION,
      INTERNAL_EXTERNAL_IP,
      {
        ...KUBE_NODE_OS,
        breakpoint: COLUMN_BREAKPOINTS.LAPTOP,
        getValue:   (row) => row.status?.nodeInfo?.operatingSystem
      },
      {
        ...CPU,
        breakpoint: COLUMN_BREAKPOINTS.LAPTOP,
        getValue:   (row) => row.cpuUsagePercentage
      }, {
        ...RAM,
        breakpoint: COLUMN_BREAKPOINTS.LAPTOP,
        getValue:   (row) => row.ramUsagePercentage
      },
      AGE
    ],
    [
      STEVE_STATE_COL,
      STEVE_NAME_COL,
      {
        ...ROLES,
        sort:   false,
        search: false
      },
      {
        ...VERSION,
        value:    'status.nodeInfo.kubeletVersion',
        getValue: undefined,
        sort:     ['status.nodeInfo.kubeletVersion'],
        search:   'status.nodeInfo.kubeletVersion'
      }, {
        ...INTERNAL_EXTERNAL_IP,
        sort:   false,
        search: false,
      }, {
        ...KUBE_NODE_OS,
        breakpoint: COLUMN_BREAKPOINTS.LAPTOP,
        getValue:   undefined
      }, {
        ...CPU,
        breakpoint: COLUMN_BREAKPOINTS.LAPTOP,
        getValue:   (row) => row.cpuUsagePercentage,
        sort:       false,
        search:     false,
      }, {
        ...RAM,
        breakpoint: COLUMN_BREAKPOINTS.LAPTOP,
        sort:       false,
        search:     false,
      },
      STEVE_AGE_COL
    ]
  );

  headers(MANAGEMENT.PSA, [STATE, NAME_COL, {
    ...DESCRIPTION,
    width: undefined
  }, AGE]);

  headers(STORAGE_CLASS,
    [STATE, NAME_COL, STORAGE_CLASS_PROVISIONER, STORAGE_CLASS_DEFAULT, AGE],
    [
      STEVE_STATE_COL,
      STEVE_NAME_COL,
      {
        ...STORAGE_CLASS_PROVISIONER,
        sort:   ['provisioner'],
        search: ['provisioner']
      },
      {
        ...STORAGE_CLASS_DEFAULT,
        sort:   false, // [`metadata.annotations[${ STORAGE.DEFAULT_STORAGE_CLASS }]`], // Pending API Support - https://github.com/rancher/rancher/issues/48453
        search: false, // [`metadata.annotations[${ STORAGE.DEFAULT_STORAGE_CLASS }]`], // Pending API Support - https://github.com/rancher/rancher/issues/48453
      },
      STEVE_AGE_COL
    ]
  );

  configureType(MANAGEMENT.CLUSTER_ROLE_TEMPLATE_BINDING, {
    listGroups: [
      {
        icon:       'icon-role-binding',
        value:      'node',
        field:      'roleDisplay',
        hideColumn: ROLE.name,
        tooltipKey: 'resourceTable.groupBy.role'
      }
    ]
  });

  headers(MANAGEMENT.USER, [
    USER_STATE,
    USER_ID,
    USER_DISPLAY_NAME,
    USER_PROVIDER,
    USERNAME,
    USER_LAST_LOGIN,
    USER_DISABLED_IN,
    USER_DELETED_IN,
    AGE
  ]);

  headers(NORMAN.TOKEN, [
    EXPIRY_STATE,
    ACCESS_KEY,
    DESCRIPTION,
    SCOPE_NORMAN,
    LAST_USED,
    EXPIRES,
    AGE_NORMAN
  ]);

  virtualType({
    label:      store.getters['i18n/t']('clusterIndexPage.header'),
    group:      'Root',
    namespaced: false,
    name:       'cluster-dashboard',
    weight:     100,
    route:      { name: 'c-cluster-explorer' },
    exact:      true,
    overview:   true,
  });

  virtualType({
    labelKey:     'members.clusterAndProject',
    group:        'cluster',
    namespaced:   false,
    name:         VIRTUAL_TYPES.CLUSTER_MEMBERS,
    icon:         'globe',
    weight:       -1,
    route:        { name: 'c-cluster-product-members' },
    exact:        false,
    'exact-path': true,
    ifHaveType:   {
      type:  MANAGEMENT.CLUSTER_ROLE_TEMPLATE_BINDING,
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
    // Workloads fetch ALL resources of ALL resource types... which scales badly. Until this is replaced by an overview page disable entirely
    ifFeature:      `!${ STEVE_CACHE }`,
    ifHaveSubTypes: Object.values(WORKLOAD_TYPES),
    route:          {
      name:   'c-cluster-product-resource',
      params: { resource: WORKLOAD }
    },
    overview: true,
  });

  virtualType({
    labelKey:         'projectNamespaces.label',
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
    labelKey:   'nav.tools',
    group:      'cluster',
    icon:       'globe',
    namespaced: false,
    name:       'c-cluster-explorer-tools',
    weight:     -2,
    route:      { name: 'c-cluster-explorer-tools' },
    exact:      true,
    ifHaveType: [CATALOG.CLUSTER_REPO, CATALOG.APP],
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
  ignoreType(MANAGEMENT.GLOBAL_ROLE);
  ignoreType(MANAGEMENT.ROLE_TEMPLATE);
}
