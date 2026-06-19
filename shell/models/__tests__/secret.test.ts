import Secret from '@shell/models/secret';
import { SECRET_TYPES as TYPES, GITHUB_APP_SECRET_KEYS } from '@shell/config/secret';
import { VIRTUAL_TYPES } from '@shell/config/types';
import { UI_PROJECT_SECRET } from '@shell/config/labels-annotations';
import { base64Encode } from '@shell/utils/crypto';

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

  describe('isGithubApp', () => {
    const githubAppData = {
      github_app_id:              'MTI=',
      github_app_installation_id: 'MzQ=',
      github_app_private_key:     'a2V5',
    };

    it.each([
      [
        false,
        'type is not Opaque',
        TYPES.SSH,
        githubAppData,
      ],
      [
        false,
        'data is null',
        TYPES.OPAQUE,
        null,
      ],
      [
        false,
        'Opaque but missing a GitHub App key',
        TYPES.OPAQUE,
        { github_app_id: 'MTI=', github_app_installation_id: 'MzQ=' },
      ],
      [
        true,
        'Opaque with all GitHub App keys',
        TYPES.OPAQUE,
        githubAppData,
      ],
    ])('is %p if %p', (
      expected,
      descr,
      _type,
      data
    ) => {
      const secret = new Secret({ _type, data });

      expect(secret.isGithubApp).toBe(expected);
    });
  });

  describe('GitHub App display', () => {
    const githubAppData = {
      [GITHUB_APP_SECRET_KEYS.APP_ID]:          base64Encode('12345'),
      [GITHUB_APP_SECRET_KEYS.INSTALLATION_ID]: base64Encode('67890'),
      [GITHUB_APP_SECRET_KEYS.PRIVATE_KEY]:     base64Encode('a-private-key'),
    };

    const ctx = { rootGetters: { 'i18n/withFallback': (_key: string, _args: any, fallback: string) => fallback } };

    it('dataPreview should show the decoded App ID and Installation ID', () => {
      const secret = new Secret({ _type: TYPES.OPAQUE, data: githubAppData }, ctx);

      expect(secret.dataPreview).toBe('12345 / 67890');
    });

    it('subTypeDisplay should resolve to the GitHub App label', () => {
      const secret = new Secret({ _type: TYPES.OPAQUE, data: githubAppData }, ctx);

      expect(secret.subTypeDisplay).toBe('GitHub App');
    });
  });
});
