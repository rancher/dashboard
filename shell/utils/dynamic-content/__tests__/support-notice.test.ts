import { processSupportNotices } from '../support-notice';
import { NotificationLevel } from '@shell/types/notifications';
import { READ_SUPPORT_NOTICE, READ_UPCOMING_SUPPORT_NOTICE } from '@shell/store/prefs';
import { Context, VersionInfo, SupportInfo } from '../types';
import * as util from '../util'; // To mock removeMatchingNotifications
import semver from 'semver';
import day from 'dayjs';

describe('processSupportNotices', () => {
  let mockContext: Context;
  let mockDispatch: jest.Mock;
  let mockGetters: any;
  let mockLogger: any;
  let mockRemoveMatchingNotifications: jest.SpyInstance;

  beforeEach(() => {
    mockDispatch = jest.fn();
    mockGetters = {
      'prefs/get': jest.fn(),
      'i18n/t':    jest.fn((key: string, params?: any) => {
        const { version, days } = params || {};

        if (key === 'dynamicContent.eol.title') return `EOL Title for ${ version }`;
        if (key === 'dynamicContent.eol.message') return `EOL Message for ${ version }`;
        if (key === 'dynamicContent.eom.title') return `EOM Title for ${ version }`;
        if (key === 'dynamicContent.eom.message') return `EOM Message for ${ version }`;
        if (key === 'dynamicContent.upcomingEol.title') return `Upcoming EOL Title for ${ version } in ${ days } days`;
        if (key === 'dynamicContent.upcomingEol.message') return `Upcoming EOL Message for ${ version } in ${ days } days`;
        if (key === 'dynamicContent.upcomingEom.title') return `Upcoming EOM Title for ${ version } in ${ days } days`;
        if (key === 'dynamicContent.upcomingEom.message') return `Upcoming EOM Message for ${ version } in ${ days } days`;

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

    // Mock the utility function. Default: notification does not exist, so add it.
    mockRemoveMatchingNotifications = jest.spyOn(util, 'removeMatchingNotifications')
      .mockResolvedValue(false);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should return early if statusInfo is null/undefined', async() => {
    const versionInfo: VersionInfo = { version: semver.coerce('2.12.0')!, isPrime: false };

    await processSupportNotices(mockContext, null as any, versionInfo);
    expect(mockDispatch).not.toHaveBeenCalled();
  });

  it('should return early if versionInfo is null/undefined or version is missing', async() => {
    const statusInfo: SupportInfo = { status: { eol: '<= 2.11', eom: '<= 2.12' }, upcoming: {} as any };

    await processSupportNotices(mockContext, statusInfo, null as any);
    expect(mockDispatch).not.toHaveBeenCalled();
    await processSupportNotices(mockContext, statusInfo, { version: null, isPrime: false });
    expect(mockDispatch).not.toHaveBeenCalled();
  });

  it('should not add notification if no support status matches', async() => {
    const versionInfo: VersionInfo = { version: semver.coerce('2.13.0')!, isPrime: false };
    const statusInfo: SupportInfo = {
      status:   { eol: '<= 2.11.x', eom: '<= 2.12.x' },
      upcoming: {
        eom: { version: '= 2.13.x', date: day().add(40, 'day').toDate() },
        eol: { version: '= 2.13.x', date: day().add(40, 'day').toDate() },
      }
    };

    await processSupportNotices(mockContext, statusInfo, versionInfo);
    expect(mockDispatch).not.toHaveBeenCalled();
    expect(mockLogger.info).not.toHaveBeenCalled();
  });

  it('should add EOL notification if version is EOL', async() => {
    const versionInfo: VersionInfo = { version: semver.coerce('2.11.5')!, isPrime: false };
    const statusInfo: SupportInfo = {
      status:   { eol: '<= 2.11.x', eom: '<= 2.12.x' },
      upcoming: {} as any
    };

    await processSupportNotices(mockContext, statusInfo, versionInfo);

    expect(mockLogger.info).toHaveBeenCalledWith('This version (2.11.5) is End of Life');
    expect(mockDispatch).toHaveBeenCalledWith('notifications/add', expect.objectContaining({
      id:    'support-notice-eol-2.11',
      level: NotificationLevel.Warning,
      title: 'EOL Title for 2.11',
    }));
  });

  it('should add EOM notification if version is EOM but not EOL', async() => {
    const versionInfo: VersionInfo = { version: semver.coerce('2.12.3')!, isPrime: false };
    const statusInfo: SupportInfo = {
      status:   { eol: '<= 2.11.x', eom: '<= 2.12.x' },
      upcoming: {} as any
    };

    await processSupportNotices(mockContext, statusInfo, versionInfo);

    expect(mockLogger.info).toHaveBeenCalledWith('This version (2.12.3) is End of Maintenance');
    expect(mockDispatch).toHaveBeenCalledWith('notifications/add', expect.objectContaining({
      id:    'support-notice-eom-2.12',
      level: NotificationLevel.Warning,
      title: 'EOM Title for 2.12',
    }));
  });

  it('should add upcoming EOL notification', async() => {
    const versionInfo: VersionInfo = { version: semver.coerce('2.12.0')!, isPrime: false };
    const statusInfo: SupportInfo = {
      status:   { eol: '<= 2.11.x', eom: '<= 2.11.x' },
      upcoming: {
        eol: { version: '= 2.12.x', date: day().add(15, 'day').toDate() },
        eom: {} as any,
      }
    };

    await processSupportNotices(mockContext, statusInfo, versionInfo);

    expect(mockDispatch).toHaveBeenCalledWith('notifications/add', expect.objectContaining({
      id:    'upcoming-support-notice-eol-2.12',
      level: NotificationLevel.Warning,
      title: 'Upcoming EOL Title for 2.12 in 15 days',
    }));
  });

  it('should add upcoming EOM notification', async() => {
    const versionInfo: VersionInfo = { version: semver.coerce('2.13.0')!, isPrime: false };
    const statusInfo: SupportInfo = {
      status:   { eol: '<= 2.12.x', eom: '<= 2.12.x' },
      upcoming: {
        eom: {
          version: '= 2.13.x', date: day().add(20, 'day').toDate(), noticeDays: 25
        },
        eol: {} as any,
      }
    };

    await processSupportNotices(mockContext, statusInfo, versionInfo);

    expect(mockDispatch).toHaveBeenCalledWith('notifications/add', expect.objectContaining({
      id:    'upcoming-support-notice-eom-2.13',
      level: NotificationLevel.Warning,
      title: 'Upcoming EOM Title for 2.13 in 20 days',
    }));
  });

  it('should not add notification if removeMatchingNotifications indicates it exists', async() => {
    mockRemoveMatchingNotifications.mockResolvedValue(true); // Simulate notification already exists
    const versionInfo: VersionInfo = { version: semver.coerce('2.11.5')!, isPrime: false };
    const statusInfo: SupportInfo = {
      status:   { eol: '<= 2.11.x', eom: '<= 2.12.x' },
      upcoming: {} as any
    };

    await processSupportNotices(mockContext, statusInfo, versionInfo);

    expect(mockDispatch).not.toHaveBeenCalled();
  });

  describe('user preferences', () => {
    it('should not add EOL notification if it was already read', async() => {
      mockGetters['prefs/get'].mockImplementation((key: string) => {
        if (key === READ_SUPPORT_NOTICE) return 'eol-2.11';

        return '';
      });
      const versionInfo: VersionInfo = { version: semver.coerce('2.11.5')!, isPrime: false };
      const statusInfo: SupportInfo = {
        status:   { eol: '<= 2.11.x', eom: '<= 2.12.x' },
        upcoming: {} as any
      };

      await processSupportNotices(mockContext, statusInfo, versionInfo);

      expect(mockDispatch).not.toHaveBeenCalled();
    });

    it('should not add EOM notification if it was already read', async() => {
      mockGetters['prefs/get'].mockImplementation((key: string) => {
        if (key === READ_SUPPORT_NOTICE) return 'eom-2.12';

        return '';
      });
      const versionInfo: VersionInfo = { version: semver.coerce('2.12.3')!, isPrime: false };
      const statusInfo: SupportInfo = {
        status:   { eol: '<= 2.11.x', eom: '<= 2.12.x' },
        upcoming: {} as any
      };

      await processSupportNotices(mockContext, statusInfo, versionInfo);

      expect(mockDispatch).not.toHaveBeenCalled();
    });

    it('should not add upcoming EOL notification if it was already read', async() => {
      mockGetters['prefs/get'].mockImplementation((key: string) => {
        if (key === READ_UPCOMING_SUPPORT_NOTICE) return 'eol-2.12';

        return '';
      });
      const versionInfo: VersionInfo = { version: semver.coerce('2.12.0')!, isPrime: false };
      const statusInfo: SupportInfo = {
        status:   { eol: '<= 2.11.x', eom: '<= 2.11.x' },
        upcoming: { eol: { version: '= 2.12.x', date: day().add(145, 'day').toDate() }, eom: {} as any }
      };

      await processSupportNotices(mockContext, statusInfo, versionInfo);

      expect(mockDispatch).not.toHaveBeenCalled();
    });

    it('should not add upcoming EOM notification if it was already read', async() => {
      mockGetters['prefs/get'].mockImplementation((key: string) => {
        if (key === READ_UPCOMING_SUPPORT_NOTICE) return 'eom-2.13';

        return '';
      });
      const versionInfo: VersionInfo = { version: semver.coerce('2.13.0')!, isPrime: false };
      const statusInfo: SupportInfo = {
        status:   { eol: '<= 2.12.x', eom: '<= 2.12.x' },
        upcoming: {
          eom: {
            version: '= 2.13.x', date: day().add(20, 'day').toDate(), noticeDays: 25
          },
          eol: {} as any
        }
      };

      await processSupportNotices(mockContext, statusInfo, versionInfo);

      expect(mockDispatch).not.toHaveBeenCalled();
    });
  });
});
