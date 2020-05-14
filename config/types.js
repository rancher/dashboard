// Steve
export const API_GROUP = 'apiGroups';
export const CONFIG_MAP = 'configmap';
export const COUNT = 'count';
export const EVENT = 'event';
export const NAMESPACE = 'namespace';
export const NODE = 'node';
export const POD = 'pod';
export const RESOURCE_QUOTA = 'resourcequota';
export const SCHEMA = 'schema';
export const SECRET = 'secret';
export const SERVICE_ACCOUNT = 'serviceaccount';
export const SERVICE = 'service';
export const INGRESS = 'networking.k8s.io.ingress';
export const PV = 'persistentvolume';
export const PVC = 'persistentvolumeclaim';
export const TLS_CERT = 'kubernetes.io/tls';
export const GATEKEEPER_CONSTRAINT_TEMPLATE = 'templates.gatekeeper.sh.constrainttemplate';

export const COLLECTION_TYPES = {
  array: 'array',
  map:   'map',
};

export const PRIMITIVE_TYPES = {
  string:    'string',
  multiline: 'multiline',
  masked:    'masked',
  password:  'password',
  float:     'float',
  int:       'int',
  date:      'date',
  blob:      'blob',
  boolean:   'boolean',
  json:      'json',
  version:   'version',
};

// Old Rancher API via Norman, /v3
export const NORMAN = {
  AUTH_CONFIG: 'authconfig',
  PRINCIPAL:   'principal',
  SETTING:     'setting',
};

// Rancher Management API via Steve, /v1
export const MANAGEMENT = {
  CATALOG:          'management.cattle.io.catalog',
  CATALOG_TEMPLATE: 'management.cattle.io.catalogtemplate',
  CLUSTER:          'management.cattle.io.cluster',
  USER:             'management.cattle.io.user',
  PREFERENCE:       'userpreference',
  NODE_POOL:        'management.cattle.io.nodepool',
  NODE_TEMPLATE:    'management.cattle.io.nodetemplate',
};

// Rancher cluster-scoped things that actually live in management plane
// /v1/management.cattle.io.clusters/<id>/
export const EXTERNAL = {
  PROJECT: 'project',
  APP:     'app',
};

// Other types via Steve, /k8s/clusters/<id>/v1/

export const RBAC = {
  ROLE:                 'rbac.authorization.k8s.io.role',
  CLUSTER_ROLE:         'rbac.authorization.k8s.io.clusterrole',
  ROLE_BINDING:         'rbac.authorization.k8s.io.rolebinding',
  CLUSTER_ROLE_BINDING: 'rbac.authorization.k8s.io.clusterrolebinding',
};

export const RIO = {
  CLUSTER_DOMAIN:   'admin.rio.cattle.io.clusterdomain',
  FEATURE:          'admin.rio.cattle.io.feature',
  INFO:             'admin.rio.cattle.io.rioinfo',
  PUBLIC_DOMAIN:    'admin.rio.cattle.io.publicdomain',

  APP:              'rio.cattle.io.app',
  EXTERNAL_SERVICE: 'rio.cattle.io.externalservice',
  STACK:            'rio.cattle.io.stack',
  ROUTER:           'rio.cattle.io.router',
  SERVICE:          'rio.cattle.io.service',

  SYSTEM_NAMESPACE: 'rio-system',
};

export const WORKLOAD = 'workload';

// The types that are aggregated into a "workload"
export const WORKLOAD_TYPES = {
  DEPLOYMENT:             'apps.deployment',
  DAEMON_SET:             'apps.daemonset',
  STATEFUL_SET:           'apps.statefulset',
  CRON_JOB:               'batch.cronjob',
  JOB:                    'batch.job',
  REPLICA_SET:            'apps.replicaset',
  REPLICATION_CONTROLLER: 'replicationcontroller'
};

export const METRIC = {
  NODE: 'metrics.k8s.io.nodemetrics',
  POD:  'metrics.k8s.io.podmetrics',
};

export const GATEKEEPER = {
  TEMPLATE_ID: 'cattle-global-data/system-library-rancher-gatekeeper-operator',
  APP_ID:      'rancher-gatekeeper-operator',
  CONFIG:      `---
replicas: 1
auditInterval: 300
constraintViolationsLimit: 20
auditFromCache: false
image:
  repository: rancher/opa-gatekeeper
  tag: v3.1.0-beta.7
  pullPolicy: IfNotPresent
nodeSelector: {"beta.kubernetes.io/os": "linux"}
tolerations: []
resources:
  limits:
    cpu: 1000m
    memory: 512Mi
  requests:
    cpu: 100m
    memory: 256Mi
global:
  systemDefaultRegistry: ""
  kubectl:
    repository: rancher/istio-kubectl
    tag: 1.4.6
`
};

export const SYSTEM_PROJECT_LABEL = 'authz.management.cattle.io/system-project';

export const DEFAULT_SERVICE_TYPES = [
  {
    id:               'ClusterIP',
    translationLabel: 'serviceTypes.clusterip'
  },
  {
    id:               'ExternalName',
    translationLabel: 'serviceTypes.externalname'
  },
  {
    id:               'Headless',
    translationLabel: 'serviceTypes.headless'
  },
  {
    id:               'LoadBalancer',
    translationLabel: 'serviceTypes.loadbalancer'
  },
  {
    id:               'NodePort',
    translationLabel: 'serviceTypes.nodeport'
  },
];
