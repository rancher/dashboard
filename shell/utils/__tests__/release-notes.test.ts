import { NotificationLevel } from '@shell/types/notifications';

const MOCK_VERSION = '2.9.0';
const MOCK_VERSION_WITH_SUFFIX = `${ MOCK_VERSION }-rc1`;
const READ_WHATS_NEW_KEY = 'read-whatsnew';
const PREFIX = 'release-notes-';
const CURRENT_ID = `${ PREFIX }${ MOCK_VERSION }`;
const RELEASE_NOTES_URL = 'https://example.com/release-notes';

function makeGetters(overrides: {
  all?: any[];
  lastReadVersion?: string;
  t?: (key: string, args?: any) => string;
  releaseNotesUrl?: string;
} = {}) {
  const {
    all = [],
    lastReadVersion = '',
    t = (key: string) => key,
    releaseNotesUrl = RELEASE_NOTES_URL,
  } = overrides;

  return {
    'notifications/all': all,
    'prefs/get':         (key: string) => (key === READ_WHATS_NEW_KEY ? lastReadVersion : ''),
    'i18n/t':            t,
    releaseNotesUrl,
  };
}

describe('addReleaseNotesNotification', () => {
  let addReleaseNotesNotification: any;
  let mockGetVersionData: jest.Mock;

  beforeEach(() => {
    jest.resetModules();
    mockGetVersionData = jest.fn(() => ({ Version: MOCK_VERSION_WITH_SUFFIX }));
    jest.mock('@shell/config/version', () => ({ getVersionData: mockGetVersionData }));
    addReleaseNotesNotification = require('@shell/utils/release-notes').addReleaseNotesNotification;
  });

  describe('version parsing', () => {
    it('strips the pre-release suffix from the version', async() => {
      const dispatch = jest.fn(() => Promise.resolve());
      const getters = makeGetters();

      await addReleaseNotesNotification(dispatch, getters);

      expect(dispatch).toHaveBeenCalledWith('notifications/add', expect.objectContaining({ id: CURRENT_ID }));
    });

    it('uses the version as-is when there is no suffix', async() => {
      mockGetVersionData.mockReturnValue({ Version: MOCK_VERSION });
      const dispatch = jest.fn(() => Promise.resolve());
      const getters = makeGetters();

      await addReleaseNotesNotification(dispatch, getters);

      expect(dispatch).toHaveBeenCalledWith('notifications/add', expect.objectContaining({ id: CURRENT_ID }));
    });
  });

  describe('existing notification for the current version', () => {
    it('does not add a notification when the current version notification already exists', async() => {
      const dispatch = jest.fn(() => Promise.resolve());
      const getters = makeGetters({ all: [{ id: CURRENT_ID }] });

      await addReleaseNotesNotification(dispatch, getters);

      expect(dispatch).not.toHaveBeenCalledWith('notifications/add', expect.anything());
    });

    it('does not remove the current version notification when it already exists', async() => {
      const dispatch = jest.fn(() => Promise.resolve());
      const getters = makeGetters({ all: [{ id: CURRENT_ID }] });

      await addReleaseNotesNotification(dispatch, getters);

      expect(dispatch).not.toHaveBeenCalledWith('notifications/remove', CURRENT_ID);
    });
  });

  describe('old release-notes notifications', () => {
    it('removes a notification for an older version', async() => {
      const oldId = `${ PREFIX }2.8.0`;
      const dispatch = jest.fn(() => Promise.resolve());
      const getters = makeGetters({ all: [{ id: oldId }] });

      await addReleaseNotesNotification(dispatch, getters);

      expect(dispatch).toHaveBeenCalledWith('notifications/remove', oldId);
    });

    it('removes multiple notifications for older versions', async() => {
      const oldId1 = `${ PREFIX }2.7.0`;
      const oldId2 = `${ PREFIX }2.8.0`;
      const dispatch = jest.fn(() => Promise.resolve());
      const getters = makeGetters({ all: [{ id: oldId1 }, { id: oldId2 }] });

      await addReleaseNotesNotification(dispatch, getters);

      expect(dispatch).toHaveBeenCalledWith('notifications/remove', oldId1);
      expect(dispatch).toHaveBeenCalledWith('notifications/remove', oldId2);
    });

    it('still adds a new notification after removing old ones', async() => {
      const dispatch = jest.fn(() => Promise.resolve());
      const getters = makeGetters({ all: [{ id: `${ PREFIX }2.8.0` }] });

      await addReleaseNotesNotification(dispatch, getters);

      expect(dispatch).toHaveBeenCalledWith('notifications/add', expect.objectContaining({ id: CURRENT_ID }));
    });
  });

  describe('non-release-notes notifications', () => {
    it('ignores notifications with a different id prefix', async() => {
      const dispatch = jest.fn(() => Promise.resolve());
      const getters = makeGetters({ all: [{ id: 'cluster-upgrade-1.0.0' }, { id: 'some-other-notification' }] });

      await addReleaseNotesNotification(dispatch, getters);

      expect(dispatch).not.toHaveBeenCalledWith('notifications/remove', expect.anything());
    });
  });

  describe('version preference guard', () => {
    it('does not add notification when the version has already been read', async() => {
      const dispatch = jest.fn(() => Promise.resolve());
      const getters = makeGetters({ lastReadVersion: MOCK_VERSION });

      await addReleaseNotesNotification(dispatch, getters);

      expect(dispatch).not.toHaveBeenCalledWith('notifications/add', expect.anything());
    });

    it('adds notification when the read version pref is for an older version', async() => {
      const dispatch = jest.fn(() => Promise.resolve());
      const getters = makeGetters({ lastReadVersion: '2.8.0' });

      await addReleaseNotesNotification(dispatch, getters);

      expect(dispatch).toHaveBeenCalledWith('notifications/add', expect.objectContaining({ id: CURRENT_ID }));
    });

    it('adds notification when the read version pref is empty', async() => {
      const dispatch = jest.fn(() => Promise.resolve());
      const getters = makeGetters({ lastReadVersion: '' });

      await addReleaseNotesNotification(dispatch, getters);

      expect(dispatch).toHaveBeenCalledWith('notifications/add', expect.objectContaining({ id: CURRENT_ID }));
    });
  });

  describe('notification shape', () => {
    it('adds a notification with the correct id, level and preference', async() => {
      const dispatch = jest.fn(() => Promise.resolve());
      const t = jest.fn((key: string) => key);
      const getters = makeGetters({ t });

      await addReleaseNotesNotification(dispatch, getters);

      expect(dispatch).toHaveBeenCalledWith('notifications/add', {
        id:         CURRENT_ID,
        level:      NotificationLevel.Info,
        title:      'landing.whatsNew.title',
        message:    'landing.whatsNew.message',
        preference: {
          key:   READ_WHATS_NEW_KEY,
          value: MOCK_VERSION,
        },
        primaryAction: {
          label:  'landing.whatsNew.link',
          target: RELEASE_NOTES_URL,
        },
      });
    });

    it('passes version to the title translation function', async() => {
      const dispatch = jest.fn(() => Promise.resolve());
      const t = jest.fn((key: string) => key);
      const getters = makeGetters({ t });

      await addReleaseNotesNotification(dispatch, getters);

      expect(t).toHaveBeenCalledWith('landing.whatsNew.title', { version: MOCK_VERSION });
    });

    it('uses the releaseNotesUrl getter for the primaryAction target', async() => {
      const customUrl = 'https://custom.example.com/notes';
      const dispatch = jest.fn(() => Promise.resolve());
      const getters = makeGetters({ releaseNotesUrl: customUrl });

      await addReleaseNotesNotification(dispatch, getters);

      expect(dispatch).toHaveBeenCalledWith('notifications/add', expect.objectContaining({ primaryAction: expect.objectContaining({ target: customUrl }) }));
    });
  });

  describe('empty state', () => {
    it('adds a notification when there are no existing notifications', async() => {
      const dispatch = jest.fn(() => Promise.resolve());
      const getters = makeGetters({ all: [] });

      await addReleaseNotesNotification(dispatch, getters);

      expect(dispatch).toHaveBeenCalledWith('notifications/add', expect.objectContaining({ id: CURRENT_ID }));
    });

    it('dispatches nothing beyond add when there are no existing notifications', async() => {
      const dispatch = jest.fn(() => Promise.resolve());
      const getters = makeGetters({ all: [] });

      await addReleaseNotesNotification(dispatch, getters);

      expect(dispatch).toHaveBeenCalledTimes(1);
      expect(dispatch).toHaveBeenCalledWith('notifications/add', expect.anything());
    });
  });
});
