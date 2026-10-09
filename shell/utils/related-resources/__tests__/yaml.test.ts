import jsyaml from 'js-yaml';
import { fromEditorYaml, toEditorYaml } from '@shell/utils/related-resources/yaml';

describe('utils: related-resources/yaml', () => {
  // a secret as steve sends it, with its kubernetes `type` as `_type`
  const steveSecret = () => ({
    id:         'ns/creds',
    type:       'secret',
    links:      { update: 'https://example.com/v1/secrets/ns/creds' },
    actions:    { some: 'action' },
    apiVersion: 'v1',
    kind:       'Secret',
    _type:      'Opaque',
    metadata:   {
      name:              'creds',
      namespace:         'ns',
      resourceVersion:   '7',
      uid:               'abc',
      generation:        2,
      creationTimestamp: '2026-01-01T00:00:00Z',
      managedFields:     [{ manager: 'kubectl' }],
      fields:            ['creds'],
      relationships:     [],
      state:             { name: 'active' },
    },
    data:   { password: 'cGFzc3dvcmQ=' },
    status: {
      conditions: [{
        type: 'Ready', status: 'True', error: false, transitioning: false
      }]
    },
  });

  describe('toEditorYaml', () => {
    const shown = (resource: any) => jsyaml.load(toEditorYaml(resource)) as any;

    it.each([null, undefined])('should return an empty string for %p', (resource) => {
      expect(toEditorYaml(resource)).toBe('');
    });

    it('should leave out the fields steve adds to the root of the resource', () => {
      const yaml = shown(steveSecret());

      expect(['id', 'links', 'actions'].filter((key) => key in yaml)).toStrictEqual([]);
    });

    // the store defines these as enumerable on a clone, which is what an edit page holds
    it.each(['__clone', '__rehydrate'])('should leave out `%s`, which the store sets on its models', (key) => {
      const yaml = shown({ ...steveSecret(), [key]: true });

      expect(yaml).not.toHaveProperty(key);
    });

    it.each(['fields', 'relationships', 'state', 'uid', 'generation', 'creationTimestamp', 'managedFields'])('should leave out `metadata.%s`', (key) => {
      expect(shown(steveSecret()).metadata).not.toHaveProperty(key);
    });

    it('should keep `metadata.resourceVersion`, so a save of the yaml fails when the resource changed since', () => {
      expect(shown(steveSecret()).metadata.resourceVersion).toBe('7');
    });

    it('should show the `_type` of the resource as `type`', () => {
      const yaml = shown(steveSecret());

      expect(yaml.type).toBe('Opaque');
      expect(yaml).not.toHaveProperty('_type');
    });

    it('should show no `type` for a resource without `_type`', () => {
      const { _type, ...configMap } = { ...steveSecret(), type: 'configmap' };

      expect(shown(configMap)).not.toHaveProperty('type');
    });

    it('should leave out `error` and `transitioning` of the status conditions', () => {
      expect(shown(steveSecret()).status.conditions).toStrictEqual([{ type: 'Ready', status: 'True' }]);
    });

    it('should keep the fields of the resource itself', () => {
      const yaml = shown(steveSecret());

      expect({
        apiVersion: yaml.apiVersion, kind: yaml.kind, name: yaml.metadata.name, namespace: yaml.metadata.namespace, data: yaml.data
      }).toStrictEqual({
        apiVersion: 'v1', kind: 'Secret', name: 'creds', namespace: 'ns', data: { password: 'cGFzc3dvcmQ=' }
      });
    });
  });

  describe('fromEditorYaml', () => {
    it('should take `id`, `type` and `links` from the resource', () => {
      const resource = steveSecret();
      const data = fromEditorYaml(resource, 'metadata:\n  name: creds\n');

      expect(data).toStrictEqual({
        metadata: { name: 'creds' }, id: 'ns/creds', type: 'secret', links: resource.links
      });
    });

    it('should not take `actions` from the resource', () => {
      expect(fromEditorYaml(steveSecret(), 'metadata:\n  name: creds\n')).not.toHaveProperty('actions');
    });

    it('should move a `type` in the yaml to `_type`', () => {
      const data = fromEditorYaml(steveSecret(), 'type: kubernetes.io/tls\n');

      expect({ type: data.type, _type: data._type }).toStrictEqual({ type: 'secret', _type: 'kubernetes.io/tls' });
    });

    it('should leave out the steve fields the resource does not have', () => {
      expect(fromEditorYaml({ type: 'configmap' }, 'data:\n  key: value\n')).toStrictEqual({ data: { key: 'value' }, type: 'configmap' });
    });

    it('should use the steve fields of the resource over the same fields in the yaml', () => {
      const data = fromEditorYaml(steveSecret(), 'id: ns/other\nlinks:\n  update: https://example.com/other\n');

      expect({ id: data.id, links: data.links }).toStrictEqual({ id: 'ns/creds', links: steveSecret().links });
    });

    it.each(['', 'null\n'])('should give only the steve fields for the empty yaml %p', (yaml) => {
      expect(fromEditorYaml({ id: 'ns/a', type: 'configmap' }, yaml)).toStrictEqual({ id: 'ns/a', type: 'configmap' });
    });

    it('should throw for yaml that can not be parsed', () => {
      expect(() => fromEditorYaml(steveSecret(), 'metadata: [unclosed\n')).toThrow(jsyaml.YAMLException);
    });

    it('should give back the resource it was made from, apart from the fields the yaml leaves out', () => {
      const resource = steveSecret();
      const { actions, ...expected } = resource;

      delete (expected.metadata as any).fields;
      delete (expected.metadata as any).relationships;
      delete (expected.metadata as any).state;
      delete (expected.metadata as any).uid;
      delete (expected.metadata as any).generation;
      delete (expected.metadata as any).creationTimestamp;
      delete (expected.metadata as any).managedFields;
      expected.status.conditions = [{ type: 'Ready', status: 'True' }] as any;

      expect(fromEditorYaml(resource, toEditorYaml(resource))).toStrictEqual(expected);
    });
  });
});
