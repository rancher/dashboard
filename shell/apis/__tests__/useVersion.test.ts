import { describe, it, expect, beforeEach } from '@jest/globals';
import { inject } from 'vue';
import { useVersion } from '@shell/apis';

jest.mock('vue', () => ({
  ...jest.requireActual('vue'),
  inject: jest.fn(),
}));

const mockInject = inject as jest.Mock;

describe('useVersion', () => {
  beforeEach(() => {
    mockInject.mockClear();
  });

  describe('when $version API is available', () => {
    it('should return the provided VersionApi', () => {
      const versionApi = {
        rancher: {
          isPrime: true, version: 'v2.9.0', gitCommit: 'abc1234'
        },
        kube: { version: 'v1.28.0' },
      };

      mockInject.mockImplementation((key: string) => {
        if (key === '$version') {
          return versionApi;
        }

        return null;
      });

      const result = useVersion();

      expect(result).toBe(versionApi);
      expect(mockInject).toHaveBeenCalledWith('$version', null);
    });
  });

  describe('when only $shell API is available (2.14+ dashboards)', () => {
    const shellApi = {
      system: {
        isRancherPrime:    true,
        rancherVersion:    'v2.14.0',
        gitCommit:         'def5678',
        kubernetesVersion: 'v1.27.5',
      }
    };

    beforeEach(() => {
      mockInject.mockImplementation((key: string) => {
        if (key === '$version') {
          return null;
        }
        if (key === '$shell') {
          return shellApi;
        }

        return null;
      });
    });

    it('should return an adapter that maps SystemApi properties to the nested shape', () => {
      const result = useVersion();

      expect(result.rancher.isPrime).toStrictEqual(true);
      expect(result.rancher.version).toStrictEqual('v2.14.0');
      expect(result.rancher.gitCommit).toStrictEqual('def5678');
      expect(result.kube.version).toStrictEqual('v1.27.5');
    });

    it('should reflect changes from the underlying SystemApi', () => {
      const result = useVersion();

      shellApi.system.isRancherPrime = false;
      expect(result.rancher.isPrime).toStrictEqual(false);

      shellApi.system.rancherVersion = 'v2.14.1';
      expect(result.rancher.version).toStrictEqual('v2.14.1');
    });
  });

  describe('when neither API is available (pre-2.14 dashboards)', () => {
    beforeEach(() => {
      mockInject.mockReturnValue(null);
    });

    it('should return safe defaults', () => {
      const result = useVersion();

      expect(result.rancher.isPrime).toStrictEqual(false);
      expect(result.rancher.version).toStrictEqual('');
      expect(result.rancher.gitCommit).toStrictEqual('');
      expect(result.kube.version).toStrictEqual('');
    });
  });

  describe('when $shell is available but system is missing', () => {
    beforeEach(() => {
      mockInject.mockImplementation((key: string) => {
        if (key === '$shell') {
          return { system: null };
        }

        return null;
      });
    });

    it('should fall back to safe defaults', () => {
      const result = useVersion();

      expect(result.rancher.isPrime).toStrictEqual(false);
      expect(result.rancher.version).toStrictEqual('');
    });
  });

  it('should never throw regardless of inject state', () => {
    mockInject.mockReturnValue(null);

    expect(() => useVersion()).not.toThrow();
  });
});
