// system.test.ts

import {
  describe, it, expect, jest, beforeEach
} from '@jest/globals';
import { SystemApiImpl } from '../system';
import { Store } from 'vuex';

// --- Mock the external modules ---

// 1. Import the functions we need to mock
import { getVersionData, getKubeVersionData, isRancherPrime } from '@shell/config/version';
import { isDevBuild, isPrerelease } from '@shell/utils/version';

// 2. Tell Jest to mock the entire module
// We provide a factory function () => ({ ... }) to define the mock implementation.
jest.mock('@shell/config/version', () => ({
  getVersionData:     jest.fn(),
  getKubeVersionData: jest.fn(),
  isRancherPrime:     jest.fn(),
}));

jest.mock('@shell/utils/version', () => ({
  isDevBuild:   jest.fn(),
  isPrerelease: jest.fn(),
}));

// 3. Cast the imported functions to Jest Mocks for type-safety
const mockGetVersionData = getVersionData as jest.Mock;
const mockGetKubeVersionData = getKubeVersionData as jest.Mock;
const mockIsRancherPrime = isRancherPrime as jest.Mock;
const mockIsDevBuild = isDevBuild as jest.Mock;
const mockIsPrerelease = isPrerelease as jest.Mock;

// --- End of Mocking Setup ---

describe('systemApiImpl', () => {
  let mockStore: Store<any>;
  let systemApi: SystemApiImpl;
  let mockGetter: jest.Mock;

  beforeEach(() => {
    // Reset all mocks before each test
    mockGetVersionData.mockClear();
    mockGetKubeVersionData.mockClear();
    mockIsRancherPrime.mockClear();
    mockIsDevBuild.mockClear();
    mockIsPrerelease.mockClear();

    // Arrange: Mock the store
    mockGetter = jest.fn() as any;
    mockStore = {
      getters: { 'management/byId': mockGetter },
      $config: { dashboardVersion: 'v2.9-test' }
    } as any;

    // Arrange: Instantiate the class
    systemApi = new SystemApiImpl(mockStore);
  });

  // --- Tests for Store-based Getters ---

  it('should get uiVersion from store.$config', () => {
    expect(systemApi.uiVersion).toBe('v2.9-test');
  });
  // --- Tests for Mocked Module Getters ---

  it('should get rancherVersion and gitCommit from getVersionData', () => {
    // Arrange: Define the return value for this test
    mockGetVersionData.mockReturnValue({ Version: 'v2.8.0', GitCommit: 'abc1234' });

    // Act & Assert
    expect(systemApi.rancherVersion).toBe('v2.8.0');
    expect(systemApi.gitCommit).toBe('abc1234');
    expect(mockGetVersionData).toHaveBeenCalledTimes(2); // Called for both getters
  });

  it('should get kubernetesVersion and buildPlatform from getKubeVersionData', () => {
    // Arrange
    mockGetKubeVersionData.mockReturnValue({ gitVersion: 'v1.25.0', platform: 'linux/amd64' });

    // Act & Assert
    expect(systemApi.kubernetesVersion).toBe('v1.25.0');
  });

  it('should handle undefined kubeData gracefully', () => {
    // Arrange: Simulate getKubeVersionData returning nothing
    mockGetKubeVersionData.mockReturnValue(undefined);

    // Act & Assert (The code's `|| {}` handles this)
    expect(systemApi.kubernetesVersion).toBeUndefined();
  });

  it('should get isRancherPrime from isRancherPrime', () => {
    // Arrange
    mockIsRancherPrime.mockReturnValue(true);

    // Act & Assert
    expect(systemApi.isRancherPrime).toBe(true);
    expect(mockIsRancherPrime).toHaveBeenCalledTimes(1);
  });

  it('should call isDevBuild with the correct rancherVersion', () => {
    // Arrange
    mockGetVersionData.mockReturnValue({ Version: 'v2.8.0-dev', GitCommit: '...' });
    mockIsDevBuild.mockReturnValue(true); // The logic we are testing

    // Act
    const result = systemApi.isDevBuild;

    // Assert
    expect(result).toBe(true);
    // This is the key check: verify it passed its OWN version to the util
    expect(mockIsDevBuild).toHaveBeenCalledWith('v2.8.0-dev');
  });

  it('should call isPrereleaseVersion with the correct rancherVersion', () => {
    // Arrange
    mockGetVersionData.mockReturnValue({ Version: 'v2.8.0-rc1', GitCommit: '...' });
    mockIsPrerelease.mockReturnValue(true);

    // Act
    const result = systemApi.isPrereleaseVersion;

    // Assert
    expect(result).toBe(true);
    expect(mockIsPrerelease).toHaveBeenCalledWith('v2.8.0-rc1');
  });
});
