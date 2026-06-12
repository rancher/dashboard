import {
  expandOpenAPIDefinition,
  getOpenAPISchemaName,
  makeOpenAPIBreadcrumb,
} from '../open-api-utils';

describe('getOpenAPISchemaName', () => {
  it('returns empty string when schema has no attributes', () => {
    expect(getOpenAPISchemaName({})).toBe('');
    expect(getOpenAPISchemaName(null)).toBe('');
    expect(getOpenAPISchemaName(undefined)).toBe('');
  });

  it('builds name from core group attributes', () => {
    const schema = {
      attributes: {
        group:   'core',
        version: 'v1',
        kind:    'Service',
      },
    };

    expect(getOpenAPISchemaName(schema)).toBe('io.k8s.api.core.v1.Service');
  });

  it('reverses dotted group names', () => {
    const schema = {
      attributes: {
        group:   'apps.k8s.io',
        version: 'v1',
        kind:    'Deployment',
      },
    };

    expect(getOpenAPISchemaName(schema)).toBe('io.k8s.apps.v1.Deployment');
  });

  it('treats empty group as core', () => {
    const schema = {
      attributes: {
        group:   '',
        version: 'v1',
        kind:    'Pod',
      },
    };

    expect(getOpenAPISchemaName(schema)).toBe('io.k8s.api.core.v1.Pod');
  });
});

describe('makeOpenAPIBreadcrumb', () => {
  it('extracts the last segment as name', () => {
    const result = makeOpenAPIBreadcrumb('io.k8s.api.core.v1.ServiceSpec');

    expect(result).toStrictEqual({
      name: 'ServiceSpec',
      id:   'io.k8s.api.core.v1.ServiceSpec',
    });
  });

  it('handles single-segment id', () => {
    const result = makeOpenAPIBreadcrumb('ObjectMeta');

    expect(result).toStrictEqual({
      name: 'ObjectMeta',
      id:   'ObjectMeta',
    });
  });
});

