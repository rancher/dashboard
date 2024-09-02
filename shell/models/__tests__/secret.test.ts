import Secret from '@shell/models/secret';

describe('class Secret', () => {
  it('should contains the type attribute if cleanForDownload', async() => {
    const secret = new Secret({});
    const yaml = `apiVersion: v1
kind: Secret
metadata:
  name: my-secret
type: Opaque
`;
    const cleanYaml = await secret.cleanForDownload(yaml);

    expect(cleanYaml).toBe(yaml);
  });

  it('should remove id, links and actions keys if cleanForDownload', async() => {
    const secret = new Secret({});
    const expectedYamlStr = `apiVersion: v1
kind: Secret
metadata:
  name: my-secret
  namespace: default
type: Opaque
`;
    const part = `id: test_id
links:
  view: https://example.com
actions:
  remove: https://example.com`;
    const yaml = `${ expectedYamlStr }
${ part }`;
    const cleanYaml = await secret.cleanForDownload(yaml);

    expect(cleanYaml).toBe(expectedYamlStr);
  });
});
