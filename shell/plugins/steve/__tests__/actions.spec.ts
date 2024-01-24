import _actions from '@shell/plugins/steve/actions';

const { cleanForDownload } = _actions;

describe('steve: actions', () => {
  describe('steve > actions > cleanForDownload', () => {
    it('should do nothing if the yaml is not passed', () => {
      const r = cleanForDownload({});

      expect(r).toBeUndefined();
    });
    it('should remove all root keys it expects to remove', () => {
      const expectedYamlStr = `apiVersion: v1
kind: ConfigMap
metadata:
  name: my-configmap
`;
      const yamlStr = `
id: test_id
links: 
  view: https://example.com
type: test_type
actions:
  remove: https://example.com
${ expectedYamlStr }
`;
      const cleanedYamlStr = cleanForDownload({}, yamlStr);

      expect(cleanedYamlStr).toBe(expectedYamlStr);
    });
    it('should remove all root keys it expects to remove, except the type key for the secret resource', () => {
      const expectedYamlStr = `apiVersion: v1
kind: Secret
metadata:
  name: my-secret
type: Opaque
`;
      const yamlStr = `
id: test_id
links: 
  view: https://example.com
actions:
  remove: https://example.com
${ expectedYamlStr }
`;
      const cleanedYamlStr = cleanForDownload({}, yamlStr);

      expect(cleanedYamlStr).toBe(expectedYamlStr);
    });
    it('should remove all metadata keys it expects to remove', () => {
      const expectedYamlStr = `apiVersion: v1
kind: ConfigMap
metadata:
  name: my-configmap
`;
      const yamlStr = `apiVersion: v1
kind: ConfigMap
metadata:
  name: my-configmap
  fields: 
    - kube-root-ca.crt
    - 1
    - 7d23h
  relationships:
    - rel: 'owner'
  state: 'active'
`;
      const cleanedYamlStr = cleanForDownload({}, yamlStr);

      expect(cleanedYamlStr).toBe(expectedYamlStr);
    });
    it('should remove all condition keys it expects to remove', () => {
      const expectedYamlStr = `apiVersion: v1
kind: ConfigMap
metadata:
  name: my-configmap
status:
  conditions:
    - {}
    - {}
    - message: message
`;
      const yamlStr = `apiVersion: v1
kind: ConfigMap
metadata:
  name: my-configmap
status:
  conditions:
    - error: 'error'
    - transitioning: false
    - message: message
`;
      const cleanedYamlStr = cleanForDownload({}, yamlStr);

      expect(cleanedYamlStr).toBe(expectedYamlStr);
    });
  });
});
