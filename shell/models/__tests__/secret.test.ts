import Secret from '@shell/models/secret';
import { SECRET_TYPES as TYPES } from '@shell/config/secret';
import { UI_PROJECT_SECRET, UI_PROJECT_SECRET_COPY } from '@shell/config/labels-annotations';
import { MANAGEMENT } from '@shell/config/types';
import { STORE } from '@shell/store/store-types';

describe('class Secret', () => {
  describe('project Scoped Secrets', () => {
    const projectId = 'p-project';
    const clusterId = 'c-cluster';
    const projectName = 'My Project';
    const clusterName = 'My Cluster';

    const mockRootGetters = {
      isRancher:                      true,
      currentCluster:                 { id: clusterId },
      [`${ STORE.MANAGEMENT }/byId`]: (type: string, id: string) => {
        if (type === MANAGEMENT.CLUSTER && id === clusterId) {
          return { nameDisplay: clusterName };
        }
        if (type === MANAGEMENT.PROJECT && id === `${ clusterId }/${ projectId }`) {
          return { nameDisplay: projectName };
        }

        return undefined;
      }
    };

    it('should return clusterAndProjectLabel for a Source Project Secret', () => {
      const secret = new Secret({
        metadata: {
          namespace:   `${ clusterId }-${ projectId }`,
          labels:      { [UI_PROJECT_SECRET]: projectId },
          annotations: {}
        }
      });

      Object.defineProperty(secret, '$rootGetters', {
        get() {
          return mockRootGetters;
        }
      });

      expect(secret.clusterAndProjectLabel).toBe(`${ projectName } (${ clusterName })`);
    });

    it('should return clusterAndProjectLabel for a Copied Project Secret', () => {
      const secret = new Secret({
        metadata: {
          namespace:   'some-user-ns',
          labels:      { [UI_PROJECT_SECRET]: projectId },
          annotations: { [UI_PROJECT_SECRET_COPY]: 'true' }
        }
      });

      Object.defineProperty(secret, '$rootGetters', {
        get() {
          return mockRootGetters;
        }
      });

      expect(secret.clusterAndProjectLabel).toBe(`${ projectName } (${ clusterName })`);
    });

    it('should return empty string for a Regular Secret', () => {
      const secret = new Secret({
        metadata: {
          namespace: 'default',
          labels:    {}
        }
      });

      Object.defineProperty(secret, '$rootGetters', {
        get() {
          return mockRootGetters;
        }
      });

      expect(secret.clusterAndProjectLabel).toBe('');
    });

    it('should fallback to IDs if Cluster and Project resources are missing', () => {
      const secret = new Secret({
        metadata: {
          namespace:   `${ clusterId }-${ projectId }`,
          labels:      { [UI_PROJECT_SECRET]: projectId },
          annotations: {}
        }
      });

      const mockMissingRootGetters = {
        isRancher:                      true,
        currentCluster:                 { id: clusterId },
        [`${ STORE.MANAGEMENT }/byId`]: (type: string, id: string) => {
          return undefined;
        }
      };

      Object.defineProperty(secret, '$rootGetters', {
        get() {
          return mockMissingRootGetters;
        }
      });

      expect(secret.clusterAndProjectLabel).toBe(`${ projectId } (${ clusterId })`);
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
