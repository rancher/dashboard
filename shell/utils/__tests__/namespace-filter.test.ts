import {
  NAMESPACE_FILTER_ALL_PREFIX,
  NAMESPACE_FILTER_NS_PREFIX,
  NAMESPACE_FILTER_P_PREFIX,
  NAMESPACE_FILTER_NS_FULL_PREFIX,
  NAMESPACE_FILTER_P_FULL_PREFIX,
  NAMESPACE_FILTER_ALL,
  NAMESPACE_FILTER_ALL_SYSTEM,
  NAMESPACE_FILTER_ALL_USER,
  NAMESPACE_FILTER_ALL_ORPHANS,
  NAMESPACE_FILTER_NAMESPACED_PREFIX,
  NAMESPACE_FILTER_NAMESPACED_YES,
  NAMESPACE_FILTER_NAMESPACED_NO,
  NAMESPACE_FILTER_KINDS,
  createNamespaceFilterKey,
  createNamespaceFilterKeyWithId,
  splitNamespaceFilterKey,
} from '@shell/utils/namespace-filter';

describe('namespace-filter constants', () => {
  it('prefix constants have expected values', () => {
    expect(NAMESPACE_FILTER_ALL_PREFIX).toStrictEqual('all');
    expect(NAMESPACE_FILTER_NS_PREFIX).toStrictEqual('ns');
    expect(NAMESPACE_FILTER_P_PREFIX).toStrictEqual('project');
  });

  it('full prefix constants are built from base prefixes', () => {
    expect(NAMESPACE_FILTER_NS_FULL_PREFIX).toStrictEqual('ns://');
    expect(NAMESPACE_FILTER_P_FULL_PREFIX).toStrictEqual('project://');
  });

  it('all-namespace filter constants have expected values', () => {
    expect(NAMESPACE_FILTER_ALL).toStrictEqual('all');
    expect(NAMESPACE_FILTER_ALL_SYSTEM).toStrictEqual('all://system');
    expect(NAMESPACE_FILTER_ALL_USER).toStrictEqual('all://user');
    expect(NAMESPACE_FILTER_ALL_ORPHANS).toStrictEqual('all://orphans');
  });

  it('namespaced filter constants have expected values', () => {
    expect(NAMESPACE_FILTER_NAMESPACED_PREFIX).toStrictEqual('namespaced://');
    expect(NAMESPACE_FILTER_NAMESPACED_YES).toStrictEqual('namespaced://true');
    expect(NAMESPACE_FILTER_NAMESPACED_NO).toStrictEqual('namespaced://false');
  });

  it('nAMESPACE_FILTER_KINDS has expected shape', () => {
    expect(NAMESPACE_FILTER_KINDS).toStrictEqual({
      DIVIDER:   'divider',
      PROJECT:   'project',
      NAMESPACE: 'namespace',
      SPECIAL:   'special',
    });
  });
});

describe('createNamespaceFilterKey', () => {
  it('returns clusterId when product is undefined', () => {
    expect(createNamespaceFilterKey('c-abc', undefined)).toStrictEqual('c-abc');
  });

  it('returns clusterId when product has no customNamespaceFilter', () => {
    expect(createNamespaceFilterKey('c-abc', { name: 'manager' })).toStrictEqual('c-abc');
  });

  it('returns clusterId when product.customNamespaceFilter is falsy', () => {
    expect(createNamespaceFilterKey('c-abc', { name: 'manager', customNamespaceFilter: false })).toStrictEqual('c-abc');
  });

  it('returns compound key when product has customNamespaceFilter', () => {
    const result = createNamespaceFilterKey('c-abc', { name: 'myProduct', customNamespaceFilter: true });

    expect(result).toStrictEqual('c-abc__%%__myProduct');
  });
});

describe('createNamespaceFilterKeyWithId', () => {
  it('combines clusterId and productId with separator', () => {
    expect(createNamespaceFilterKeyWithId('c-abc', 'myProduct')).toStrictEqual('c-abc__%%__myProduct');
  });

  it('works with empty strings', () => {
    expect(createNamespaceFilterKeyWithId('', '')).toStrictEqual('__%%__');
  });
});

describe('splitNamespaceFilterKey', () => {
  it('splits a compound key into clusterId and productId', () => {
    expect(splitNamespaceFilterKey('c-abc__%%__myProduct')).toStrictEqual({
      clusterId: 'c-abc',
      productId: 'myProduct',
    });
  });

  it('returns undefined productId when key has no separator', () => {
    expect(splitNamespaceFilterKey('c-abc')).toStrictEqual({
      clusterId: 'c-abc',
      productId: undefined,
    });
  });

  it('round-trips with createNamespaceFilterKeyWithId', () => {
    const key = createNamespaceFilterKeyWithId('cluster-1', 'product-a');
    const result = splitNamespaceFilterKey(key);

    expect(result).toStrictEqual({
      clusterId: 'cluster-1',
      productId: 'product-a',
    });
  });
});
