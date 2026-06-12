import { expandOpenAPIDefinition, getOpenAPISchemaName, makeOpenAPIBreadcrumb } from '../open-api-utils';

describe('getOpenAPISchemaName', () => {
  it('returns empty string when schema has no attributes', () => {
    expect(getOpenAPISchemaName({})).toBe('');
    expect(getOpenAPISchemaName(null)).toBe('');
  });

  it('builds name from core group', () => {
    const schema = {
      attributes: {
        group: 'core', version: 'v1', kind: 'Pod'
      }
    };

    expect(getOpenAPISchemaName(schema)).toBe('io.k8s.api.core.v1.Pod');
  });

  it('reverses dotted group names', () => {
    const schema = {
      attributes: {
        group: 'cert-manager.io', version: 'v1', kind: 'Certificate'
      }
    };

    expect(getOpenAPISchemaName(schema)).toBe('io.cert-manager.v1.Certificate');
  });
});

describe('makeOpenAPIBreadcrumb', () => {
  it('extracts the last segment as name', () => {
    const result = makeOpenAPIBreadcrumb('io.k8s.api.core.v1.PodSpec');

    expect(result).toStrictEqual({ name: 'PodSpec', id: 'io.k8s.api.core.v1.PodSpec' });
  });
});

describe('expandOpenAPIDefinition', () => {
  it('expands $ref properties using definitions lookup', () => {
    const definitions = {
      'io.k8s.api.core.v1.Container': {
        description: 'A container',
        properties:  { name: { type: 'string', description: 'Container name' } },
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

    expandOpenAPIDefinition(definitions, definition, []);

    const containers = definition.properties.containers as any;

    expect(containers.$$ref).toBeDefined();
    expect(containers.$$ref.properties.name.type).toBe('string');
    expect(containers.$refName).toBe('io.k8s.api.core.v1.Container');
    expect(containers.$refNameShort).toBe('Container');
    expect(containers.$breadcrumbs).toStrictEqual([{ name: 'Container', id: 'io.k8s.api.core.v1.Container' }]);
  });

  it('warns and skips when $ref target is not found', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const definitions = {};
    const definition = { properties: { missing: { $ref: '#/definitions/io.k8s.DoesNotExist' } } };

    expandOpenAPIDefinition(definitions, definition, []);

    expect((definition.properties.missing as any).$$ref).toBeUndefined();
    expect(warnSpy).toHaveBeenCalledWith('Can not find definition for io.k8s.DoesNotExist');
    warnSpy.mockRestore();
  });

  it('expands inline object properties (CRD-style schemas without $ref)', () => {
    const definitions = {};
    const definition = {
      properties: {
        spec: {
          type:        'object',
          description: 'The spec of the CRD',
          properties:  {
            replicas: {
              type:        'integer',
              description: 'Number of replicas',
            },
            selector: {
              type:        'object',
              description: 'Label selector',
              properties:  { matchLabels: { type: 'object', description: 'Map of labels' } },
            },
          },
        },
      },
    };

    expandOpenAPIDefinition(definitions, definition, []);

    const spec = definition.properties.spec as any;

    expect(spec.$$ref).toBeDefined();
    expect(spec.$$ref.description).toBe('The spec of the CRD');
    expect(spec.$$ref.properties.replicas.type).toBe('integer');
    expect(spec.$refName).toBe('spec');
    expect(spec.$refNameShort).toBe('spec');

    // Nested inline objects should also be expanded recursively
    const selector = spec.$$ref.properties.selector as any;

    expect(selector.$$ref).toBeDefined();
    expect(selector.$$ref.properties.matchLabels).toBeDefined();
  });

  it('expands inline array items with properties (CRD-style array of objects)', () => {
    const definitions = {};
    const definition = {
      properties: {
        additionalOutputFormats: {
          type:        'array',
          description: 'Extra output formats',
          items:       {
            description: 'CertificateAdditionalOutputFormat',
            properties:  { type: { type: 'string', description: 'Format type' } },
          },
        },
      },
    };

    expandOpenAPIDefinition(definitions, definition, []);

    const field = definition.properties.additionalOutputFormats as any;

    expect(field.$$ref).toBeDefined();
    expect(field.$$ref.properties.type.type).toBe('string');
    expect(field.$refName).toBe('additionalOutputFormats');
    expect(field.$refNameShort).toBe('additionalOutputFormats');
  });

  it('does not expand inline schemas when a $ref is present', () => {
    const definitions = {
      'io.k8s.api.core.v1.PodSpec': {
        description: 'PodSpec',
        properties:  { nodeName: { type: 'string' } },
      },
    };
    const definition = {
      properties: {
        spec: {
          $ref:       '#/definitions/io.k8s.api.core.v1.PodSpec',
          properties: { extra: { type: 'string' } },
        },
      },
    };

    expandOpenAPIDefinition(definitions, definition, []);

    const spec = definition.properties.spec as any;

    // Should use the $ref expansion, not the inline properties
    expect(spec.$refName).toBe('io.k8s.api.core.v1.PodSpec');
    expect(spec.$$ref.properties.nodeName).toBeDefined();
  });

  it('extracts More Info links from descriptions', () => {
    const definitions = {};
    const definition = {
      properties: {
        field: {
          type:        'string',
          description: 'A field. More info: https://example.com/docs',
        },
      },
    };

    expandOpenAPIDefinition(definitions, definition, []);

    const field = definition.properties.field as any;

    expect(field.$moreInfo).toBe('https://example.com/docs');
    expect(field.description).not.toContain('More info');
  });

  it('handles definition with no properties gracefully', () => {
    expect(() => expandOpenAPIDefinition({}, {}, [])).not.toThrow();
    expect(() => expandOpenAPIDefinition({}, { properties: {} }, [])).not.toThrow();
    expect(() => expandOpenAPIDefinition({}, null, [])).not.toThrow();
  });

  it('deeply expands nested $ref chains', () => {
    const definitions = {
      'io.k8s.Meta': {
        description: 'Metadata',
        properties:  { name: { type: 'string' } },
      },
      'io.k8s.Spec': {
        description: 'Spec',
        properties:  { metadata: { $ref: '#/definitions/io.k8s.Meta' } },
      },
    };
    const definition = { properties: { spec: { $ref: '#/definitions/io.k8s.Spec' } } };

    expandOpenAPIDefinition(definitions, definition, []);

    const spec = definition.properties.spec as any;

    expect(spec.$$ref.properties.metadata.$$ref).toBeDefined();
    expect(spec.$$ref.properties.metadata.$$ref.properties.name.type).toBe('string');
    expect(spec.$$ref.properties.metadata.$breadcrumbs).toHaveLength(2);
  });
});
