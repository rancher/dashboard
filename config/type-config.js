import {
  CONFIG_MAP, NAMESPACE, NODE, POD, SECRET, RIO, RBAC, SERVICE, PV, PVC, INGRESS
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
  BUILT_IN, CLUSTER_CREATOR_DEFAULT, INGRESS_TARGET
} from '@/config/table-headers';

import { DSL } from '@/store/type-map';

export default function(store) {
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
    CONFIG_MAP,
    NAMESPACE,
    NODE,
    POD,
    SECRET,
    SERVICE,
    INGRESS,
    PV,
    PVC,
  ]);

  ignoreType('events.k8s.io.event'); // Events type moved into core
  ignoreType('extensions.ingress'); // Moved into networking

  mapType('core.v1.endpoints', 'Endpoint'); // Bad plural

  // Move some core things into Cluster
  moveType(/^core\.v1\.(namespace|node|persistentvolume)$/, 'Cluster');

  weightGroup('Cluster', 99);
  weightGroup('Core', 98);

  mapGroup(/^(core)?$/, 'Core', 99);
  mapGroup('apps', 'Core');
  mapGroup('batch', 'Core');
  mapGroup('extensions', 'Core');
  mapGroup('autoscaling', 'Autoscaling');
  mapGroup('policy', 'Policy');
  mapGroup('networking.k8s.io', 'Core');
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
  mapGroup(/^(.*\.)?cattle\.io$/, 'Rancher');
  mapGroup(/^(.*\.)?istio\.io$/, 'Istio');
  mapGroup(/^(.*\.)?knative\.io$/, 'Knative');

  headers(CONFIG_MAP, [STATE, NAMESPACE_NAME, KEYS, AGE]);
  headers(NAMESPACE, [STATE, NAME, AGE]);
  headers(NODE, [STATE, NODE_NAME, ROLES, VERSION, CPU, RAM, PODS]);
  headers(SECRET, [
    STATE,
    NAMESPACE_NAME,
    KEYS,
    {
      name:  'type',
      label: 'Type',
      value: 'typeDisplay',
      sort:  ['typeDisplay', 'nameSort'],
    },
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
    label:      'Workload',
    namespaced: true,
    name:       'workloads',
    group:      'Core',
    route:      {
      name:     'c-cluster-workloads',
      params:   { resource: 'workload' }
    },
  });

  // OPA Gatekeeper
  mapTypeToComponentName(/^constraints.gatekeeper.sh\..*$/, 'gatekeeper-constraint');
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
    label:      'Constraints',
    namespaced: false,
    name:       'gatekeeper-constraints',
    group:      'Cluster::OPA Gatekeeper',
    route:      { name: 'c-cluster-gatekeeper-constraints' },
    ifHaveType: 'templates.gatekeeper.sh.constrainttemplate'
  });

  virtualType({
    label:      'Templates',
    namespaced: false,
    name:       'gatekeeper-templates',
    group:      'Cluster::OPA Gatekeeper',
    route:      { name: 'c-cluster-gatekeeper-templates' },
    ifHaveType: 'templates.gatekeeper.sh.constrainttemplate'
  });
}
