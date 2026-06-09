import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  isRancherPrime,
  getVersionData,
  setVersionData,
  getKubeVersionData,
  setKubeVersionData,
  CURRENT_RANCHER_VERSION
} from '@shell/config/version';

describe('shell/config/version', () => {
  beforeEach(() => {
    setVersionData({
      Version:      '',
      RancherPrime: 'false',
      GitCommit:    '',
    });
    setKubeVersionData({});
  });

  describe('isRancherPrime', () => {
    it.each([
      ['false', false],
      ['true', true],
      ['True', true],
      ['TRUE', true],
      ['FALSE', false],
    ])('should return %s for RancherPrime value "%s"', (value: string, expected: boolean) => {
      setVersionData({
        Version: '', RancherPrime: value, GitCommit: ''
      });

      expect(isRancherPrime()).toStrictEqual(expected);
    });

    it('should return false by default', () => {
      expect(isRancherPrime()).toStrictEqual(false);
    });
  });

  describe('getVersionData', () => {
    it('should return default values initially', () => {
      const data = getVersionData();

      expect(data.Version).toStrictEqual('');
      expect(data.RancherPrime).toStrictEqual('false');
      expect(data.GitCommit).toStrictEqual('');
    });

    it('should return updated values after setVersionData', () => {
      setVersionData({
        Version: 'v2.8.0', RancherPrime: 'true', GitCommit: 'abc1234'
      });

      const data = getVersionData();

      expect(data.Version).toStrictEqual('v2.8.0');
      expect(data.RancherPrime).toStrictEqual('true');
      expect(data.GitCommit).toStrictEqual('abc1234');
    });
  });

  describe('setVersionData', () => {
    it('should maintain the same object reference after update', () => {
      const ref1 = getVersionData();

      setVersionData({
        Version: 'v2.9.0', RancherPrime: 'true', GitCommit: 'def5678'
      });

      const ref2 = getVersionData();

      expect(ref2).toBe(ref1);
    });

    it('should deep clone the input to prevent external mutation', () => {
      const input = {
        Version: 'v2.8.0', RancherPrime: 'true', GitCommit: 'abc'
      };

      setVersionData(input);
      input.Version = 'mutated';

      expect(getVersionData().Version).toStrictEqual('v2.8.0');
    });

    it('should remove keys that are no longer present in the new data', () => {
      setVersionData({
        Version: 'v2.8.0', RancherPrime: 'true', GitCommit: 'abc', ExtraKey: 'extra'
      } as any);

      expect((getVersionData() as any).ExtraKey).toStrictEqual('extra');

      setVersionData({
        Version: 'v2.9.0', RancherPrime: 'false', GitCommit: 'def'
      });

      expect((getVersionData() as any).ExtraKey).toBeUndefined();
    });
  });

  describe('getKubeVersionData / setKubeVersionData', () => {
    it('should return empty object initially', () => {
      expect(getKubeVersionData()).toStrictEqual({});
    });

    it('should return updated kube version data', () => {
      setKubeVersionData({ gitVersion: 'v1.25.10' });

      expect(getKubeVersionData().gitVersion).toStrictEqual('v1.25.10');
    });

    it('should maintain the same object reference after update', () => {
      const ref1 = getKubeVersionData();

      setKubeVersionData({ gitVersion: 'v1.25.10' });

      const ref2 = getKubeVersionData();

      expect(ref2).toBe(ref1);
    });

    it('should deep clone the input to prevent external mutation', () => {
      const input = { gitVersion: 'v1.25.10' };

      setKubeVersionData(input);
      input.gitVersion = 'mutated';

      expect(getKubeVersionData().gitVersion).toStrictEqual('v1.25.10');
    });
  });

  describe('CURRENT_RANCHER_VERSION', () => {
    it('should be defined', () => {
      expect(CURRENT_RANCHER_VERSION).toStrictEqual('2.13');
    });
  });
});
