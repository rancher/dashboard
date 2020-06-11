import {
  CONFIG_MAP, GATEKEEPER_CONSTRAINT_TEMPLATE, NAMESPACE, NODE, SECRET, RIO, RBAC, INGRESS, WORKLOAD_TYPES, EXTERNAL
} from '@/config/types';

import {
  STATE,
  NAME, NAMESPACE_NAME,
  AGE, WEIGHT, SCALE,
  KEYS, ENDPOINTS,
  MATCHES, DESTINATION,
  TARGET, TARGET_KIND, USERNAME, USER_DISPLAY_NAME, USER_ID, USER_STATUS,
  BUILT_IN, CLUSTER_CREATOR_DEFAULT, INGRESS_TARGET, ROLES, VERSION, INTERNAL_EXTERNAL_IP, CPU, RAM
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
    markTypeAsUncreatable,
    markTypeAsImmutable
  } = DSL(store);

  basicType([
    'cluster-overview',
    NAMESPACE,
    NODE,
    'workload',
  ]);

  for (const key in WORKLOAD_TYPES) {
    mapTypeToComponentName(WORKLOAD_TYPES[key], 'workload');
  }

  ignoreType('events.k8s.io.event'); // Events type moved into core
  ignoreType('extensions.ingress'); // Moved into networking

  mapType('endpoints', 'Endpoint'); // Bad plural

  // Move some core things into Cluster
  moveType(/^(namespace|node)$/, 'Cluster');

  weightGroup('Cluster', 99);
  weightGroup('Core', 98);

  markTypeAsUncreatable(NODE);
  markTypeAsImmutable(NODE);

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
  mapGroup(/^(.*\.)?longhorn\.rancher\.io$/, 'Longhorn');
  mapGroup(/^(.*\.)?(rio|gitwatcher)\.cattle\.io$/, 'Rio');
  mapGroup(/^(.*\.)?fleet\.cattle\.io$/, 'Fleet');
  mapGroup(/^(.*\.)?(helm|upgrade|k3s)\.cattle\.io$/, 'k3s');
  mapGroup(/^(project|management)\.cattle\.io$/, 'Rancher');
  mapGroup(/^(.*\.)?istio\.io$/, 'Istio');
  mapGroup('split.smi-spec.io', 'SMI');
  mapGroup(/^(.*\.)*knative\.io$/, 'Knative');

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
  headers(INGRESS, [STATE, NAME, INGRESS_TARGET, AGE]);
  headers(NODE, [STATE, NAME, ROLES, VERSION, INTERNAL_EXTERNAL_IP, CPU, RAM]);

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
    NAME,
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
    label:      'Project',
    namespaced: false,
    name:       'project',
    weight:     10,
    route:      {
      name:     'c-cluster-resource',
      params:   { resource: EXTERNAL.PROJECT }
    },
  });

  virtualType({
    label:      'Workload',
    namespaced: true,
    name:       'workload',
    group:      'Cluster',
    weight:     10,
    route:      {
      name:     'c-cluster-resource',
      params:   { resource: 'workload' }
    },
  });

  // OPA Gatekeeper
  mapTypeToComponentName(/^constraints.gatekeeper.sh.*$/, 'gatekeeper-constraint');

  basicType([
    'gatekeeper',
    'gatekeeper-constraint',
    'gatekeeper-template',
  ]);

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
    name:       'gatekeeper-constraint',
    group:      'Cluster::OPA Gatekeeper',
    route:      { name: 'c-cluster-gatekeeper-constraints' },
    ifHaveType: GATEKEEPER_CONSTRAINT_TEMPLATE
  });

  virtualType({
    label:      'Template',
    namespaced: false,
    name:       'gatekeeper-template',
    group:      'Cluster::OPA Gatekeeper',
    route:      { name: 'c-cluster-gatekeeper-templates' },
    ifHaveType: GATEKEEPER_CONSTRAINT_TEMPLATE
  });

  // Rio
  basicType([
    'rio',
    RIO.SERVICE,
    RIO.ROUTER,
    RIO.PUBLIC_DOMAIN,
    RIO.EXTERNAL_SERVICE,
    RIO.STACK
  ]);

  virtualType({
    label:       'Rio',
    namespaced:  false,
    name:        'rio',
    group:       'Cluster',
    route:       { name: 'c-cluster-rio' },
    ifIsRancher: true,
  });

  moveType(RIO.SERVICE, 'Cluster::Rio::Service');
  moveType(RIO.ROUTER, 'Cluster::Rio::Router');
  moveType(RIO.PUBLIC_DOMAIN, 'Cluster::Rio::Public Domain');
  moveType(RIO.EXTERNAL_SERVICE, 'Cluster::Rio::External Service');
  moveType(RIO.STACK, 'Cluster::Rio::Stack');
}
