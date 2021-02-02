import {
  CONFIG_MAP,
  NAMESPACE, NODE, SECRET, INGRESS,
  WORKLOAD, WORKLOAD_TYPES, SERVICE, HPA, NETWORK_POLICY, PV, PVC, STORAGE_CLASS, POD,
  RBAC,
  MANAGEMENT,
} from '@/config/types';

import {
  STATE, NAME as NAME_COL, NAMESPACE as NAMESPACE_COL, AGE, KEYS,
  INGRESS_DEFAULT_BACKEND, INGRESS_TARGET, ROLES, VERSION, INTERNAL_EXTERNAL_IP, CPU, RAM,
  SPEC_TYPE, TARGET_PORT, SELECTOR, NODE as NODE_COL, TYPE, WORKLOAD_IMAGES, POD_IMAGES, USER_ID, USERNAME, USER_DISPLAY_NAME, USER_PROVIDER, WORKLOAD_ENDPOINTS, STORAGE_CLASS_PROVISIONER
} from '@/config/table-headers';

import { copyResourceValues, SUBTYPES } from '@/models/rbac.authorization.k8s.io.roletemplate';

import { DSL } from '@/store/type-map';

export const NAME = 'explorer';

export function init(store) {
  const {
    product,
    basicType,
    ignoreType,
    mapGroup,
    mapType,
    weightGroup,
    weightType,
    headers,
    virtualType,
    componentForType,
    configureType,
    spoofedType
  } = DSL(store, NAME);

  product({
    removable:           false,
    weight:              3,
    showNamespaceFilter: true,
    icon:                'compass'
  });

  basicType(['cluster-dashboard']);
  basicType([
    NAMESPACE,
    NODE,
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
  basicType([
    RBAC.ROLE,
    RBAC.ROLE_BINDING,
    RBAC.CLUSTER_ROLE_BINDING,
    RBAC.SPOOFED.ROLE_TEMPLATE
  ], 'rbac');

  weightGroup('cluster', 99, true);
  weightGroup('workload', 98, true);
  weightGroup('serviceDiscovery', 97, true);
  weightGroup('storage', 96, true);
  weightGroup('rbac', 95, true);
  weightType(POD, -1, true);

  for (const key in WORKLOAD_TYPES) {
    componentForType(WORKLOAD_TYPES[key], WORKLOAD);
  }

  ignoreType('events.k8s.io.event'); // Old, moved into core
  ignoreType('extensions.ingress'); // Old, moved into networking

  mapGroup(/^(core)?$/, 'Core');
  mapGroup('apps', 'Apps');
  mapGroup('batch', 'Batch');
  mapGroup('autoscaling', 'Autoscaling');
  mapGroup('policy', 'Policy');
  mapGroup('networking.k8s.io', 'Networking');
  mapGroup(/^api.*\.k8s\.io$/, 'API');
  mapGroup('rbac.authorization.k8s.io', 'RBAC');
  mapGroup('admissionregistration.k8s.io', 'Admission');
  mapGroup('crd.projectcalico.org', 'Calico');
  mapGroup(/^(.+\.)?cert-manager\.(k8s\.)?io$/, 'Cert Manager');
  mapGroup(/^(.+\.)?(gateway|gloo)\.solo\.io$/, 'Gloo');
  mapGroup(/^(.*\.)?monitoring\.coreos\.com$/, 'Monitoring');
  mapGroup(/^(.*\.)?tekton\.dev$/, 'Tekton');
  mapGroup(/^(.*\.)?longhorn(\.rancher)?\.io$/, 'Longhorn');
  mapGroup(/^(.*\.)?(fleet|gitjob)\.cattle\.io$/, 'Fleet');
  mapGroup(/^(.*\.)?(helm|upgrade|k3s)\.cattle\.io$/, 'k3s');
  mapGroup(/^(.*\.)?cis\.cattle\.io$/, 'CIS');
  mapGroup(/^(catalog|project|management)\.cattle\.io$/, 'Rancher');
  mapGroup(/^(.*\.)?istio\.io$/, 'Istio');
  mapGroup('split.smi-spec.io', 'SMI');
  mapGroup(/^(.*\.)*knative\.(io|dev)$/, 'Knative');
  mapGroup('argoproj.io', 'Argo');
  mapGroup('logging.banzaicloud.io', 'Logging');
  mapGroup(/.*resources\.cattle\.io.*/, 'Backup-Restore');

  configureType(NODE, { isCreatable: false, isEditable: false });
  configureType(WORKLOAD_TYPES.JOB, { isEditable: false, match: WORKLOAD_TYPES.JOB });

  configureType('workload', {
    displayName: 'Workload',
    location:    {
      name:    'c-cluster-product-resource',
      params:  { resource: 'workload' },
    },
    resource: WORKLOAD_TYPES.DEPLOYMENT
  });

  headers(CONFIG_MAP, [NAME_COL, NAMESPACE_COL, KEYS, AGE]);
  headers(SECRET, [
    STATE,
    NAME_COL,
    NAMESPACE_COL,
    {
      name:      'type',
      label:     'Type',
      value:     'typeDisplay',
      sort:      ['typeDisplay', 'nameSort'],
      width:     120,
    },
    {
      name:      'data',
      label:     'Data',
      value:     'dataPreview',
      formatter: 'SecretData'
    },
    AGE
  ]);
  headers(INGRESS, [STATE, NAME_COL, NAMESPACE_COL, INGRESS_TARGET, INGRESS_DEFAULT_BACKEND, AGE]);
  headers(NODE, [STATE, NAME_COL, ROLES, VERSION, INTERNAL_EXTERNAL_IP, CPU, RAM, AGE]);
  headers(SERVICE, [STATE, NAME_COL, NAMESPACE_COL, SPEC_TYPE, TARGET_PORT, SELECTOR, AGE]);

  headers(WORKLOAD, [STATE, NAME_COL, NAMESPACE_COL, WORKLOAD_IMAGES, WORKLOAD_ENDPOINTS, TYPE, 'Ready', AGE]);
  headers(WORKLOAD_TYPES.DEPLOYMENT, [STATE, NAME_COL, NAMESPACE_COL, WORKLOAD_IMAGES, WORKLOAD_ENDPOINTS, 'Ready', 'Up-to-date', 'Available', AGE]);
  headers(WORKLOAD_TYPES.DAEMON_SET, [STATE, NAME_COL, NAMESPACE_COL, WORKLOAD_IMAGES, WORKLOAD_ENDPOINTS, 'Ready', 'Current', 'Desired', AGE]);
  headers(WORKLOAD_TYPES.REPLICA_SET, [STATE, NAME_COL, NAMESPACE_COL, WORKLOAD_IMAGES, WORKLOAD_ENDPOINTS, 'Ready', 'Current', 'Desired', AGE]);
  headers(WORKLOAD_TYPES.STATEFUL_SET, [STATE, NAME_COL, NAMESPACE_COL, WORKLOAD_IMAGES, WORKLOAD_ENDPOINTS, 'Ready', AGE]);
  headers(WORKLOAD_TYPES.JOB, [STATE, NAME_COL, NAMESPACE_COL, WORKLOAD_IMAGES, WORKLOAD_ENDPOINTS, 'Completions', 'Duration', AGE]);
  headers(WORKLOAD_TYPES.CRON_JOB, [STATE, NAME_COL, NAMESPACE_COL, WORKLOAD_IMAGES, WORKLOAD_ENDPOINTS, 'Schedule', 'Last Schedule', AGE]);
  headers(WORKLOAD_TYPES.REPLICATION_CONTROLLER, [STATE, NAME_COL, NAMESPACE_COL, WORKLOAD_IMAGES, WORKLOAD_ENDPOINTS, 'Ready', 'Current', 'Desired', AGE]);
  headers(POD, [STATE, NAME_COL, NAMESPACE_COL, POD_IMAGES, 'Ready', 'Restarts', 'IP', NODE_COL, AGE]);
  headers(STORAGE_CLASS, [STATE, NAME_COL, STORAGE_CLASS_PROVISIONER, AGE]);

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

  virtualType({
    label:       'Cluster Dashboard',
    group:      'Root',
    namespaced:  false,
    name:        'cluster-dashboard',
    weight:      100,
    route:       { name: 'c-cluster-explorer' },
    exact:       true,
  });

  virtualType({
    label:          'Overview',
    group:          'Workload',
    namespaced:     true,
    name:           'workload',
    weight:         99,
    icon:           'folder',
    ifHaveSubTypes: Object.values(WORKLOAD_TYPES),
    route:          {
      name:     'c-cluster-product-resource',
      params:   { resource: WORKLOAD }
    },
  });

  spoofedType({
    label:             'Role Template',
    type:              RBAC.SPOOFED.ROLE_TEMPLATE,
    collectionMethods: ['POST'],
    schemas:           [
      {
        id:                RBAC.SPOOFED.ROLE_TEMPLATE,
        type:              'schema',
        resourceFields:    { filters: { type: 'string' } },
        collectionMethods: ['POST'],
      }
    ],
    getInstances: async() => {
      const allPrmises = SUBTYPES.map(type => store.dispatch('cluster/findAll', { type } ));
      const all = await Promise.all(allPrmises);

      return all
        .flat()
        .map((template) => {
          const instance = {
            id:              template.id,
            kind:            template.kind,
            type:            RBAC.SPOOFED.ROLE_TEMPLATE,
            status:          template.status,
            links:           {
              self: template.links.self,
              view: template.links.view
            },
            template
          };

          copyResourceValues(template, instance);

          return instance;
        });
    }
  });

  mapType(RBAC.SPOOFED.ROLE_TEMPLATE, 'Role Template');
}
