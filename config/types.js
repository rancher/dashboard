
export const CONFIG_MAP = 'core.v1.configmap';
export const COUNT = 'count';
export const EVENT = 'core.v1.event';
export const NAMESPACE = 'core.v1.namespace';
export const NODE = 'core.v1.node';
export const POD = 'core.v1.pod';
export const RESOURCE_QUOTA = 'core.v1.resourcequota';
export const SCHEMA = 'schema';
export const SECRET = 'core.v1.secret';
export const SERVICE_ACCOUNT = 'core.v1.serviceaccount';

export const NORMAN = {
  AUTH_CONFIG: 'authconfig',
  PRINCIPAL:   'principal',
  USER:        'user',
  PREFERENCE:  'preference',
  SETTING:     'setting',
};

export const RANCHER = {
  CLUSTER: 'management.cattle.io.v3.cluster',
  USER:    'management.cattle.io.v3.user'
};

export const RBAC = {
  ROLES:                 'rbac.authorization.k8s.io.v1.role',
  CLUSTER_ROLES:         'rbac.authorization.k8s.io.v1.clusterrole',
  ROLE_BINDINGS:         'rbac.authorization.k8s.io.v1.rolebinding',
  CLUSTER_ROLE_BINDINGS: 'rbac.authorization.k8s.io.v1.clusterrolebinding',
};

export const RIO = {
  CLUSTER_DOMAIN:   'admin.rio.cattle.io.v1.clusterdomain',
  FEATURE:          'admin.rio.cattle.io.v1.feature',
  INFO:             'admin.rio.cattle.io.v1.rioinfo',
  PUBLIC_DOMAIN:    'admin.rio.cattle.io.v1.publicdomain',

  APP:              'rio.cattle.io.v1.app',
  EXTERNAL_SERVICE: 'rio.cattle.io.v1.externalservice',
  STACK:            'rio.cattle.io.v1.stack',
  ROUTER:           'rio.cattle.io.v1.router',
  SERVICE:          'rio.cattle.io.v1.service',

  SYSTEM_NAMESPACE: 'rio-system',

};
