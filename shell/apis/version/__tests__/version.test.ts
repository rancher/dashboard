import {
  describe, it, expect, jest, beforeEach
} from '@jest/globals';
import { VersionApiImpl } from '../index';
import { getVersionData, getKubeVersionData, isRancherPrime } from '@shell/config/version';

jest.mock('@shell/config/version', () => ({
  getVersionData:     jest.fn(),
  getKubeVersionData: jest.fn(),
  isRancherPrime:     jest.fn(),
}));

const mockGetVersionData = getVersionData as jest.Mock;
const mockGetKubeVersionData = getKubeVersionData as jest.Mock;
const mockIsRancherPrime = isRancherPrime as jest.Mock;

describe('versionApiImpl', () => {
  let api: VersionApiImpl;

  beforeEach(() => {
    mockGetVersionData.mockClear();
    mockGetKubeVersionData.mockClear();
    mockIsRancherPrime.mockClear();

    api = new VersionApiImpl();
  });

  it('should delegate rancher.isPrime to isRancherPrime()', () => {
    mockIsRancherPrime.mockReturnValue(true);

    expect(api.rancher.isPrime).toStrictEqual(true);
    expect(mockIsRancherPrime).toHaveBeenCalledTimes(1);
  });

  it('should delegate rancher.version to getVersionData().Version', () => {
    mockGetVersionData.mockReturnValue({ Version: 'v2.8.0', GitCommit: 'abc' });

    expect(api.rancher.version).toStrictEqual('v2.8.0');
    expect(mockGetVersionData).toHaveBeenCalledTimes(1);
  });

  it('should delegate rancher.gitCommit to getVersionData().GitCommit', () => {
    mockGetVersionData.mockReturnValue({ Version: 'v2.8.0', GitCommit: 'abc1234' });

    expect(api.rancher.gitCommit).toStrictEqual('abc1234');
    expect(mockGetVersionData).toHaveBeenCalledTimes(1);
  });

  it('should delegate kube.version to getKubeVersionData().gitVersion', () => {
    mockGetKubeVersionData.mockReturnValue({ gitVersion: 'v1.25.10' });

    expect(api.kube.version).toStrictEqual('v1.25.10');
    expect(mockGetKubeVersionData).toHaveBeenCalledTimes(1);
  });

  it('should return empty string for kube.version when kubeVersionData is undefined', () => {
    mockGetKubeVersionData.mockReturnValue(undefined);

    expect(api.kube.version).toStrictEqual('');
  });

  it('should return empty string for kube.version when kubeVersionData has no gitVersion', () => {
    mockGetKubeVersionData.mockReturnValue({});

    expect(api.kube.version).toStrictEqual('');
  });
});
