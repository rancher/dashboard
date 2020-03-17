export const DESCRIPTION = 'cattle.io/description';
export const TIMESTAMP = 'cattle.io/timestamp';
export const PROJECT = 'field.cattle.io/projectId';
export const SYSTEM_PROJECT = 'authz.management.cattle.io/system-project';

export const KUBERNETES = { SERVICE_ACCOUNT_UID: 'kubernetes.io/service-account.uid' };

export const RIO = { STACK: 'rio.cattle.io/stack' };

export const CERTMANAGER = { ISSUER: 'cert-manager.io/issuer-name' };

export const NODE_ROLES = {
  CONTROL_PLANE: 'node-role.kubernetes.io/controlplane',
  WORKER:        'node-role.kubernetes.io/worker',
  ETCD:          'node-role.kubernetes.io/etcd',
};
