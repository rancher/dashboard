import {
  CONFIG_MAP, GATEKEEPER_CONSTRAINT_TEMPLATE, NAMESPACE, NODE, SECRET, RIO, RBAC, INGRESS, WORKLOAD
} from '@/config/types';

import {
  STATE,
  NAME, NAMESPACE_NAME, NAMESPACE_NAME_IMAGE,
  AGE, WEIGHT, SCALE,
  KEYS, ENDPOINTS,
  MATCHES, DESTINATION,
  TARGET, TARGET_KIND, USERNAME, USER_DISPLAY_NAME, USER_ID, USER_STATUS,
  NODE_NAME, ROLES,
  VERSION, CPU,
  RAM, PODS,
  BUILT_IN, CLUSTER_CREATOR_DEFAULT, INGRESS_TARGET,
} from '@/config/table-headers';

import { DSL } from '@/store/type-map';

let called = false;

export default function(store) {
  if (called) {
    return;
  }
  called = true;
  const {
    basicType,
    ignoreType,
    mapType,
    moveType,
    // weightType,
    ignoreGroup,
    mapGroup,
    weightGroup,
    headers,
    virtualType,
    mapTypeToComponentName,
  } = DSL(store);

  basicType([
    'cluster-overview',
    NAMESPACE,
    NODE,
    'workloads',
    'gatekeeper',
    'gatekeeper-constraints',
    'gatekeeper-templates',
  ]);

  mapTypeToComponentName(/^constraints.gatekeeper.sh.*$/, 'gatekeeper-constraint');

  for (const key in WORKLOAD) {
    mapTypeToComponentName(WORKLOAD[key], 'workload');
  }

  ignoreType('events.k8s.io.event'); // Events type moved into core
  ignoreType('extensions.ingress'); // Moved into networking

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
  mapGroup(/^(.*\.)?rio\.cattle\.io$/, 'Rio');
  mapGroup(/^(.*\.)?longhorn\.rancher\.io$/, 'Longhorn');
  mapGroup(/^(.*\.)?fleet\.cattle\.io$/, 'Fleet');
  mapGroup(/^(.*\.)?k3s\.cattle\.io$/, 'k3s');
  mapGroup(/^(project|management)\.cattle\.io$/, 'Rancher');
  mapGroup(/^(.*\.)?istio\.io$/, 'Istio');
  mapGroup(/^(.*\.)?knative\.io$/, 'Knative');

  headers(CONFIG_MAP, [STATE, NAMESPACE_NAME, KEYS, AGE]);
  headers(NODE, [STATE, NODE_NAME, ROLES, VERSION, CPU, RAM, PODS]);
  headers(SECRET, [
    STATE,
    NAMESPACE_NAME,
    {
      name:  'type',
      label: 'Type',
      value: 'typeDisplay',
      sort:  ['typeDisplay', 'nameSort'],
      width: 100,
    },
    KEYS,
    AGE
  ]);
  headers(INGRESS, [STATE, NAME, INGRESS_TARGET, AGE]);

  headers(RIO.EXTERNAL_SERVICE, [STATE, NAMESPACE_NAME, TARGET_KIND, TARGET, AGE]);
  headers(RIO.PUBLIC_DOMAIN, [
    STATE,
    NAME,
    TARGET_KIND,
    TARGET,
    {
      name:   'secret-name',
      label:  'Secret',
      value:  'status.assignedSecretName',
      sort:   ['secretName', 'targetApp', 'targetVersion'],
    },
    AGE,
  ]);

  headers(RIO.SERVICE, [
    STATE,
    NAMESPACE_NAME_IMAGE,
    ENDPOINTS,
    WEIGHT,
    SCALE,
    {
      name:  'connections',
      label: 'Conn.',
      value: 'connections',
      sort:  ['connections'],
      align: 'right',
      width: 60,
    },
    {
      name:  'p95',
      label: '95%',
      value: 'p95Display',
      sort:  ['p95'],
      align: 'right',
      width: 75,
    },
    {
      name:  'network',
      label: 'Network',
      value: 'networkDisplay',
      sort:  ['networkBytes'],
      align: 'right',
      width: 75,
    },
    AGE,
  ]);

  headers(RIO.STACK, [
    STATE,
    NAMESPACE_NAME,
    {
      name:  'repo',
      label: 'Repo',
      value: 'repoDisplay',
      sort:  'repoDisplay',
    },
    {
      name:  'branch',
      label: 'Branch',
      value: 'branchDisplay',
      sort:  'branchDisplay',
    },
    AGE,
  ]);

  headers(RIO.ROUTER, [
    STATE,
    NAMESPACE_NAME,
    MATCHES,
    DESTINATION,
    AGE
  ]);

  headers(RIO.USER, [
    USER_STATUS,
    USERNAME,
    USER_DISPLAY_NAME,
    USER_ID
  ]);

  headers(RBAC.ROLE, [
    STATE,
    NAME,
    BUILT_IN,
    AGE
  ]);

  headers(RBAC.CLUSTER_ROLE, [
    STATE,
    NAME,
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
    name:       'workloads',
    group:      'Cluster',
    weight:     10,
    route:      {
      name:     'c-cluster-workloads',
      params:   { resource: 'workload' }
    },
  });

  // OPA Gatekeeper

  ignoreGroup(/^.*\.gatekeeper\.sh$/);

  virtualType({
    label:       'OPA Gatekeeper',
    namespaced:  false,
    name:        'gatekeeper',
    group:       'Cluster',
    route:       { name: 'c-cluster-gatekeeper' },
    ifIsRancher: true,
  });

  virtualType({
    label:      'Constraint',
    namespaced: false,
    name:       'gatekeeper-constraints',
    group:      'Cluster::OPA Gatekeeper',
    route:      { name: 'c-cluster-gatekeeper-constraints' },
    ifHaveType: GATEKEEPER_CONSTRAINT_TEMPLATE
  });

  virtualType({
    label:      'Template',
    namespaced: false,
    name:       'gatekeeper-templates',
    group:      'Cluster::OPA Gatekeeper',
    route:      { name: 'c-cluster-gatekeeper-templates' },
    ifHaveType: GATEKEEPER_CONSTRAINT_TEMPLATE
  });
}
