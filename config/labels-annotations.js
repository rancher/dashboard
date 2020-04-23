export const DESCRIPTION = 'cattle.io/description';
export const HOSTNAME = 'kubernetes.io/hostname';
export const TIMESTAMP = 'cattle.io/timestamp';
export const PROJECT = 'field.cattle.io/projectId';
export const SYSTEM_PROJECT = 'authz.management.cattle.io/system-project';

export const KUBERNETES = { SERVICE_ACCOUNT_UID: 'kubernetes.io/service-account.uid', SERVICE_ACCOUNT_NAME: 'kubernetes.io/service-account.name' };

export const RIO = { STACK: 'rio.cattle.io/stack' };

export const CERTMANAGER = { ISSUER: 'cert-manager.io/issuer-name' };

export const NODE_ROLES = {
  CONTROL_PLANE: 'node-role.kubernetes.io/controlplane',
  WORKER:        'node-role.kubernetes.io/worker',
  ETCD:          'node-role.kubernetes.io/etcd',
};

export const LABEL_PREFIX_TO_IGNORE = [
  'io.cattle.lifecycle.',
  'beta.kubernetes.io/',
  'failure-domain.beta.kubernetes.io/',
  'node-role.kubernetes.io/',
  'kubernetes.io/',
  'cattle.io/',
  'authz.management.cattle.io',
  'rke.cattle.io',
  'field.cattle.io',
  'workload.user.cattle.io/',
  'k3s.io',
  'node.kubernetes.io',
];

export const ANNOTATIONS_TO_IGNORE_CONTAINS = [
  'coreos.com/',
  'cattle.io/',
  'k3s.io',
];

export const ANNOTATIONS_TO_IGNORE_PREFIX = [
  'kubernetes.io/',
  'beta.kubernetes.io/',
  'node.alpha.kubernetes.io/',
  'volumes.kubernetes.io/',
  'k3s.io',
]
;
