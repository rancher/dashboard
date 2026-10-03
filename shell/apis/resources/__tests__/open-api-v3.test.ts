import { OpenApiV3, openApiClusterId, PATCH_CONTENT_TYPE } from '@shell/apis/resources/open-api-v3';

const CONFIG_MAP_SCHEMA = {
  attributes: {
    group: '', version: 'v1', resource: 'configmaps', kind: 'ConfigMap', namespaced: true
  }
};

const NODE_SCHEMA = {
  attributes: {
    group: '', version: 'v1', resource: 'nodes', kind: 'Node', namespaced: false
  }
};

const USER_SCHEMA = {
  attributes: {
    group: 'management.cattle.io', version: 'v3', resource: 'users', kind: 'User', namespaced: false
  }
};

const PROJECT_SCHEMA = {
  attributes: {
    group: 'management.cattle.io', version: 'v3', resource: 'projects', kind: 'Project', namespaced: true
  }
};

/**
 * Build an OpenAPI v3 group document containing a single path
 */
const groupDoc = (path: string, contentTypes: string[]) => ({ paths: { [path]: { patch: { requestBody: { content: contentTypes.reduce((acc, contentType) => ({ ...acc, [contentType]: {} }), {}) } } } } });

const ALL_PATCH_TYPES = [
  PATCH_CONTENT_TYPE.APPLY_YAML,
  PATCH_CONTENT_TYPE.JSON_PATCH,
  PATCH_CONTENT_TYPE.MERGE,
  PATCH_CONTENT_TYPE.STRATEGIC_MERGE,
];

// CRDs don't support strategic merge patch
const CRD_PATCH_TYPES = [
  PATCH_CONTENT_TYPE.APPLY_YAML,
  PATCH_CONTENT_TYPE.JSON_PATCH,
  PATCH_CONTENT_TYPE.MERGE,
];

const createOpenApi = (schemas: Record<string, any>, request: jest.Mock) => new OpenApiV3({
  schemaFor: (resourceType: string) => schemas[resourceType],
  request,
});

