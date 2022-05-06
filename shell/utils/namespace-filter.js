export const NAMESPACE_FILTER_SPECIAL = 'special';

export const NAMESPACE_FILTER_ALL = 'all';
export const NAMESPACE_FILTER_ALL_SYSTEM = 'all://system';
export const NAMESPACE_FILTER_ALL_USER = 'all://user';
export const NAMESPACE_FILTER_ALL_ORPHANS = 'all://orphans';
export const NAMESPACE_FILTER_NAMESPACED_PREFIX = 'namespaced://';
export const NAMESPACE_FILTER_NAMESPACED_YES = 'namespaced://true';
export const NAMESPACE_FILTER_NAMESPACED_NO = 'namespaced://false';

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
