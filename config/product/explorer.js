import {
  CONFIG_MAP,
  NAMESPACE, NODE, SECRET, INGRESS,
  WORKLOAD, WORKLOAD_TYPES, SERVICE, HPA, NETWORK_POLICY, PV, PVC, STORAGE_CLASS, POD
} from '@/config/types';

import {
  STATE, NAME as NAME_COL, NAMESPACE_NAME, AGE, KEYS,
  INGRESS_TARGET, ROLES, VERSION, INTERNAL_EXTERNAL_IP, CPU, RAM
} from '@/config/table-headers';

import { DSL } from '@/store/type-map';

export const NAME = 'explorer';

export function init(store) {
  const {
    alwaysProduct,
    basicType,
    ignoreType,
    mapType,
    mapGroup,
    weightGroup,
    moveType,
    headers,
    virtualType,
    componentForType,
    uncreatableType,
    immutableType
  } = DSL(store, NAME);

  alwaysProduct();

  basicType([
    'cluster-overview',

    NAMESPACE,
    NODE,

    SERVICE,
    INGRESS,
    HPA,
    NETWORK_POLICY,

    PV,
    PVC,
    STORAGE_CLASS,

    WORKLOAD,
    WORKLOAD_TYPES.DEPLOYMENT,
    WORKLOAD_TYPES.STATEFUL_SET,
    WORKLOAD_TYPES.JOB,
    POD,
  ]);

  // Move some core things into Cluster
  moveType(NAMESPACE, 'Cluster');
  moveType(NODE, 'Cluster');

  moveType(SERVICE, 'Service Discovery');
  moveType(INGRESS, 'Service Discovery');
  moveType(HPA, 'Service Discovery');
  moveType(NETWORK_POLICY, 'Service Discovery');

  moveType(PV, 'Storage');
  moveType(PVC, 'Storage');
  moveType(STORAGE_CLASS, 'Storage');

  moveType(WORKLOAD_TYPES.DEPLOYMENT, 'Workload');
  moveType(WORKLOAD_TYPES.STATEFUL_SET, 'Workload');
  moveType(WORKLOAD_TYPES.JOB, 'Workload');
  moveType(POD, 'Workload');

  for (const key in WORKLOAD_TYPES) {
    componentForType(WORKLOAD_TYPES[key], WORKLOAD);
  }

  ignoreType('events.k8s.io.event'); // Old, moved into core
  ignoreType('extensions.ingress'); // Old, moved into networking

  mapType('endpoints', 'Endpoint'); // Bad plural

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
  mapGroup(/^(gateway|gloo)\.solo\.io$/, 'Gloo');
  mapGroup(/^(.*\.)?monitoring\.coreos\.com$/, 'Monitoring');
  mapGroup(/^(.*\.)?tekton\.dev$/, 'Tekton');
  mapGroup(/^(.*\.)?longhorn(\.rancher)?\.io$/, 'Longhorn');
  mapGroup(/^(.*\.)?fleet\.cattle\.io$/, 'Fleet');
  mapGroup(/^(.*\.)?(helm|upgrade|k3s)\.cattle\.io$/, 'k3s');
  mapGroup(/^(project|management)\.cattle\.io$/, 'Rancher');
  mapGroup(/^(.*\.)?istio\.io$/, 'Istio');
  mapGroup('split.smi-spec.io', 'SMI');
  mapGroup(/^(.*\.)?knative\.io$/, 'Knative');
  mapGroup('argoproj.io', 'Argo');

  uncreatableType(NODE);
  immutableType(NODE);

  headers(CONFIG_MAP, [NAMESPACE_NAME, KEYS, AGE]);
  headers(SECRET, [
    STATE,
    NAMESPACE_NAME,
    {
      name:      'type',
      label:     'Type',
      value:     'tableTypeDisplay',
      sort:      ['typeDisplay', 'nameSort'],
      width:     100,
      formatter: 'SecretType'
    },
    {
      name:      'data',
      label:     'Data',
      value:     'dataPreview',
      formatter: 'SecretData'
    },
    AGE
  ]);
  headers(INGRESS, [STATE, NAMESPACE_NAME, INGRESS_TARGET, AGE]);
  headers(NODE, [STATE, NAME_COL, ROLES, VERSION, INTERNAL_EXTERNAL_IP, CPU, RAM]);

  // These look to be for [Cluster]RoleTemplate, not [Cluster]Role.
  // headers(RBAC.ROLE, [
  //   STATE,
  //   NAME_COL,
  //   BUILT_IN,
  //   AGE
  // ]);

  // headers(RBAC.CLUSTER_ROLE, [
  //   STATE,
  //   NAME_COL,
  //   BUILT_IN,
  //   CLUSTER_CREATOR_DEFAULT,
  //   AGE
  // ]);

  weightGroup('Root', 100);

  virtualType({
    label:       'Overview',
    group:      'Root',
    namespaced:  false,
    name:        'cluster-overview',
    weight:      100,
    route:       { name: 'c-cluster' },
    exact:       true,
  });

  virtualType({
    label:      'Overview',
    group:      'Workload',
    namespaced: true,
    name:       'workload',
    weight:     99,
    route:      {
      name:     'c-cluster-product-resource',
      params:   { resource: WORKLOAD }
    },
  });
}
