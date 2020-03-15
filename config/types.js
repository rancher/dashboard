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

// Old Rancher API via Norman, /v3
export const NORMAN = {
  AUTH_CONFIG: 'authconfig',
  PRINCIPAL:   'principal',
  SETTING:     'setting',
};

// Rancher Management API via Steve, /v1
export const MANAGEMENT = {
  PROJECTS:         'management.cattle.io.project',
  CATALOGS:         'management.cattle.io.catalog',
  CATALOG_TEMPLATE: 'management.cattle.io.catalogtemplate',
  CLUSTER:          'management.cattle.io.cluster',
  USER:             'management.cattle.io.user'
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

export const WORKLOAD = {
  DEPLOYMENT:             'apps.deployment',
  DAEMON_SET:             'apps.daemonset',
  STATEFUL_SET:           'apps.statefulset',
  CRON_JOB:               'batch.cronjob',
  JOB:                    'batch.job',
  REPLICA_SET:            'apps.replicaset',
  REPLICATION_CONTROLLER: 'replicationcontroller'
};
