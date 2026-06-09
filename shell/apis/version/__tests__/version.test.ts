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

  it('should delegate isRancherPrime to isRancherPrime()', () => {
    mockIsRancherPrime.mockReturnValue(true);

    expect(api.isRancherPrime).toStrictEqual(true);
    expect(mockIsRancherPrime).toHaveBeenCalledTimes(1);
  });

  it('should delegate version to getVersionData().Version', () => {
    mockGetVersionData.mockReturnValue({ Version: 'v2.8.0', GitCommit: 'abc' });

    expect(api.version).toStrictEqual('v2.8.0');
    expect(mockGetVersionData).toHaveBeenCalledTimes(1);
  });

  it('should delegate gitCommit to getVersionData().GitCommit', () => {
    mockGetVersionData.mockReturnValue({ Version: 'v2.8.0', GitCommit: 'abc1234' });

    expect(api.gitCommit).toStrictEqual('abc1234');
    expect(mockGetVersionData).toHaveBeenCalledTimes(1);
  });

  it('should delegate kubernetesVersion to getKubeVersionData().gitVersion', () => {
    mockGetKubeVersionData.mockReturnValue({ gitVersion: 'v1.25.10' });

    expect(api.kubernetesVersion).toStrictEqual('v1.25.10');
    expect(mockGetKubeVersionData).toHaveBeenCalledTimes(1);
  });

  it('should return empty string when kubeVersionData is undefined', () => {
    mockGetKubeVersionData.mockReturnValue(undefined);

    expect(api.kubernetesVersion).toStrictEqual('');
  });

  it('should return empty string when kubeVersionData has no gitVersion', () => {
    mockGetKubeVersionData.mockReturnValue({});

    expect(api.kubernetesVersion).toStrictEqual('');
  });
});
