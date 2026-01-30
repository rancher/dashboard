import Secret from '@shell/models/secret';
import { SECRET_TYPES as TYPES } from '@shell/config/secret';
import { VIRTUAL_TYPES } from '@shell/config/types';
import { UI_PROJECT_SECRET } from '@shell/config/labels-annotations';

describe('class Secret', () => {
  describe('detailLocation', () => {
    it('should return correct route for project scoped secret', () => {
      const secret = new Secret({
        metadata: {
          namespace: 'c-cluster-p-project',
          labels:    { [UI_PROJECT_SECRET]: 'p-project' }
        },
        id: 'c-cluster-p-project/my-secret'
      });

      // Mock $rootGetters
      Object.defineProperty(secret, '$rootGetters', {
        value: {
          productId: 'explorer',
          clusterId: 'c-cluster',
          isRancher: true
        }
      });

      const location = secret.detailLocation;

      expect(location.name).toBe(`c-cluster-product-${ VIRTUAL_TYPES.PROJECT_SECRETS }-namespace-id`);
      expect(location.params.resource).toBe(VIRTUAL_TYPES.PROJECT_SECRETS);
      expect(location.params.product).toBe('explorer');
      expect(location.params.cluster).toBe('c-cluster');
      expect(location.params.namespace).toBe('c-cluster-p-project');
      expect(location.params.id).toBe('my-secret');
    });

    it('should return default detailLocation for non-project scoped secret', () => {
      const secret = new Secret({
        metadata: { namespace: 'default' },
        id:       'default/my-secret'
      });

      // Mock $rootGetters
      Object.defineProperty(secret, '$rootGetters', {
        value: {
          productId: 'explorer',
          clusterId: 'c-cluster',
          isRancher: true
        }
      });

      const expectedLocation = { name: 'some-route' };

      // Mock _detailLocation (the parent class implementation or default behavior)
      Object.defineProperty(secret, '_detailLocation', { value: expectedLocation });

      expect(secret.detailLocation).toBe(expectedLocation);
    });
  });

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
