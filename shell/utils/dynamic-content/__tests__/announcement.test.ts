import { processAnnouncements, ANNOUNCEMENT_PREFIX } from '../announcement';
import { NotificationLevel, Notification } from '@shell/types/notifications';
import { READ_ANNOUNCEMENTS } from '@shell/store/prefs';
import { DynamicContentAnnouncementHandlerName } from '../notification-handler';
import { Context, VersionInfo, Announcement } from '../types';
import semver from 'semver';

jest.mock('semver', () => ({
  ...jest.requireActual('semver'),
  satisfies: jest.fn(),
}));

describe('processAnnouncements', () => {
  let mockDispatch: jest.Mock;
  let mockGetters: any;
  let mockLogger: any;
  let mockContext: Context;

  const VERSION_270 = { version: semver.coerce('v2.7.0') as semver.SemVer, isPrime: false };

  beforeEach(() => {
    mockDispatch = jest.fn();
    mockGetters = {
      'notifications/item': jest.fn(),
      'prefs/get':          jest.fn(),
    };
    mockLogger = {
      error: jest.fn(),
      info:  jest.fn(),
    };
    mockContext = {
      dispatch: mockDispatch,
      getters:  mockGetters,
      logger:   mockLogger,
      isAdmin:  false, // Default to non-admin
    } as unknown as Context;

    // Reset all mocks before each test
    jest.clearAllMocks();

    // Default mock for semver.satisfies to return true
    (semver.satisfies as jest.Mock).mockReturnValue(true);
  });

  // --- Early Exit Conditions ---
  it('should return early if no announcements are provided', async() => {
    await processAnnouncements(mockContext, undefined, VERSION_270);
    expect(mockDispatch).not.toHaveBeenCalled();
    expect(mockLogger.info).not.toHaveBeenCalled();
  });

  it('should return early if announcements array is empty', async() => {
    await processAnnouncements(mockContext, [], VERSION_270);
    expect(mockDispatch).not.toHaveBeenCalled();
    expect(mockLogger.info).not.toHaveBeenCalled();
  });

  it('should return early if versionInfo is undefined', async() => {
    await processAnnouncements(mockContext, [{
      id:      '1',
      target:  'notification/announcement',
      title:   'Test',
      message: 'Msg'
    }], undefined as any);
    expect(mockDispatch).not.toHaveBeenCalled();
    expect(mockLogger.info).not.toHaveBeenCalled();
  });

  it('should return early if versionInfo.version is undefined', async() => {
    await processAnnouncements(mockContext, [{
      id:      '1',
      target:  'notification/announcement',
      title:   'Test',
      message: 'Msg'
    }], { version: undefined as any, isPrime: false });
    expect(mockDispatch).not.toHaveBeenCalled();
    expect(mockLogger.info).not.toHaveBeenCalled();
  });

  // --- Version and Audience Filtering ---
  it('should not process announcement if version does not satisfy requirement', async() => {
    (semver.satisfies as jest.Mock).mockReturnValue(false);
    const announcements: Announcement[] = [
      {
        id:      '1',
        target:  'notification/announcement',
        title:   'Test',
        message: 'Msg',
        version: 'v2.8.0'
      },
    ];

    await processAnnouncements(mockContext, announcements, VERSION_270);

    expect(semver.satisfies).toHaveBeenCalledWith(VERSION_270.version, announcements[0].version);
    expect(mockDispatch).not.toHaveBeenCalled();
    expect(mockLogger.info).not.toHaveBeenCalled();
  });

  it('should not process admin-only announcement if user is not admin', async() => {
    mockContext.isAdmin = false;
    const announcements: Announcement[] = [
      {
        id:       '1',
        target:   'notification/announcement',
        title:    'Test',
        message:  'Msg',
        audience: 'admin'
      },
    ];

    await processAnnouncements(mockContext, announcements, VERSION_270);

    expect(mockDispatch).not.toHaveBeenCalled();
    expect(mockLogger.info).not.toHaveBeenCalled();
  });

  it('should process admin-only announcement if user is admin', async() => {
    mockContext.isAdmin = true;
    const announcements: Announcement[] = [
      {
        id:       '1',
        target:   'notification/announcement',
        title:    'Test',
        message:  'Msg',
        audience: 'admin'
      },
    ];
    const versionInfo: VersionInfo = { version: VERSION_270.version };

    await processAnnouncements(mockContext, announcements, versionInfo);

    expect(mockDispatch).toHaveBeenCalledTimes(1);
    expect(mockDispatch).toHaveBeenCalledWith('notifications/add', expect.any(Object));
  });

  it('should process all-audience announcement regardless of admin status', async() => {
    mockContext.isAdmin = false; // Test with non-admin
    const announcements: Announcement[] = [
      {
        id:       '1',
        target:   'notification/announcement',
        title:    'Test',
        message:  'Msg',
        audience: 'all'
      },
    ];

    await processAnnouncements(mockContext, announcements, VERSION_270);

    expect(mockDispatch).toHaveBeenCalledTimes(1);
    expect(mockDispatch).toHaveBeenCalledWith('notifications/add', expect.any(Object));
  });

  // --- Target Type Handling ---
  it('should log error for unsupported announcement target type', async() => {
    const announcements: Announcement[] = [
      {
        id:      '1',
        target:  'unsupported/type',
        title:   'Test',
        message: 'Msg'
      },
    ];

    await processAnnouncements(mockContext, announcements, VERSION_270);

    expect(mockLogger.error).toHaveBeenCalledWith('Announcement type unsupported/type is not supported');
    expect(mockDispatch).not.toHaveBeenCalled();
  });

  it('should log error for unsupported notification sub-type', async() => {
    const announcements: Announcement[] = [
      {
        id:      '1',
        target:  'notification/unsupported',
        title:   'Test',
        message: 'Msg'
      },
    ];

    await processAnnouncements(mockContext, announcements, VERSION_270);

    expect(mockLogger.error).toHaveBeenCalledWith('Announcement notification type unsupported is not supported');
    expect(mockDispatch).not.toHaveBeenCalled();
  });

  // --- Notification Creation Logic ---
  it('should log error and not add notification if announcement has no ID', async() => {
    const announcements: Announcement[] = [
      {
        target:  'notification/announcement',
        title:   'Test',
        message: 'Msg'
      } as Announcement, // Missing ID
    ];

    await processAnnouncements(mockContext, announcements, VERSION_270);

    expect(mockLogger.error).toHaveBeenCalledWith('No ID For announcement - not going to add a notification for the announcement');
    expect(mockDispatch).not.toHaveBeenCalled();
  });

  it('should not add notification if one with the same ID already exists', async() => {
    const announcementId = 'existing-announcement';

    mockGetters['notifications/item'].mockReturnValue({ id: `${ ANNOUNCEMENT_PREFIX }${ announcementId }` });
    const announcements: Announcement[] = [
      {
        id:      announcementId,
        target:  'notification/announcement',
        title:   'Test',
        message: 'Msg'
      },
    ];

    await processAnnouncements(mockContext, announcements, VERSION_270);

    expect(mockGetters['notifications/item']).toHaveBeenCalledWith(`${ ANNOUNCEMENT_PREFIX }${ announcementId }`);
    expect(mockLogger.info).toHaveBeenCalledWith(expect.stringContaining('Not adding announcement with ID'));
    expect(mockDispatch).not.toHaveBeenCalled();
  });

  it('should not add notification if announcement ID is in READ_ANNOUNCEMENTS preference', async() => {
    const announcementId = 'read-announcement';

    mockGetters['notifications/item'].mockReturnValue(undefined); // No existing notification
    mockGetters['prefs/get'].mockImplementation((key: string) => {
      if (key === READ_ANNOUNCEMENTS) {
        return `some-other-id,${ announcementId },another-one`;
      }

      return '';
    });
    const announcements: Announcement[] = [
      {
        id:      announcementId,
        target:  'notification/announcement',
        title:   'Test',
        message: 'Msg'
      },
    ];

    await processAnnouncements(mockContext, announcements, VERSION_270);

    expect(mockGetters['prefs/get']).toHaveBeenCalledWith(READ_ANNOUNCEMENTS);
    expect(mockLogger.info).toHaveBeenCalledWith(expect.stringContaining('Not adding announcement with ID'));
    expect(mockDispatch).not.toHaveBeenCalled();
  });

  it('should add a new announcement notification with default level (announcement)', async() => {
    const announcementId = 'new-announcement';

    mockGetters['notifications/item'].mockReturnValue(undefined);
    mockGetters['prefs/get'].mockReturnValue('');
    const announcements: Announcement[] = [
      {
        id:      announcementId,
        target:  'notification/announcement',
        title:   'New Announcement',
        message: 'This is a new message.'
      },
    ];

    await processAnnouncements(mockContext, announcements, VERSION_270);

    const expectedNotification: Notification = {
      id:          `${ ANNOUNCEMENT_PREFIX }${ announcementId }`,
      level:       NotificationLevel.Announcement,
      title:       'New Announcement',
      message:     'This is a new message.',
      handlerName: DynamicContentAnnouncementHandlerName,
    };

    expect(mockDispatch).toHaveBeenCalledTimes(1);
    expect(mockDispatch).toHaveBeenCalledWith('notifications/add', expectedNotification);
    expect(mockLogger.info).toHaveBeenCalledWith(expect.stringContaining(`Adding announcement with ID ${ ANNOUNCEMENT_PREFIX }${ announcementId }`));
  });

  it('should add a new info level notification', async() => {
    const announcementId = 'new-info';

    mockGetters['notifications/item'].mockReturnValue(undefined);
    mockGetters['prefs/get'].mockReturnValue('');
    const announcements: Announcement[] = [
      {
        id:      announcementId,
        target:  'notification/info',
        title:   'Info Title',
        message: 'Info Message'
      },
    ];

    await processAnnouncements(mockContext, announcements, VERSION_270);

    const expectedNotification: Notification = {
      id:          `${ ANNOUNCEMENT_PREFIX }${ announcementId }`,
      level:       NotificationLevel.Info,
      title:       'Info Title',
      message:     'Info Message',
      handlerName: DynamicContentAnnouncementHandlerName,
    };

    expect(mockDispatch).toHaveBeenCalledTimes(1);
    expect(mockDispatch).toHaveBeenCalledWith('notifications/add', expectedNotification);
  });

  it('should add a new warning level notification', async() => {
    const announcementId = 'new-warning';

    mockGetters['notifications/item'].mockReturnValue(undefined);
    mockGetters['prefs/get'].mockReturnValue('');
    const announcements: Announcement[] = [
      {
        id:      announcementId,
        target:  'notification/warning',
        title:   'Warning Title',
        message: 'Warning Message'
      },
    ];

    await processAnnouncements(mockContext, announcements, VERSION_270);

    const expectedNotification: Notification = {
      id:          `${ ANNOUNCEMENT_PREFIX }${ announcementId }`,
      level:       NotificationLevel.Warning,
      title:       'Warning Title',
      message:     'Warning Message',
      handlerName: DynamicContentAnnouncementHandlerName,
    };

    expect(mockDispatch).toHaveBeenCalledTimes(1);
    expect(mockDispatch).toHaveBeenCalledWith('notifications/add', expectedNotification);
  });

  // --- Call To Action (CTA) Handling ---
  it('should add notification with primary CTA', async() => {
    const announcementId = 'cta-primary';

    mockGetters['notifications/item'].mockReturnValue(undefined);
    mockGetters['prefs/get'].mockReturnValue('');

    const announcements: Announcement[] = [
      {
        id:      announcementId,
        target:  'notification/announcement',
        title:   'CTA Primary',
        message: 'Message',
        cta:     { primary: { action: 'Click Me', link: '/some/path' } },
      },
    ];

    await processAnnouncements(mockContext, announcements, VERSION_270);

    expect(mockDispatch).toHaveBeenCalledTimes(1);
    const notification = mockDispatch.mock.calls[0][1];

    expect(notification.primaryAction).toStrictEqual({
      label:  'Click Me',
      target: '/some/path'
    });
    expect(notification.secondaryAction).toBeUndefined();
  });

  it('should add notification with secondary CTA', async() => {
    const announcementId = 'cta-secondary';

    mockGetters['notifications/item'].mockReturnValue(undefined);
    mockGetters['prefs/get'].mockReturnValue('');
    const announcements: Announcement[] = [
      {
        id:      announcementId,
        target:  'notification/announcement',
        title:   'CTA Secondary',
        message: 'Message',
        cta:     { secondary: { action: 'More Info', link: 'http://example.com' } },
      },
    ];

    await processAnnouncements(mockContext, announcements, VERSION_270);

    expect(mockDispatch).toHaveBeenCalledTimes(1);
    const notification = mockDispatch.mock.calls[0][1];

    expect(notification.secondaryAction).toStrictEqual({ label: 'More Info', target: 'http://example.com' });
    expect(notification.primaryAction).toBeUndefined();
  });

  it('should add notification with both primary and secondary CTAs', async() => {
    const announcementId = 'cta-both';

    mockGetters['notifications/item'].mockReturnValue(undefined);
    mockGetters['prefs/get'].mockReturnValue('');
    const announcements: Announcement[] = [
      {
        id:      announcementId,
        target:  'notification/announcement',
        title:   'CTA Both',
        message: 'Message',
        cta:     {
          primary: {
            action: 'Primary',
            link:   '/primary'
          },
          secondary: {
            action: 'Secondary',
            link:   '/secondary'
          },
        },
      },
    ];

    await processAnnouncements(mockContext, announcements, VERSION_270);

    expect(mockDispatch).toHaveBeenCalledTimes(1);
    const notification = mockDispatch.mock.calls[0][1];

    expect(notification.primaryAction).toStrictEqual({ label: 'Primary', target: '/primary' });
    expect(notification.secondaryAction).toStrictEqual({ label: 'Secondary', target: '/secondary' });
  });

  // --- Multiple Announcements ---
  it('should process multiple announcements correctly, skipping invalid ones', async() => {
    mockContext.isAdmin = true; // Ensure admin-only can be processed
    mockGetters['notifications/item'].mockImplementation((id: string) => {
      if (id === `${ ANNOUNCEMENT_PREFIX }existing-id`) {
        return { id };
      }

      return undefined;
    });
    mockGetters['prefs/get'].mockImplementation((key: string) => {
      if (key === READ_ANNOUNCEMENTS) {
        return 'read-id';
      }

      return '';
    });

    const announcements: Announcement[] = [
      {
        id:       'valid-1',
        target:   'notification/info',
        title:    'Valid 1',
        message:  'Msg 1',
        audience: 'all'
      },
      {
        id:      'existing-id',
        target:  'notification/announcement',
        title:   'Existing',
        message: 'Msg Existing'
      }, // Should be skipped
      {
        id:      'read-id',
        target:  'notification/warning',
        title:   'Read',
        message: 'Msg Read'
      }, // Should be skipped
      {
        id:       'valid-2',
        target:   'notification/announcement',
        title:    'Valid 2',
        message:  'Msg 2',
        audience: 'admin'
      },
      {
        id:      'invalid-target',
        target:  'unsupported/type',
        title:   'Invalid',
        message: 'Msg Invalid'
      }, // Should log error
      {
        id:      'valid-3',
        target:  'notification/info',
        title:   'Valid 3',
        message: 'Msg 3',
        version: 'v1.0.0'
      }, // semver.satisfies is mocked to true by default
    ];

    await processAnnouncements(mockContext, announcements, VERSION_270);

    // Expect 3 notifications to be added (valid-1, valid-2, valid-3)
    expect(mockDispatch).toHaveBeenCalledTimes(3);
    expect(mockDispatch).toHaveBeenCalledWith('notifications/add', expect.objectContaining({ id: `${ ANNOUNCEMENT_PREFIX }valid-1` }));
    expect(mockDispatch).toHaveBeenCalledWith('notifications/add', expect.objectContaining({ id: `${ ANNOUNCEMENT_PREFIX }valid-2` }));
    expect(mockDispatch).toHaveBeenCalledWith('notifications/add', expect.objectContaining({ id: `${ ANNOUNCEMENT_PREFIX }valid-3` }));

    // Expect errors for invalid target
    expect(mockLogger.error).toHaveBeenCalledWith('Announcement type unsupported/type is not supported');

    // Expect info logs for skipped announcements
    expect(mockLogger.info).toHaveBeenCalledWith(expect.stringContaining('Not adding announcement with ID '));
    expect(mockLogger.info).toHaveBeenCalledWith(expect.stringContaining(`${ ANNOUNCEMENT_PREFIX }existing-id`));
    expect(mockLogger.info).toHaveBeenCalledWith(expect.stringContaining(`${ ANNOUNCEMENT_PREFIX }read-id`));
  });
});
