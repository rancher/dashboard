import { processReleaseVersion } from '../new-release';
import { NotificationLevel } from '@shell/types/notifications';
import { READ_NEW_RELEASE } from '@shell/store/prefs';
import { Context, VersionInfo } from '../types';
import * as util from '../util'; // Import util to mock removeMatchingNotifications
import semver from 'semver';

describe('processReleaseVersion', () => {
  let mockContext: Context;
  let mockContextPrime: Context;
  let mockDispatch: jest.Mock;
  let mockGetters: any;
  let mockLogger: any;
  let mockRemoveMatchingNotifications: jest.SpyInstance;

  beforeEach(() => {
    mockDispatch = jest.fn();
    mockGetters = {
      'prefs/get': jest.fn(),
      'i18n/t':    jest.fn((key: string, params?: any) => {
        // Simple mock for i18n/t to return predictable strings
        const { version, version1, version2 } = params || {};

        if (key === 'dynamicContent.newRelease.title') return `A new Rancher release is available`;
        if (key === 'dynamicContent.newRelease.message') return `Rancher ${ version } has been released`;
        if (key === 'dynamicContent.newRelease.moreInfo') return `More Info`;
        if (key === 'dynamicContent.multipleNewReleases.title') return 'New Rancher releases are available';
        if (key === 'dynamicContent.multipleNewReleases.message') return `Message for ${ version1 } and ${ version2 }`;
        if (key === 'dynamicContent.multipleNewReleases.moreInfo') return `More Info for ${ version }`;

        return key;
      }),
    };
    mockLogger = {
      info:  jest.fn(),
      debug: jest.fn(),
      error: jest.fn(),
    };

    mockContext = {
      dispatch: mockDispatch,
      getters:  mockGetters,
      axios:    {},
      logger:   mockLogger,
      isAdmin:  true,
      config:   {
        enabled:      true,
        debug:        false,
        log:          false,
        endpoint:     '',
        prime:        false,
        distribution: 'community',
      },
      settings: { suseExtensions: [] },
    };

    mockContextPrime = {
      dispatch: mockDispatch,
      getters:  mockGetters,
      axios:    {},
      logger:   mockLogger,
      isAdmin:  true,
      config:   {
        enabled:      true,
        debug:        false,
        log:          false,
        endpoint:     '',
        prime:        true,
        distribution: 'prime',
      },
      settings: { suseExtensions: [] },
    };

    // Mock the utility function. Default: notification does not exist, so add it.
    mockRemoveMatchingNotifications = jest.spyOn(util, 'removeMatchingNotifications')
      .mockResolvedValue(false);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should return early if releaseInfo is null/undefined or empty', async() => {
    const versionInfo: VersionInfo = { version: semver.coerce('2.12.0')!, isPrime: false };

    await processReleaseVersion(mockContext, null as any, versionInfo);
    expect(mockDispatch).not.toHaveBeenCalled();
    expect(mockLogger.info).not.toHaveBeenCalled();

    await processReleaseVersion(mockContext, [], versionInfo);
    expect(mockDispatch).not.toHaveBeenCalled();
    expect(mockLogger.info).not.toHaveBeenCalled();
  });

  it('should return early if versionInfo is null/undefined or version is missing', async() => {
    const releaseInfo = [{ name: '2.12.1' }];

    await processReleaseVersion(mockContext, releaseInfo, null as any);
    expect(mockDispatch).not.toHaveBeenCalled();
    expect(mockLogger.info).not.toHaveBeenCalled();

    await processReleaseVersion(mockContext, releaseInfo, { version: null as any, isPrime: false });
    expect(mockDispatch).not.toHaveBeenCalled();
    expect(mockLogger.info).not.toHaveBeenCalled();
  });

  it('should not add notification if no newer release exists', async() => {
    const releaseInfo = [{ name: '2.12.0' }, { name: '2.11.0' }];
    const versionInfo: VersionInfo = { version: semver.coerce('2.12.0')!, isPrime: false };

    await processReleaseVersion(mockContext, releaseInfo, versionInfo);

    expect(mockLogger.info).not.toHaveBeenCalledWith(expect.stringContaining('Found a newer release'));
    expect(mockDispatch).not.toHaveBeenCalled();
  });

  it('should add a single new release notification for a newer patch version', async() => {
    const releaseInfo = [{ name: '2.12.1' }, { name: '2.12.0' }, { name: '2.11.0' }];
    const versionInfo: VersionInfo = { version: semver.coerce('2.12.0')!, isPrime: false };

    await processReleaseVersion(mockContext, releaseInfo, versionInfo);

    expect(mockLogger.info).toHaveBeenCalledWith('Found a newer release: 2.12.1');
    expect(mockLogger.info).not.toHaveBeenCalledWith(expect.stringContaining('Also found a newer patch release')); // Because newer and newerPatch are the same
    expect(mockDispatch).toHaveBeenCalledTimes(1);
    expect(mockDispatch).toHaveBeenCalledWith('notifications/add', {
      id:         'new-release-2.12.1',
      level:      NotificationLevel.Announcement,
      title:      'A new Rancher release is available',
      message:    'Rancher 2.12.1 has been released',
      preference: {
        key:   READ_NEW_RELEASE,
        value: '2.12.1',
      },
      primaryAction: {
        label:  'More Info',
        target: 'https://github.com/rancher/rancher/releases/tag/v2.12.1',
      },
    });
    expect(mockRemoveMatchingNotifications).toHaveBeenCalledWith(mockContext, 'new-release-', '2.12.1');
  });

  it('should add a single new release notification for a newer major/minor version (no patch)', async() => {
    const releaseInfo = [{ name: '2.13.0' }, { name: '2.12.0' }];
    const versionInfo: VersionInfo = { version: semver.coerce('2.12.0')!, isPrime: false };

    await processReleaseVersion(mockContext, releaseInfo, versionInfo);

    expect(mockLogger.info).toHaveBeenCalledWith('Found a newer release: 2.13.0');
    expect(mockLogger.info).not.toHaveBeenCalledWith(expect.stringContaining('Also found a newer patch release'));
    expect(mockDispatch).toHaveBeenCalledTimes(1);
    expect(mockDispatch).toHaveBeenCalledWith('notifications/add', {
      id:         'new-release-2.13.0',
      level:      NotificationLevel.Announcement,
      title:      'A new Rancher release is available',
      message:    'Rancher 2.13.0 has been released',
      preference: {
        key:   READ_NEW_RELEASE,
        value: '2.13.0',
      },
      primaryAction: {
        label:  'More Info',
        target: 'https://github.com/rancher/rancher/releases/tag/v2.13.0',
      },
    });
    expect(mockRemoveMatchingNotifications).toHaveBeenCalledWith(mockContext, 'new-release-', '2.13.0');
  });

  it('should add a single new release notification for a newer major/minor version (no patch) (Prime)', async() => {
    const releaseInfo = [{ name: '2.13.0' }, { name: '2.12.0' }];
    const versionInfo: VersionInfo = { version: semver.coerce('2.12.0')!, isPrime: true };

    await processReleaseVersion(mockContextPrime, releaseInfo, versionInfo);

    expect(mockLogger.info).toHaveBeenCalledWith('Found a newer release: 2.13.0');
    expect(mockLogger.info).not.toHaveBeenCalledWith(expect.stringContaining('Also found a newer patch release'));
    expect(mockDispatch).toHaveBeenCalledTimes(1);
    expect(mockDispatch).toHaveBeenCalledWith('notifications/add', {
      id:         'new-release-2.13.0',
      level:      NotificationLevel.Announcement,
      title:      'A new Rancher release is available',
      message:    'Rancher 2.13.0 has been released',
      preference: {
        key:   READ_NEW_RELEASE,
        value: '2.13.0',
      },
      primaryAction: {
        label:  'More Info',
        target: 'https://documentation.suse.com/cloudnative/rancher-manager/v2.13/en/release-notes/v2.13.0.html',
      },
    });
    expect(mockRemoveMatchingNotifications).toHaveBeenCalledWith(mockContextPrime, 'new-release-', '2.13.0');
  });

  it('should add a multiple new releases notification when both newer patch and newer major/minor exist', async() => {
    const releaseInfo = [{ name: '2.13.0' }, { name: '2.12.1' }, { name: '2.12.0' }];
    const versionInfo: VersionInfo = { version: semver.coerce('2.12.0')!, isPrime: false };

    await processReleaseVersion(mockContext, releaseInfo, versionInfo);

    expect(mockLogger.info).toHaveBeenCalledWith('Found a newer release: 2.13.0');
    expect(mockLogger.info).toHaveBeenCalledWith('Also found a newer patch release: 2.12.1');
    expect(mockDispatch).toHaveBeenCalledTimes(1);
    expect(mockDispatch).toHaveBeenCalledWith('notifications/add', {
      id:         'new-release-2.12.1-2.13.0',
      level:      NotificationLevel.Announcement,
      title:      'New Rancher releases are available',
      message:    'Message for 2.12.1 and 2.13.0',
      preference: {
        key:   READ_NEW_RELEASE,
        value: '2.12.1-2.13.0',
      },
      primaryAction: {
        label:  'More Info for 2.12.1',
        target: 'https://github.com/rancher/rancher/releases/tag/v2.12.1',
      },
      secondaryAction: {
        label:  'More Info for 2.13.0',
        target: 'https://github.com/rancher/rancher/releases/tag/v2.13.0',
      },
    });
    expect(mockRemoveMatchingNotifications).toHaveBeenCalledWith(mockContext, 'new-release-', '2.12.1-2.13.0');
  });

  it('should not add notification if it was already read (single release)', async() => {
    mockGetters['prefs/get'].mockReturnValue('2.12.1'); // Simulate already read
    const releaseInfo = [{ name: '2.12.1' }];
    const versionInfo: VersionInfo = { version: semver.coerce('2.12.0')!, isPrime: false };

    await processReleaseVersion(mockContext, releaseInfo, versionInfo);

    expect(mockDispatch).not.toHaveBeenCalled();
    expect(mockLogger.debug).not.toHaveBeenCalledWith(expect.stringContaining('Adding new release notification'));
  });

  it('should not add notification if it was already read (multiple releases)', async() => {
    mockGetters['prefs/get'].mockReturnValue('2.12.1-2.13.0'); // Simulate already read
    const releaseInfo = [{ name: '2.13.0' }, { name: '2.12.1' }];
    const versionInfo: VersionInfo = { version: semver.coerce('2.12.0')!, isPrime: false };

    await processReleaseVersion(mockContext, releaseInfo, versionInfo);

    expect(mockDispatch).not.toHaveBeenCalled();
    expect(mockLogger.info).not.toHaveBeenCalledWith(expect.stringContaining('Adding new multiple release notification'));
  });

  it('should not add notification if removeMatchingNotifications indicates it exists', async() => {
    mockRemoveMatchingNotifications.mockResolvedValue(true); // Simulate notification already exists
    const releaseInfo = [{ name: '2.12.1' }];
    const versionInfo: VersionInfo = { version: semver.coerce('2.12.0')!, isPrime: false };

    await processReleaseVersion(mockContext, releaseInfo, versionInfo);

    expect(mockDispatch).not.toHaveBeenCalled();
    expect(mockLogger.debug).not.toHaveBeenCalledWith(expect.stringContaining('Adding new release notification'));
  });
});
