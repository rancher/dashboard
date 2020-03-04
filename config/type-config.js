import {
  ignoreType,
  basicType,
  weightGroup,
  mapGroup,
  mapType,
  mapTypeToComponentName,
  headers,
  virtualType,
} from '@/utils/customized';

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

import { ucFirst } from '@/utils/string';

export default function() {
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

  ignoreType('events.k8s.io.v1beta1.event'); // Events type moved into core
  ignoreType('extensions.v1beta1.ingress'); // Moved into networking

  mapType('core.v1.endpoints', 'Endpoint'); // Bad plural

  // Move some core things into Cluster
  mapType(/^core\.v1\.(namespace|node|persistentvolume)$/, (out, match, schema) => {
    schema.attributes.group = 'Cluster';

    return out;
  }, 99, true);

  mapType(/.*/, (typeStr, match, schema) => {
    return schema.attributes.kind;
  }, 1);

  weightGroup('Cluster', 99);
  weightGroup('Core', 98);
  weightGroup('Apps', 97);

  mapGroup(/^(core)?$/, 'Core', 99);
  mapGroup('apps', 'Core');
  mapGroup('batch', 'Core');
  mapGroup('extensions', 'Core');
  mapGroup('networking.k8s.io', 'Core');
  mapGroup(/^api.*\.k8s\.io$/, 'API');
  mapGroup('rbac.authorization.k8s.io', 'RBAC');
  mapGroup('admissionregistration.k8s.io', 'Admission');
  mapGroup(/^(.+\.)?cert-manager.io$/, 'Cert Manager');
  mapGroup('certmanager.k8s.io', 'Cert Manager');
  mapGroup(/^gateway.solo.io(.v\d+)?$/, 'Gloo');
  mapGroup('gloo.solo.io', 'Gloo');
  mapGroup(/^(.*\.)?monitoring.coreos.com$/, 'Monitoring');
  mapGroup(/^(.*\.)?tekton.dev$/, 'Tekton');
  mapGroup(/^(.*\.)?rio.cattle.io$/, 'Rio');
  mapGroup(/^(.*\.)?longhorn.rancher.io$/, 'Longhorn');
  mapGroup(/^(.*\.)?cattle.io$/, 'Rancher');
  mapGroup(/^(.*\.)?istio.io$/, 'Istio');
  mapGroup(/^(.*\.)?knative.io$/, 'Knative');
  mapGroup(/^(.*\.)?constraints.gatekeeper.sh.*$/, 'Gatekeeper Constraints');
  mapGroup(/^(.*\.)?templates.gatekeeper.sh.*$/, 'Gatekeeper Constraint Templates');
  mapTypeToComponentName(/^constraints.gatekeeper.sh.*$/, 'gatekeeper-constraint');

  mapGroup(/^(.*)\.k8s.io$/, (group, match) => {
    return match[1].split(/\./).map(x => ucFirst(x)).join('.');
  }, 1);

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

  virtualType({
    label:      'OPA+Gatekeeper',
    namespaced: false,
    name:       'gatekeeper',
    group:      'Cluster',
    route:      { name: 'c-cluster-gatekeeper' },
  });
}
