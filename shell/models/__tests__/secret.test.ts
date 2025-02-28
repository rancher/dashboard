import Secret from '@shell/models/secret';
import { SECRET_TYPES as TYPES } from '@shell/config/secret';

describe('class Secret', () => {
  describe('cleanForDownload', () => {
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

  describe('supportsSshKnownHosts', () => {
    it.each([
      [
        false,
        'type is not SSH',
        'generic',
        { known_hosts: 'S05PV05fSE9TVFM=' },
      ],
      [
        false,
        'missing known_hosts',
        TYPES.SSH,
        {},
      ],
      [
        false,
        'data is null',
        TYPES.SSH,
        null,
      ],
      [
        true,
        'type is SSH key and known_hosts exists',
        TYPES.SSH,
        { known_hosts: 'S05PV05fSE9TVFM=' },
      ],
    ])('is %p if %p', (
      supported,
      descr,
      _type,
      data
    ) => {
      const secret = new Secret({ _type, data });

      const result = secret.supportsSshKnownHosts;

      expect(result).toBe(supported);
    });
  });
});
