import { expandOpenAPIDefinition, getOpenAPISchemaName, makeOpenAPIBreadcrumb } from '@pkg/kubectl-explain/open-api-utils';

describe('fx: getOpenAPISchemaName', () => {
  it('returns empty string when schema has no attributes', () => {
    expect(getOpenAPISchemaName({})).toStrictEqual('');
    expect(getOpenAPISchemaName(null)).toStrictEqual('');
  });

  it('builds name from core group', () => {
    const schema = {
      attributes: {
        group: 'core', version: 'v1', kind: 'Service'
      }
    };

    expect(getOpenAPISchemaName(schema)).toStrictEqual('io.k8s.api.core.v1.Service');
  });

  it('reverses dotted group names', () => {
    const schema = {
      attributes: {
        group: 'cert-manager.io', version: 'v1', kind: 'Certificate'
      }
    };

    expect(getOpenAPISchemaName(schema)).toStrictEqual('io.cert-manager.v1.Certificate');
  });
});

describe('fx: makeOpenAPIBreadcrumb', () => {
  it('extracts the last segment as name', () => {
    const result = makeOpenAPIBreadcrumb('io.k8s.api.core.v1.ServiceSpec');

    expect(result).toStrictEqual({ name: 'ServiceSpec', id: 'io.k8s.api.core.v1.ServiceSpec' });
  });
});

describe('fx: expandOpenAPIDefinition', () => {
  it('expands $ref properties using the definitions map', () => {
    const definitions = { 'io.k8s.api.core.v1.ServiceSpec': { properties: { clusterIP: { type: 'string', description: 'IP address of the service' } } } };

    const definition = {
      properties: {
        spec: {
          $ref:        '#/definitions/io.k8s.api.core.v1.ServiceSpec',
          description: 'Service spec',
        },
      },
    };

    expandOpenAPIDefinition(definitions, definition);

    expect(definition.properties.spec.$$ref).toBeDefined();
    expect(definition.properties.spec.$$ref.properties.clusterIP).toBeDefined();
    expect(definition.properties.spec.$refName).toStrictEqual('io.k8s.api.core.v1.ServiceSpec');
    expect(definition.properties.spec.$refNameShort).toStrictEqual('ServiceSpec');
    expect(definition.properties.spec.$breadcrumbs).toHaveLength(1);
  });

  it('warns and does not set $$ref when $ref target is missing', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    const definitions = {};
    const definition = { properties: { spec: { $ref: '#/definitions/io.k8s.missing.Type', description: 'missing' } } };

    expandOpenAPIDefinition(definitions, definition);

    expect(definition.properties.spec.$$ref).toBeUndefined();
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('io.k8s.missing.Type'));

    warnSpy.mockRestore();
  });

  it('expands inline properties on CRD-style fields (no $ref)', () => {
    const definitions = {};
    const definition = {
      properties: {
        spec: {
          type:        'object',
          description: 'Specification of the desired behavior.',
          properties:  {
            secretName: { type: 'string', description: 'Name of the secret' },
            issuerRef:  {
              type:       'object',
              properties: {
                name:  { type: 'string', description: 'Name of the issuer' },
                kind:  { type: 'string', description: 'Kind of the issuer' },
                group: { type: 'string', description: 'Group of the issuer' },
              },
            },
          },
        },
      },
    };

    expandOpenAPIDefinition(definitions, definition);

    const spec = definition.properties.spec;

    expect(spec.$$ref).toBeDefined();
    expect(spec.$$ref.properties.secretName).toBeDefined();
    expect(spec.$$ref.properties.secretName.type).toStrictEqual('string');
    expect(spec.$$ref.properties.issuerRef).toBeDefined();
    expect(spec.$$ref.properties.issuerRef.$$ref).toBeDefined();
    expect(spec.$$ref.properties.issuerRef.$$ref.properties.name.type).toStrictEqual('string');
  });

  it('expands inline properties inside items (array of objects)', () => {
    const definitions = {};
    const definition = {
      properties: {
        containers: {
          type:  'array',
          items: {
            properties: {
              name:  { type: 'string', description: 'Container name' },
              image: { type: 'string', description: 'Container image' },
            },
          },
        },
      },
    };

    expandOpenAPIDefinition(definitions, definition);

    const containers = definition.properties.containers;

    expect(containers.$$ref).toBeDefined();
    expect(containers.$$ref.properties.name.type).toStrictEqual('string');
    expect(containers.$$ref.properties.image.type).toStrictEqual('string');
  });

  it('does not set $refName or $refNameShort for inline properties', () => {
    const definitions = {};
    const definition = {
      properties: {
        spec: {
          type:       'object',
          properties: { field1: { type: 'string' } },
        },
      },
    };

    expandOpenAPIDefinition(definitions, definition);

    expect(definition.properties.spec.$$ref).toBeDefined();
    expect(definition.properties.spec.$refName).toBeUndefined();
    expect(definition.properties.spec.$refNameShort).toBeUndefined();
  });

  it('does not expand scalar properties without $ref or inline properties', () => {
    const definitions = {};
    const definition = {
      properties: {
        name: { type: 'string', description: 'A simple string' },
        age:  { type: 'integer', description: 'A number' },
      },
    };

    expandOpenAPIDefinition(definitions, definition);

    expect(definition.properties.name.$$ref).toBeUndefined();
    expect(definition.properties.age.$$ref).toBeUndefined();
  });

  it('extracts More info URLs from descriptions', () => {
    const definitions = {};
    const definition = {
      properties: {
        field: {
          type:        'string',
          description: 'Some description. More info: https://example.com/docs',
        },
      },
    };

    expandOpenAPIDefinition(definitions, definition);

    expect(definition.properties.field.$moreInfo).toStrictEqual('https://example.com/docs');
  });

  it('deeply clones inline properties so mutations do not leak', () => {
    const definitions = {};
    const original = { type: 'string', description: 'original' };
    const definition = {
      properties: {
        spec: {
          type:       'object',
          properties: { inner: original },
        },
      },
    };

    expandOpenAPIDefinition(definitions, definition);

    definition.properties.spec.$$ref.properties.inner.description = 'mutated';

    expect(original.description).toStrictEqual('original');
  });
});