describe('class: OpenApiV3', () => {
  let consoleWarnSpy: jest.SpyInstance;

  beforeEach(() => {
    // The group cache is static, so it has to be cleared between tests
    OpenApiV3.clearCache();
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    consoleWarnSpy.mockRestore();
  });

  describe('get', () => {
    it.each([
      [
        'a namespaced core resource',
        'configmap',
        CONFIG_MAP_SCHEMA,
        '/k8s/clusters/c-m-abcde/openapi/v3/api/v1',
        '/api/v1/namespaces/{namespace}/configmaps/{name}',
      ],
      [
        'a cluster scoped core resource',
        'node',
        NODE_SCHEMA,
        '/k8s/clusters/c-m-abcde/openapi/v3/api/v1',
        '/api/v1/nodes/{name}',
      ],
      [
        'a cluster scoped grouped resource',
        'management.cattle.io.user',
        USER_SCHEMA,
        '/k8s/clusters/c-m-abcde/openapi/v3/apis/management.cattle.io/v3',
        '/apis/management.cattle.io/v3/users/{name}',
      ],
      [
        'a namespaced grouped resource',
        'management.cattle.io.project',
        PROJECT_SCHEMA,
        '/k8s/clusters/c-m-abcde/openapi/v3/apis/management.cattle.io/v3',
        '/apis/management.cattle.io/v3/namespaces/{namespace}/projects/{name}',
      ],
    ])('should request the group document and read the patch content for %s', async(_label, resourceType, schema, expectedUrl, expectedPath) => {
      // Arrange
      const request = jest.fn().mockResolvedValue(groupDoc(expectedPath, ALL_PATCH_TYPES));
      const openApi = createOpenApi({ [resourceType]: schema }, request);

      // Act
      const result = await openApi.get('c-m-abcde', resourceType);

      // Assert
      expect(request).toHaveBeenCalledWith({ url: expectedUrl });
      expect(result).toStrictEqual(ALL_PATCH_TYPES);
    });

    it('should return no content types when the resource has no schema', async() => {
      // Arrange
      const request = jest.fn();
      const openApi = createOpenApi({}, request);

      // Act
      const result = await openApi.get('c-m-abcde', 'mycompany.io.customresource');

      // Assert
      expect(result).toStrictEqual([]);
      expect(request).not.toHaveBeenCalledWith();
    });

    it('should return no content types when the group document does not describe the resource', async() => {
      // Arrange
      const request = jest.fn().mockResolvedValue({ paths: { '/api/v1/namespaces/{namespace}/secrets/{name}': {} } });
      const openApi = createOpenApi({ configmap: CONFIG_MAP_SCHEMA }, request);

      // Act
      const result = await openApi.get('c-m-abcde', 'configmap');

      // Assert
      expect(result).toStrictEqual([]);
    });

    it('should only fetch a group document once, regardless of the number of callers', async() => {
      // Arrange
      const request = jest.fn().mockResolvedValue(groupDoc('/api/v1/nodes/{name}', ALL_PATCH_TYPES));
      const openApi = createOpenApi({ node: NODE_SCHEMA, configmap: CONFIG_MAP_SCHEMA }, request);

      // Act
      await Promise.all([
        openApi.get('c-m-abcde', 'node'),
        openApi.get('c-m-abcde', 'node'),
        openApi.get('c-m-abcde', 'configmap'),
      ]);

      // Assert - node and configmap are both in the core group
      expect(request).toHaveBeenCalledTimes(1);
    });

    it('should fetch a group document per cluster', async() => {
      // Arrange
      const request = jest.fn().mockResolvedValue(groupDoc('/api/v1/nodes/{name}', ALL_PATCH_TYPES));
      const openApi = createOpenApi({ node: NODE_SCHEMA }, request);

      // Act
      await openApi.get('c-m-abcde', 'node');
      await openApi.get('c-m-fghij', 'node');

      // Assert
      expect(request).toHaveBeenCalledTimes(2);
      expect(request).toHaveBeenCalledWith({ url: '/k8s/clusters/c-m-abcde/openapi/v3/api/v1' });
      expect(request).toHaveBeenCalledWith({ url: '/k8s/clusters/c-m-fghij/openapi/v3/api/v1' });
    });

    it('should not cache a failed request', async() => {
      // Arrange
      const request = jest.fn()
        .mockRejectedValueOnce(new Error('Forbidden'))
        .mockResolvedValueOnce(groupDoc('/api/v1/nodes/{name}', ALL_PATCH_TYPES));
      const openApi = createOpenApi({ node: NODE_SCHEMA }, request);

      // Act & Assert
      await expect(openApi.get('c-m-abcde', 'node')).rejects.toThrow('Forbidden');
      await expect(openApi.get('c-m-abcde', 'node')).resolves.toStrictEqual(ALL_PATCH_TYPES);
      expect(request).toHaveBeenCalledTimes(2);
    });
  });

  describe('patchContentType', () => {
    it('should use strategic merge patch when the resource supports it', async() => {
      // Arrange
      const request = jest.fn().mockResolvedValue(groupDoc('/api/v1/namespaces/{namespace}/configmaps/{name}', ALL_PATCH_TYPES));
      const openApi = createOpenApi({ configmap: CONFIG_MAP_SCHEMA }, request);

      // Act
      const result = await openApi.patchContentType('c-m-abcde', 'configmap');

      // Assert
      expect(result).toStrictEqual(PATCH_CONTENT_TYPE.STRATEGIC_MERGE);
    });

    it('should use merge patch when the resource does not support strategic merge patch', async() => {
      // Arrange
      const request = jest.fn().mockResolvedValue(groupDoc('/apis/management.cattle.io/v3/users/{name}', CRD_PATCH_TYPES));
      const openApi = createOpenApi({ 'management.cattle.io.user': USER_SCHEMA }, request);

      // Act
      const result = await openApi.patchContentType('local', 'management.cattle.io.user');

      // Assert
      expect(result).toStrictEqual(PATCH_CONTENT_TYPE.MERGE);
    });

    it.each([
      ['the request fails', jest.fn().mockRejectedValue(new Error('Forbidden'))],
      ['the response is empty', jest.fn().mockResolvedValue(undefined)],
    ])('should fall back to merge patch when %s', async(_label, request) => {
      // Arrange
      const openApi = createOpenApi({ configmap: CONFIG_MAP_SCHEMA }, request);

      // Act
      const result = await openApi.patchContentType('c-m-abcde', 'configmap');

      // Assert
      expect(result).toStrictEqual(PATCH_CONTENT_TYPE.MERGE);
    });

    it('should warn when the spec cannot be read', async() => {
      // Arrange
      const request = jest.fn().mockRejectedValue(new Error('Forbidden'));
      const openApi = createOpenApi({ configmap: CONFIG_MAP_SCHEMA }, request);

      // Act
      await openApi.patchContentType('c-m-abcde', 'configmap');

      // Assert
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        `Unable to read the OpenAPI spec for "configmap", PATCH requests will use "${ PATCH_CONTENT_TYPE.MERGE }"`,
        expect.any(Error)
      );
    });

    it.each([
      ['no cluster', undefined, 'configmap'],
      ['no resource type', 'c-m-abcde', undefined],
    ])('should fall back to merge patch without making a request when there is %s', async(_label, cluster, resourceType) => {
      // Arrange
      const request = jest.fn();
      const openApi = createOpenApi({ configmap: CONFIG_MAP_SCHEMA }, request);

      // Act
      const result = await openApi.patchContentType(cluster, resourceType);

      // Assert
      expect(result).toStrictEqual(PATCH_CONTENT_TYPE.MERGE);
      expect(request).not.toHaveBeenCalledWith();
    });
  });
});

describe('fx: openApiClusterId', () => {
  it.each([
    ['the local cluster for the management store', 'management', 'c-m-abcde', 'local'],
    ['the current cluster for the cluster store', 'cluster', 'c-m-abcde', 'c-m-abcde'],
    ['the current cluster for a custom store', 'harvester', 'c-m-abcde', 'c-m-abcde'],
    ['undefined when no cluster is being viewed', 'cluster', undefined, undefined],
  ])('should resolve to %s', (_label, storeName, currentClusterId, expected) => {
    expect(openApiClusterId(storeName, currentClusterId)).toStrictEqual(expected);
  });
});
