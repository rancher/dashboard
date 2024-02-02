import { steveCleanForDownload } from '@shell/plugins/steve/resource-utils';

describe('steve: ressource-utils', () => {
  it('should do nothing if the yaml is not passed', () => {
    const r = steveCleanForDownload();

    expect(r).toBeUndefined();
  });
  it('should remove all default rootKeys', () => {
    const expectedYamlStr = `apiVersion: v1
kind: ConfigMap
metadata:
  name: my-configmap
`;
    const yamlStr = `
id: test_id
links: 
  view: https://example.com2
type: test_type
actions:
  remove: https://example.com
${ expectedYamlStr }
`;
    const cleanedYamlStr = steveCleanForDownload(yamlStr);

    expect(cleanedYamlStr).toBe(expectedYamlStr);
  });
  it('should remove all the specified root keys', () => {
    const part = `apiVersion: v1
kind: Secret
metadata:
  name: my-secret`;

    const rootKeyToYamlStringMap = {
      id:    'id: test_id',
      links: `links:
  view: https://example.com`,
      actions: `actions:
  remove: https://example.com`,
      type: 'type: Opaque'
    };

    const entries = Object.entries(rootKeyToYamlStringMap);
    const yamlStr = `${ part }
${ entries.map(([_, str]) => str).join('\n') }`;

    entries.forEach(([key, str]) => {
      const expectedYamlStr = `${ part }
${ entries.filter(([k]) => k !== key).map(([_, str]) => str).join('\n') }\n`;
      const cleanedYamlStr = steveCleanForDownload(yamlStr, { rootKeys: [key] });

      expect(cleanedYamlStr).toBe(expectedYamlStr);
    });
  });
  it('should remove all default metadata keys', () => {
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
    const cleanedYamlStr = steveCleanForDownload(yamlStr);

    expect(cleanedYamlStr).toBe(expectedYamlStr);
  });

  it('should remove all the specified metadata keys', () => {
    const part = `apiVersion: v1
kind: ConfigMap
metadata:
  name: my-configmap`;

    const metadataKeyToYamlStringMap = {
      fields:
`  fields:
    - kube-root-ca.crt
    - 1
    - 7d23h`,
      relationships:
`  relationships:
    - rel: owner`,
      state: `  state: active`
    };

    const entries = Object.entries(metadataKeyToYamlStringMap);
    const yamlStr = `${ part }
${ entries.map(([_, str]) => str).join('\n') }`;

    entries.forEach(([key, str]) => {
      const expectedYamlStr = `${ part }
${ entries.filter(([k]) => k !== key).map(([_, str]) => str).join('\n') }\n`;
      const cleanedYamlStr = steveCleanForDownload(yamlStr, { metadataKeys: [key] });

      expect(cleanedYamlStr).toBe(expectedYamlStr);
    });
  });
  it('should remove all defalut condition keys', () => {
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
    const cleanedYamlStr = steveCleanForDownload(yamlStr);

    expect(cleanedYamlStr).toBe(expectedYamlStr);
  });
  it('should remove all the specified condition keys', () => {
    const part = `apiVersion: v1
kind: ConfigMap
metadata:
  name: my-configmap
status:
  conditions:
    - message: message`;

    const conditionKeyToYamlStringMap = {
      error:         '    - error: error',
      transitioning: '    - transitioning: false'
    };

    const entries = Object.entries(conditionKeyToYamlStringMap);
    const yamlStr = `${ part }
${ entries.map(([_, str]) => str).join('\n') }`;

    entries.forEach(([key, str]) => {
      const expectedYamlStr = `${ part }
${ entries.map(([k, str]) => k === key ? '    - {}' : str).join('\n') }\n`;
      const cleanedYamlStr = steveCleanForDownload(yamlStr, { conditionKeys: [key] });

      expect(cleanedYamlStr).toBe(expectedYamlStr);
    });
  });
});
