import { actions, mutations, getters, state } from '../notifications';
import { NotificationLevel } from '@shell/types/notifications';

// Mock the crypto functions
jest.mock('@shell/utils/crypto', () => ({
  md5: jest.fn(() => 'mocked-hash'),
}));

jest.mock('@shell/utils/string', () => ({
  randomStr: jest.fn(() => 'random-id'),
}));

jest.mock('@shell/utils/crypto/encryption', () => ({
  encrypt:   jest.fn(() => Promise.resolve({ encryptedData: 'test' })),
  decrypt:   jest.fn(() => Promise.resolve('{}')),
  deriveKey: jest.fn(() => Promise.resolve({})),
}));

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem:    (key: string) => store[key] || null,
    setItem:    (key: string, value: string) => { store[key] = value.toString(); },
    removeItem: (key: string) => { delete store[key]; },
    clear:      () => { store = {}; }
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock BroadcastChannel
class BroadcastChannelMock {
  onmessage: any = null;
  postMessage = jest.fn();
}

global.BroadcastChannel = BroadcastChannelMock as any;

describe('store: notifications - markRead with malformed preference', () => {
  let mockState: any;
  let mockGetters: any;
  let mockCommit: jest.Mock;
  let mockDispatch: jest.Mock;
  let mockExtension: any;

  beforeEach(() => {
    mockState = state();
    mockState.userId = 'test-user-id';
    mockState.localStorageKey = 'test-key';

    mockCommit = jest.fn();
    mockDispatch = jest.fn();

    mockExtension = {
      getDynamic: jest.fn(),
    };

    window.localStorage.clear();
  });

  describe('markRead action', () => {
    it('should handle valid preference object correctly', async() => {
      const notificationId = 'test-id';
      const validPreference = {
        key:   'test-pref',
        value: 'test-value'
      };

      // Setup notification with valid preference
      mockState.notifications = [{
        id:         notificationId,
        title:      'Test',
        level:      NotificationLevel.Info,
        read:       false,
        created:    new Date(),
        preference: validPreference
      }];

      mockGetters = {
        item:   (id: string) => mockState.notifications.find((n: any) => n.id === id),
        userId: 'test-user-id'
      };

      const context = {
        commit:  mockCommit,
        dispatch: mockDispatch,
        getters: mockGetters,
        $extension: mockExtension
      };

      await actions.markRead.call({ $extension: mockExtension }, context, notificationId);

      expect(mockCommit).toHaveBeenCalledWith('markRead', notificationId);
      expect(mockDispatch).toHaveBeenCalledWith('prefs/set', validPreference, { root: true });
    });

    it('should gracefully handle malformed preference (string instead of object)', async() => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      const notificationId = 'test-id';
      const malformedPreference = 'just-a-string'; // This is malformed - should be an object

      // Setup notification with malformed preference
      mockState.notifications = [{
        id:         notificationId,
        title:      'Test',
        level:      NotificationLevel.Info,
        read:       false,
        created:    new Date(),
        preference: malformedPreference
      }];

      mockGetters = {
        item:   (id: string) => mockState.notifications.find((n: any) => n.id === id),
        userId: 'test-user-id'
      };

      const context = {
        commit:  mockCommit,
        dispatch: mockDispatch,
        getters: mockGetters,
        $extension: mockExtension
      };

      // This should NOT throw an error
      await expect(actions.markRead.call({ $extension: mockExtension }, context, notificationId)).resolves.not.toThrow();

      expect(mockCommit).toHaveBeenCalledWith('markRead', notificationId);
      // prefs/set should NOT be called with malformed preference
      expect(mockDispatch).not.toHaveBeenCalledWith('prefs/set', expect.anything(), { root: true });
      // Error should be logged
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Invalid notification preference format - expected object with key and value properties',
        malformedPreference
      );

      consoleErrorSpy.mockRestore();
    });

    it('should gracefully handle preference with missing key property', async() => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      const notificationId = 'test-id';
      const malformedPreference = { value: 'test-value' }; // Missing 'key' property

      mockState.notifications = [{
        id:         notificationId,
        title:      'Test',
        level:      NotificationLevel.Info,
        read:       false,
        created:    new Date(),
        preference: malformedPreference
      }];

      mockGetters = {
        item:   (id: string) => mockState.notifications.find((n: any) => n.id === id),
        userId: 'test-user-id'
      };

      const context = {
        commit:  mockCommit,
        dispatch: mockDispatch,
        getters: mockGetters,
        $extension: mockExtension
      };

      await expect(actions.markRead.call({ $extension: mockExtension }, context, notificationId)).resolves.not.toThrow();

      expect(mockCommit).toHaveBeenCalledWith('markRead', notificationId);
      expect(mockDispatch).not.toHaveBeenCalledWith('prefs/set', expect.anything(), { root: true });
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });
  });

  describe('markUnread action', () => {
    it('should handle valid preference object correctly', async() => {
      const notificationId = 'test-id';
      const validPreference = {
        key:        'test-pref',
        value:      'test-value',
        unsetValue: 'unset'
      };

      mockState.notifications = [{
        id:         notificationId,
        title:      'Test',
        level:      NotificationLevel.Info,
        read:       true,
        created:    new Date(),
        preference: validPreference
      }];

      mockGetters = {
        item:   (id: string) => mockState.notifications.find((n: any) => n.id === id),
        userId: 'test-user-id'
      };

      const context = {
        commit:  mockCommit,
        dispatch: mockDispatch,
        getters: mockGetters,
        $extension: mockExtension
      };

      await actions.markUnread.call({ $extension: mockExtension }, context, notificationId);

      expect(mockCommit).toHaveBeenCalledWith('markUnread', notificationId);
      expect(mockDispatch).toHaveBeenCalledWith('prefs/set', {
        key:   validPreference.key,
        value: validPreference.unsetValue
      }, { root: true });
    });

    it('should gracefully handle malformed preference', async() => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      const notificationId = 'test-id';
      const malformedPreference = 'just-a-string';

      mockState.notifications = [{
        id:         notificationId,
        title:      'Test',
        level:      NotificationLevel.Info,
        read:       true,
        created:    new Date(),
        preference: malformedPreference
      }];

      mockGetters = {
        item:   (id: string) => mockState.notifications.find((n: any) => n.id === id),
        userId: 'test-user-id'
      };

      const context = {
        commit:  mockCommit,
        dispatch: mockDispatch,
        getters: mockGetters,
        $extension: mockExtension
      };

      await expect(actions.markUnread.call({ $extension: mockExtension }, context, notificationId)).resolves.not.toThrow();

      expect(mockCommit).toHaveBeenCalledWith('markUnread', notificationId);
      expect(mockDispatch).not.toHaveBeenCalledWith('prefs/set', expect.anything(), { root: true });
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });
  });

  describe('markAllRead action', () => {
    it('should handle notifications with valid preferences', async() => {
      const validPreference1 = {
        key:   'test-pref-1',
        value: 'test-value-1'
      };
      const validPreference2 = {
        key:   'test-pref-2',
        value: 'test-value-2'
      };

      mockState.notifications = [
        {
          id:         'test-id-1',
          title:      'Test 1',
          level:      NotificationLevel.Info,
          read:       false,
          created:    new Date(),
          preference: validPreference1
        },
        {
          id:         'test-id-2',
          title:      'Test 2',
          level:      NotificationLevel.Info,
          read:       false,
          created:    new Date(),
          preference: validPreference2
        }
      ];

      mockGetters = {
        all:    mockState.notifications,
        userId: 'test-user-id'
      };

      const context = {
        commit:  mockCommit,
        dispatch: mockDispatch,
        getters: mockGetters,
        $extension: mockExtension
      };

      await actions.markAllRead.call({ $extension: mockExtension }, context);

      expect(mockCommit).toHaveBeenCalledWith('markAllRead');
      expect(mockDispatch).toHaveBeenCalledWith('prefs/set', validPreference1, { root: true });
      expect(mockDispatch).toHaveBeenCalledWith('prefs/set', validPreference2, { root: true });
    });

    it('should skip malformed preferences and continue processing valid ones', async() => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      const validPreference = {
        key:   'test-pref-1',
        value: 'test-value-1'
      };
      const malformedPreference = 'just-a-string';

      mockState.notifications = [
        {
          id:         'test-id-1',
          title:      'Test 1',
          level:      NotificationLevel.Info,
          read:       false,
          created:    new Date(),
          preference: malformedPreference // This one is malformed
        },
        {
          id:         'test-id-2',
          title:      'Test 2',
          level:      NotificationLevel.Info,
          read:       false,
          created:    new Date(),
          preference: validPreference // This one is valid
        }
      ];

      mockGetters = {
        all:    mockState.notifications,
        userId: 'test-user-id'
      };

      const context = {
        commit:  mockCommit,
        dispatch: mockDispatch,
        getters: mockGetters,
        $extension: mockExtension
      };

      await expect(actions.markAllRead.call({ $extension: mockExtension }, context)).resolves.not.toThrow();

      expect(mockCommit).toHaveBeenCalledWith('markAllRead');
      // Should only call prefs/set for the valid preference
      expect(mockDispatch).toHaveBeenCalledWith('prefs/set', validPreference, { root: true });
      expect(mockDispatch).toHaveBeenCalledTimes(1);
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });
  });
});