describe('expandOpenAPIDefinition', () => {
  it('does nothing when definition has no properties', () => {
    const definitions = {};
    const definition = {};

    expandOpenAPIDefinition(definitions, definition);

    expect(definition).toStrictEqual({});
  });

  it('does nothing for null/undefined definitions', () => {
    expect(() => expandOpenAPIDefinition({}, null)).not.toThrow();
    expect(() => expandOpenAPIDefinition({}, undefined)).not.toThrow();
  });

  describe('$ref-based expansion (built-in resources)', () => {
    it('expands a property with $ref', () => {
      const definitions = {
        'io.k8s.api.core.v1.ServiceSpec': {
          properties: {
            clusterIP: {
              type:        'string',
              description: 'The cluster IP',
            },
          },
        },
      };
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
      expect(definition.properties.spec.$$ref.properties.clusterIP.type).toBe('string');
      expect(definition.properties.spec.$refName).toBe('io.k8s.api.core.v1.ServiceSpec');
      expect(definition.properties.spec.$refNameShort).toBe('ServiceSpec');
      expect(definition.properties.spec.$breadcrumbs).toStrictEqual([
        { name: 'ServiceSpec', id: 'io.k8s.api.core.v1.ServiceSpec' },
      ]);
    });

    it('expands items.$ref for array-typed properties', () => {
      const definitions = {
        'io.k8s.api.core.v1.Container': {
          properties: {
            name: {
              type:        'string',
              description: 'Container name',
            },
          },
        },
      };
      const definition = {
        properties: {
          containers: {
            type:  'array',
            items: { $ref: '#/definitions/io.k8s.api.core.v1.Container' },
          },
        },
      };

      expandOpenAPIDefinition(definitions, definition);

      expect(definition.properties.containers.$$ref).toBeDefined();
      expect(definition.properties.containers.$$ref.properties.name.type).toBe('string');
      expect(definition.properties.containers.$refName).toBe('io.k8s.api.core.v1.Container');
    });

    it('warns and skips when $ref target is not found', () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      const definitions = {};
      const definition = { properties: { spec: { $ref: '#/definitions/missing.Type' } } };

      expandOpenAPIDefinition(definitions, definition);

      expect(definition.properties.spec.$$ref).toBeUndefined();
      expect(warnSpy).toHaveBeenCalledWith('Can not find definition for missing.Type');
      warnSpy.mockRestore();
    });

    it('does not share $$ref objects between duplicate references', () => {
      const definitions = { 'io.k8s.apimachinery.v1.ObjectMeta': { properties: { name: { type: 'string' } } } };
      const definition = {
        properties: {
          metadata: { $ref: '#/definitions/io.k8s.apimachinery.v1.ObjectMeta' },
          other:    { $ref: '#/definitions/io.k8s.apimachinery.v1.ObjectMeta' },
        },
      };

      expandOpenAPIDefinition(definitions, definition);

      expect(definition.properties.metadata.$$ref).not.toBe(definition.properties.other.$$ref);
    });
  });

  describe('inline expansion (CRD schemas)', () => {
    it('expands inline properties without $ref', () => {
      const definition = {
        properties: {
          spec: {
            type:        'object',
            description: 'Spec for a custom resource',
            properties:  {
              replicas: {
                type:        'integer',
                description: 'Number of replicas',
              },
              selector: {
                type:        'string',
                description: 'Label selector',
              },
            },
          },
        },
      };

      expandOpenAPIDefinition({}, definition);

      const spec = definition.properties.spec;

      expect(spec.$$ref).toBeDefined();
      expect(spec.$$ref.properties.replicas.type).toBe('integer');
      expect(spec.$$ref.properties.selector.type).toBe('string');
      expect(spec.$refName).toBe('spec');
      expect(spec.$refNameShort).toBe('object');
      expect(spec.$inline).toBe(true);
      expect(spec.$breadcrumbs).toStrictEqual([]);
    });

    it('expands inline items.properties for array-typed CRD fields', () => {
      const definition = {
        properties: {
          conditions: {
            type:  'array',
            items: {
              type:       'object',
              properties: {
                type: {
                  type:        'string',
                  description: 'Condition type',
                },
                status: {
                  type:        'string',
                  description: 'Condition status',
                },
              },
            },
          },
        },
      };

      expandOpenAPIDefinition({}, definition);

      const conditions = definition.properties.conditions;

      expect(conditions.$$ref).toBeDefined();
      expect(conditions.$$ref.properties.type.type).toBe('string');
      expect(conditions.$$ref.properties.status.type).toBe('string');
      expect(conditions.$inline).toBe(true);
      expect(conditions.$refName).toBe('conditions');
    });

    it('recursively expands nested inline properties', () => {
      const definition = {
        properties: {
          spec: {
            type:       'object',
            properties: {
              template: {
                type:       'object',
                properties: {
                  image: {
                    type:        'string',
                    description: 'Container image',
                  },
                },
              },
            },
          },
        },
      };

      expandOpenAPIDefinition({}, definition);

      const spec = definition.properties.spec;

      expect(spec.$$ref).toBeDefined();

      const template = spec.$$ref.properties.template;

      expect(template.$$ref).toBeDefined();
      expect(template.$$ref.properties.image.type).toBe('string');
      expect(template.$inline).toBe(true);
      expect(template.$refName).toBe('template');
    });

    it('does not apply inline expansion when $ref is present', () => {
      const definitions = { 'io.k8s.apimachinery.v1.ObjectMeta': { properties: { name: { type: 'string' } } } };
      const definition = {
        properties: {
          metadata: {
            $ref:       '#/definitions/io.k8s.apimachinery.v1.ObjectMeta',
            properties: { extra: { type: 'string' } },
          },
        },
      };

      expandOpenAPIDefinition(definitions, definition);

      expect(definition.properties.metadata.$inline).toBeUndefined();
      expect(definition.properties.metadata.$refName).toBe('io.k8s.apimachinery.v1.ObjectMeta');
    });

    it('makes a deep copy of inline properties so mutations do not leak', () => {
      const originalProps = {
        replicas: {
          type:        'integer',
          description: 'Number of replicas',
        },
      };
      const definition = {
        properties: {
          spec: {
            type:       'object',
            properties: originalProps,
          },
        },
      };

      expandOpenAPIDefinition({}, definition);

      definition.properties.spec.$$ref.properties.replicas.description = 'MUTATED';

      expect(originalProps.replicas.description).toBe('Number of replicas');
    });

    it('preserves breadcrumbs through inline expansion', () => {
      const definitions = {
        'io.k8s.api.core.v1.ServiceSpec': {
          properties: {
            nested: {
              type:       'object',
              properties: { value: { type: 'string' } },
            },
          },
        },
      };
      const definition = { properties: { spec: { $ref: '#/definitions/io.k8s.api.core.v1.ServiceSpec' } } };

      expandOpenAPIDefinition(definitions, definition);

      const nested = definition.properties.spec.$$ref.properties.nested;

      expect(nested.$inline).toBe(true);
      expect(nested.$breadcrumbs).toStrictEqual([
        { name: 'ServiceSpec', id: 'io.k8s.api.core.v1.ServiceSpec' },
      ]);
    });
  });

  describe('More Info extraction', () => {
    it('extracts More Info URLs from descriptions', () => {
      const definition = {
        properties: {
          field: {
            type:        'string',
            description: 'A field. More info: https://example.com/docs',
          },
        },
      };

      expandOpenAPIDefinition({}, definition);

      expect(definition.properties.field.$moreInfo).toBe('https://example.com/docs');
      expect(definition.properties.field.description).toBe('A field.');
    });

    it('strips trailing dot from More Info URLs', () => {
      const definition = {
        properties: {
          field: {
            type:        'string',
            description: 'Some text More info: https://example.com/docs.',
          },
        },
      };

      expandOpenAPIDefinition({}, definition);

      expect(definition.properties.field.$moreInfo).toBe('https://example.com/docs');
    });
  });

  describe('realistic CRD scenario', () => {
    it('handles a CRD with mixed $ref and inline properties', () => {
      const definitions = {
        'io.k8s.apimachinery.pkg.apis.meta.v1.ObjectMeta': {
          properties: {
            name:      { type: 'string', description: 'Object name' },
            namespace: { type: 'string', description: 'Object namespace' },
          },
        },
      };
      const definition = {
        properties: {
          apiVersion: { type: 'string', description: 'API version' },
          kind:       { type: 'string', description: 'Object kind' },
          metadata:   { $ref: '#/definitions/io.k8s.apimachinery.pkg.apis.meta.v1.ObjectMeta' },
          spec:       {
            type:        'object',
            description: 'CRD spec',
            properties:  {
              replicas: {
                type:        'integer',
                description: 'Number of desired replicas',
              },
              selector: {
                type:        'string',
                description: 'Label selector for pods',
              },
            },
          },
          status: {
            type:        'object',
            description: 'CRD status',
            properties:  {
              readyReplicas: {
                type:        'integer',
                description: 'Number of ready replicas',
              },
            },
          },
        },
      };

      expandOpenAPIDefinition(definitions, definition);

      const {
        metadata, spec, status, apiVersion, kind
      } = definition.properties;

      expect(metadata.$$ref).toBeDefined();
      expect(metadata.$refName).toBe('io.k8s.apimachinery.pkg.apis.meta.v1.ObjectMeta');
      expect(metadata.$inline).toBeUndefined();

      expect(spec.$$ref).toBeDefined();
      expect(spec.$inline).toBe(true);
      expect(spec.$refName).toBe('spec');
      expect(spec.$$ref.properties.replicas.type).toBe('integer');
      expect(spec.$$ref.properties.selector.type).toBe('string');

      expect(status.$$ref).toBeDefined();
      expect(status.$inline).toBe(true);
      expect(status.$refName).toBe('status');
      expect(status.$$ref.properties.readyReplicas.type).toBe('integer');

      expect(apiVersion.$$ref).toBeUndefined();
      expect(kind.$$ref).toBeUndefined();
    });
  });
});
