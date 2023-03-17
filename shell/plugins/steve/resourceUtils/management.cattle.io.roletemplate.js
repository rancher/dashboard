export const SUBTYPE_MAPPING = {
  GLOBAL: {
    key:        'GLOBAL',
    type:       'management.cattle.io.globalrole',
    defaultKey: 'newUserDefault',
    id:         'GLOBAL',
    labelKey:   'rbac.roletemplate.subtypes.GLOBAL.label',
  },
  CLUSTER: {
    key:        'CLUSTER',
    type:       'management.cattle.io.roletemplate',
    context:    'cluster',
    defaultKey: 'clusterCreatorDefault',
    id:         'CLUSTER',
    labelKey:   'rbac.roletemplate.subtypes.CLUSTER.label',
  },
  NAMESPACE: {
    key:        'NAMESPACE',
    type:       'management.cattle.io.roletemplate',
    context:    'project',
    defaultKey: 'projectCreatorDefault',
    id:         'NAMESPACE',
    labelKey:   'rbac.roletemplate.subtypes.NAMESPACE.label',
  },
  RBAC_ROLE: {
    key:      'RBAC_ROLE',
    type:     'rbac.authorization.k8s.io.role',
    id:       'RBAC_ROLE',
    labelKey: 'rbac.roletemplate.subtypes.RBAC_ROLE.label',
  },
  RBAC_CLUSTER_ROLE: {
    key:      'RBAC_CLUSTER_ROLE',
    type:     'rbac.authorization.k8s.io.clusterrole',
    id:       'RBAC_CLUSTER_ROLE',
    labelKey: 'rbac.roletemplate.subtypes.RBAC_CLUSTER_ROLE.label',
  }
};

export function _getSubType(resource) {
  if (resource._subtype) {
    return resource._subtype;
  }

  if (resource.type === SUBTYPE_MAPPING.CLUSTER.type && resource.context === SUBTYPE_MAPPING.CLUSTER.context) {
    return SUBTYPE_MAPPING.CLUSTER.key;
  }

  if (resource.type === SUBTYPE_MAPPING.NAMESPACE.type && resource.context === SUBTYPE_MAPPING.NAMESPACE.context) {
    return SUBTYPE_MAPPING.NAMESPACE.key;
  }

  return null;
}

export function _getDefault(resource) {
  const defaultKey = SUBTYPE_MAPPING[resource.subtype]?.defaultKey;

  return !!resource[defaultKey];
}

export const calculatedFields = [
  { name: 'subType', func: _getSubType },
  { name: 'default', func: _getDefault }
];
