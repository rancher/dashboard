import {
  CONFIG_MAP,
  NAMESPACE, NODE, SECRET, RBAC, INGRESS,
  WORKLOAD, WORKLOAD_TYPES
} from '@/config/types';

import {
  STATE, NAME as NAME_COL, NAMESPACE_NAME, AGE, KEYS,
  BUILT_IN, CLUSTER_CREATOR_DEFAULT, INGRESS_TARGET, ROLES, VERSION, INTERNAL_EXTERNAL_IP, CPU, RAM
} from '@/config/table-headers';

import { DSL } from '@/store/type-map';

export const NAME = 'explorer';

export function init(store) {
  const {
    alwaysProduct,
    basicType,
    ignoreType,
    mapType,
    moveType,
    // weightType,
    mapGroup,
    weightGroup,
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
    WORKLOAD,
  ]);

  for (const key in WORKLOAD_TYPES) {
    componentForType(WORKLOAD_TYPES[key], WORKLOAD);
  }

  ignoreType('events.k8s.io.event'); // Old, moved into core
  ignoreType('extensions.ingress'); // Old, moved into networking

  mapType('endpoints', 'Endpoint'); // Bad plural

  // Move some core things into Cluster
  moveType(/^(namespace|node)$/, 'Cluster');

  weightGroup('Cluster', 99);
  weightGroup('Core', 98);

  mapGroup(/^(core)?$/, 'Core', 99);
  mapGroup('apps', 'Apps', 98);
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

  headers(RBAC.ROLE, [
    STATE,
    NAME_COL,
    BUILT_IN,
    AGE
  ]);

  headers(RBAC.CLUSTER_ROLE, [
    STATE,
    NAME_COL,
    BUILT_IN,
    CLUSTER_CREATOR_DEFAULT,
    AGE
  ]);

  virtualType({
    label:       'Overview',
    namespaced:  false,
    name:        'cluster-overview',
    group:       'Cluster',
    weight:      11,
    route:       { name: 'c-cluster' },
    exact:       true,
  });

  virtualType({
    label:      'Workload',
    namespaced: true,
    name:       'workload',
    group:      'Cluster',
    weight:     10,
    route:      {
      name:     'c-cluster-resource',
      params:   { resource: WORKLOAD }
    },
  });
}
