export const NAMESPACE_FILTER_ALL_PREFIX = 'all';
export const NAMESPACE_FILTER_NS_PREFIX = 'ns';
export const NAMESPACE_FILTER_P_PREFIX = 'project';

export const NAMESPACE_FILTER_NS_FULL_PREFIX = `${ NAMESPACE_FILTER_NS_PREFIX }://`;
export const NAMESPACE_FILTER_P_FULL_PREFIX = `${ NAMESPACE_FILTER_P_PREFIX }://`;

export const NAMESPACE_FILTER_ALL = NAMESPACE_FILTER_ALL_PREFIX;
export const NAMESPACE_FILTER_ALL_SYSTEM = `${ NAMESPACE_FILTER_ALL_PREFIX }://system`;
export const NAMESPACE_FILTER_ALL_USER = `${ NAMESPACE_FILTER_ALL_PREFIX }://user`;
export const NAMESPACE_FILTER_ALL_ORPHANS = `${ NAMESPACE_FILTER_ALL_PREFIX }://orphans`;
export const NAMESPACE_FILTER_NAMESPACED_PREFIX = 'namespaced://';
export const NAMESPACE_FILTER_NAMESPACED_YES = 'namespaced://true';
export const NAMESPACE_FILTER_NAMESPACED_NO = 'namespaced://false';

export const NAMESPACE_FILTER_KINDS = {
  DIVIDER:   'divider',
  PROJECT:   'project',
  NAMESPACE: 'namespace',
  SPECIAL:   'special'
};

const SEPARATOR = '__%%__';

export const createNamespaceFilterKey = (clusterId, product) => {
  if (!product?.customNamespaceFilter) {
    return clusterId;
  }

  return createNamespaceFilterKeyWithId(clusterId, product.name);
};
export const createNamespaceFilterKeyWithId = (clusterId, productId) => {
  return `${ clusterId }${ SEPARATOR }${ productId }`;
};

export const splitNamespaceFilterKey = (key) => {
  const [clusterId, productId] = key.split(SEPARATOR);

  return {
    clusterId,
    productId
  };
};
