import { actions, getters, mutations, state } from '@shell/store/notifications';
import { NotificationLevel, Notification, StoredNotification } from '@shell/types/notifications';
import { encrypt, decrypt, deriveKey } from '@shell/utils/crypto/encryption';

jest.mock('@shell/utils/string', () => ({ randomStr: jest.fn(() => 'mock-random-id') }));
jest.mock('@shell/utils/crypto', () => ({ md5: jest.fn((v: string) => `hash-${ v }`) }));
jest.mock('@shell/utils/crypto/encryption', () => ({
  encrypt:   jest.fn(),
  decrypt:   jest.fn(),
  deriveKey: jest.fn(),
}));

function makeNotification(overrides: Partial<Notification> = {}): Notification {
  return {
    id:    'test-id',
    title: 'test notification',
    level: NotificationLevel.Info,
    ...overrides,
  };
}

function makeStoredNotification(overrides: Partial<StoredNotification> = {}): StoredNotification {
  return {
    ...makeNotification(),
    read:    false,
    created: new Date('2026-01-01'),
    ...overrides,
  };
}

describe('notifications store', () => {
  describe('state', () => {
    it('returns initial state with empty notifications', () => {
      const result = state();

      expect(result.notifications).toStrictEqual([]);
      expect(result.localStorageKey).toStrictEqual('');
      expect(result.userId).toStrictEqual('');
      expect(result.encryptionKey).toBeUndefined();
    });
  });

  describe('getters', () => {
    let mockState: ReturnType<typeof state>;
    const hidden = makeStoredNotification({
      id: 'h1', level: NotificationLevel.Hidden, read: false
    });
    const unreadVisible = makeStoredNotification({
      id: 'u1', level: NotificationLevel.Info, read: false
    });
    const readVisible = makeStoredNotification({
      id: 'r1', level: NotificationLevel.Warning, read: true
    });

    beforeEach(() => {
      mockState = state();
      mockState.notifications = [hidden, unreadVisible, readVisible];
    });

    describe('all', () => {
      it('returns all notifications including hidden', () => {
        expect(getters.all(mockState)).toStrictEqual([hidden, unreadVisible, readVisible]);
      });

      it('returns empty array when there are no notifications', () => {
        mockState.notifications = [];
        expect(getters.all(mockState)).toStrictEqual([]);
      });
    });

    describe('visible', () => {
      it('returns only non-hidden notifications', () => {
        expect(getters.visible(mockState)).toStrictEqual([unreadVisible, readVisible]);
      });

      it('returns empty array when all notifications are hidden', () => {
        mockState.notifications = [hidden];
        expect(getters.visible(mockState)).toStrictEqual([]);
      });
    });

    describe('hidden', () => {
      it('returns only hidden notifications', () => {
        expect(getters.hidden(mockState)).toStrictEqual([hidden]);
      });

      it('returns empty array when no notifications are hidden', () => {
        mockState.notifications = [unreadVisible, readVisible];
        expect(getters.hidden(mockState)).toStrictEqual([]);
      });
    });

    describe('item', () => {
      it('returns a function that finds a notification by id', () => {
        const itemFn = getters.item(mockState);

        expect(itemFn('u1')).toStrictEqual(unreadVisible);
      });

      it('returns undefined when the notification id does not exist', () => {
        const itemFn = getters.item(mockState);

        expect(itemFn('nonexistent')).toBeUndefined();
      });
    });

    describe('unreadCount', () => {
      it('counts only unread visible notifications', () => {
        expect(getters.unreadCount(mockState)).toStrictEqual(1);
      });

      it('returns zero when all visible notifications are read', () => {
        mockState.notifications = [readVisible];
        expect(getters.unreadCount(mockState)).toStrictEqual(0);
      });

      it('excludes hidden notifications from the unread count', () => {
        mockState.notifications = [hidden]; // hidden and unread
        expect(getters.unreadCount(mockState)).toStrictEqual(0);
      });
    });

    describe('localStorageKey', () => {
      it('returns the localStorageKey from state', () => {
        mockState.localStorageKey = 'rancher-notifications-abc';
        expect(getters.localStorageKey(mockState)).toStrictEqual('rancher-notifications-abc');
      });
    });

    describe('userId', () => {
      it('returns the userId from state', () => {
        mockState.userId = 'user-123';
        expect(getters.userId(mockState)).toStrictEqual('user-123');
      });
    });

    describe('encryptionKey', () => {
      it('returns undefined by default', () => {
        expect(getters.encryptionKey(mockState)).toBeUndefined();
      });

      it('returns the encryptionKey when set', () => {
        const mockKey = {} as CryptoKey;

        mockState.encryptionKey = mockKey;
        expect(getters.encryptionKey(mockState)).toStrictEqual(mockKey);
      });
    });
  });

  describe('mutations', () => {
    let mockState: ReturnType<typeof state>;

    beforeEach(() => {
      mockState = state();
      mockState.localStorageKey = 'rancher-notifications-test';
      localStorage.clear();
    });

    describe('localStorageKey', () => {
      it('sets localStorageKey with the store prefix', () => {
        mutations.localStorageKey(mockState, 'abc123');
        expect(mockState.localStorageKey).toStrictEqual('rancher-notifications-abc123');
      });
    });

    describe('userId', () => {
      it('sets the userId on state', () => {
        mutations.userId(mockState, 'user-456');
        expect(mockState.userId).toStrictEqual('user-456');
      });
    });

    describe('encryptionKey', () => {
      it('sets the encryptionKey on state', () => {
        const mockKey = {} as CryptoKey;

        mutations.encryptionKey(mockState, mockKey);
        expect(mockState.encryptionKey).toStrictEqual(mockKey);
      });
    });

    describe('load', () => {
      it('replaces all notifications with the provided list', () => {
        mockState.notifications = [makeStoredNotification({ id: 'old' })];
        const newNotifications = [makeStoredNotification({ id: 'n1' }), makeStoredNotification({ id: 'n2' })];

        mutations.load(mockState, newNotifications);
        expect(mockState.notifications).toStrictEqual(newNotifications);
      });

      it('clears notifications when given an empty array', () => {
        mockState.notifications = [makeStoredNotification({ id: 'old' })];
        mutations.load(mockState, []);
        expect(mockState.notifications).toStrictEqual([]);
      });
    });

    describe('add', () => {
      it('adds a notification with the provided id to the front of the list', () => {
        mutations.add(mockState, makeNotification({ id: 'custom-id' }));
        expect(mockState.notifications[0].id).toStrictEqual('custom-id');
        expect(mockState.notifications).toHaveLength(1);
      });

      it('generates an id via randomStr when none is provided', () => {
        mutations.add(mockState, makeNotification({ id: '' as any }));
        expect(mockState.notifications[0].id).toStrictEqual('mock-random-id');
      });

      it('sets read to false on the newly added notification', () => {
        mutations.add(mockState, makeNotification({ id: 'n1' }));
        expect(mockState.notifications[0].read).toStrictEqual(false);
      });

      it('prepends the new notification before existing ones', () => {
        mockState.notifications = [makeStoredNotification({ id: 'existing' })];
        mutations.add(mockState, makeNotification({ id: 'new' }));
        expect(mockState.notifications[0].id).toStrictEqual('new');
        expect(mockState.notifications[1].id).toStrictEqual('existing');
      });

      it('does not add a notification whose id already exists', () => {
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

        mockState.notifications = [makeStoredNotification({ id: 'dup' })];
        mutations.add(mockState, makeNotification({ id: 'dup' }));
        expect(mockState.notifications).toHaveLength(1);
        consoleErrorSpy.mockRestore();
      });

      it('enforces the maximum of 50 notifications by removing the oldest', () => {
        for (let i = 0; i < 50; i++) {
          mockState.notifications.push(makeStoredNotification({ id: `n${ i }` }));
        }
        mutations.add(mockState, makeNotification({ id: 'newest' }));
        expect(mockState.notifications).toHaveLength(50);
        expect(mockState.notifications[0].id).toStrictEqual('newest');
      });

      it('removes the oldest notification from localStorage when the limit is exceeded', () => {
        const removeItemSpy = jest.spyOn(Storage.prototype, 'removeItem');

        for (let i = 0; i < 50; i++) {
          mockState.notifications.push(makeStoredNotification({ id: `n${ i }` }));
        }
        mutations.add(mockState, makeNotification({ id: 'newest' }));
        expect(removeItemSpy).toHaveBeenCalledWith('rancher-notifications-test-n49');
        removeItemSpy.mockRestore();
      });

      it('syncs the notifications index to localStorage after adding', () => {
        const setItemSpy = jest.spyOn(Storage.prototype, 'setItem');

        mutations.add(mockState, makeNotification({ id: 'n1' }));
        expect(setItemSpy).toHaveBeenCalledWith('rancher-notifications-test', expect.any(String));
        setItemSpy.mockRestore();
      });

      it('stores id, created, read, and progress fields in the localStorage index', () => {
        mutations.add(mockState, makeNotification({ id: 'n1', progress: 42 }));
        const stored = JSON.parse(localStorage.getItem('rancher-notifications-test') || '[]');

        expect(stored[0]).toStrictEqual({
          id:       'n1',
          created:  expect.any(String),
          read:     false,
          progress: 42,
        });
      });
    });

    describe('markRead', () => {
      it('marks a notification as read', () => {
        mockState.notifications = [makeStoredNotification({ id: 'n1', read: false })];
        mutations.markRead(mockState, 'n1');
        expect(mockState.notifications[0].read).toStrictEqual(true);
      });

      it('does not modify state when the notification is not found', () => {
        mockState.notifications = [makeStoredNotification({ id: 'n1', read: false })];
        mutations.markRead(mockState, 'nonexistent');
        expect(mockState.notifications[0].read).toStrictEqual(false);
      });

      it('does not change a notification that is already read', () => {
        mockState.notifications = [makeStoredNotification({ id: 'n1', read: true })];
        mutations.markRead(mockState, 'n1');
        expect(mockState.notifications[0].read).toStrictEqual(true);
      });
    });

    describe('markUnread', () => {
      it('marks a notification as unread', () => {
        mockState.notifications = [makeStoredNotification({ id: 'n1', read: true })];
        mutations.markUnread(mockState, 'n1');
        expect(mockState.notifications[0].read).toStrictEqual(false);
      });

      it('does not modify state when the notification is not found', () => {
        mockState.notifications = [makeStoredNotification({ id: 'n1', read: true })];
        mutations.markUnread(mockState, 'nonexistent');
        expect(mockState.notifications[0].read).toStrictEqual(true);
      });

      it('does not change a notification that is already unread', () => {
        mockState.notifications = [makeStoredNotification({ id: 'n1', read: false })];
        mutations.markUnread(mockState, 'n1');
        expect(mockState.notifications[0].read).toStrictEqual(false);
      });
    });

    describe('markAllRead', () => {
      it('marks all visible unread notifications as read', () => {
        mockState.notifications = [
          makeStoredNotification({
            id: 'n1', level: NotificationLevel.Info, read: false
          }),
          makeStoredNotification({
            id: 'n2', level: NotificationLevel.Warning, read: false
          }),
        ];
        mutations.markAllRead(mockState);
        expect(mockState.notifications[0].read).toStrictEqual(true);
        expect(mockState.notifications[1].read).toStrictEqual(true);
      });

      it('does not mark hidden notifications as read', () => {
        mockState.notifications = [
          makeStoredNotification({
            id: 'h1', level: NotificationLevel.Hidden, read: false
          }),
        ];
        mutations.markAllRead(mockState);
        expect(mockState.notifications[0].read).toStrictEqual(false);
      });

      it('leaves already-read visible notifications unchanged', () => {
        mockState.notifications = [
          makeStoredNotification({
            id: 'n1', level: NotificationLevel.Info, read: true
          }),
        ];
        mutations.markAllRead(mockState);
        expect(mockState.notifications[0].read).toStrictEqual(true);
      });
    });

    describe('update', () => {
      it('updates notification fields by id', () => {
        mockState.notifications = [makeStoredNotification({ id: 'n1', title: 'original' })];
        mutations.update(mockState, { id: 'n1', title: 'updated' } as any);
        expect(mockState.notifications[0].title).toStrictEqual('updated');
      });

      it('preserves fields not included in the update', () => {
        mockState.notifications = [makeStoredNotification({
          id:    'n1',
          title: 'original',
          level: NotificationLevel.Success,
        })];
        mutations.update(mockState, { id: 'n1', title: 'updated' } as any);
        expect(mockState.notifications[0].level).toStrictEqual(NotificationLevel.Success);
      });

      it('does not modify state when the id is not found', () => {
        mockState.notifications = [makeStoredNotification({ id: 'n1', title: 'original' })];
        mutations.update(mockState, { id: 'nonexistent', title: 'updated' } as any);
        expect(mockState.notifications[0].title).toStrictEqual('original');
      });

      it('does nothing when no id is provided', () => {
        mockState.notifications = [makeStoredNotification({ id: 'n1', title: 'original' })];
        mutations.update(mockState, {} as any);
        expect(mockState.notifications[0].title).toStrictEqual('original');
      });
    });

    describe('remove', () => {
      it('removes the notification with the given id', () => {
        mockState.notifications = [
          makeStoredNotification({ id: 'n1' }),
          makeStoredNotification({ id: 'n2' }),
        ];
        mutations.remove(mockState, 'n1');
        expect(mockState.notifications).toHaveLength(1);
        expect(mockState.notifications[0].id).toStrictEqual('n2');
      });

      it('removes the encrypted notification entry from localStorage', () => {
        const removeItemSpy = jest.spyOn(Storage.prototype, 'removeItem');

        mockState.notifications = [makeStoredNotification({ id: 'n1' })];
        mutations.remove(mockState, 'n1');
        expect(removeItemSpy).toHaveBeenCalledWith('rancher-notifications-test-n1');
        removeItemSpy.mockRestore();
      });

      it('does not change state when the id is not found', () => {
        mockState.notifications = [makeStoredNotification({ id: 'n1' })];
        mutations.remove(mockState, 'nonexistent');
        expect(mockState.notifications).toHaveLength(1);
      });
    });

    describe('clearAll', () => {
      it('removes all notifications from state', () => {
        mockState.notifications = [
          makeStoredNotification({ id: 'n1' }),
          makeStoredNotification({ id: 'n2' }),
        ];
        mutations.clearAll(mockState);
        expect(mockState.notifications).toStrictEqual([]);
      });

      it('removes each notification encrypted entry from localStorage', () => {
        const removeItemSpy = jest.spyOn(Storage.prototype, 'removeItem');

        mockState.notifications = [
          makeStoredNotification({ id: 'n1' }),
          makeStoredNotification({ id: 'n2' }),
        ];
        mutations.clearAll(mockState);
        expect(removeItemSpy).toHaveBeenCalledWith('rancher-notifications-test-n1');
        expect(removeItemSpy).toHaveBeenCalledWith('rancher-notifications-test-n2');
        removeItemSpy.mockRestore();
      });

      it('does nothing when there are no notifications', () => {
        mutations.clearAll(mockState);
        expect(mockState.notifications).toStrictEqual([]);
      });
    });
  });

  describe('actions', () => {
    const mockEncrypt = encrypt as jest.Mock;
    const mockDecrypt = decrypt as jest.Mock;
    const mockDeriveKey = deriveKey as jest.Mock;
    const mockKey = {} as CryptoKey;
    let mockCommit: jest.Mock;
    let mockDispatch: jest.Mock;
    let mockGetters: any;

    beforeEach(() => {
      mockCommit = jest.fn();
      mockDispatch = jest.fn();
      mockGetters = {
        localStorageKey: 'rancher-notifications-test',
        encryptionKey:   mockKey,
        userId:          'user-1',
        item:            jest.fn(() => undefined),
        all:             [],
      };
      mockEncrypt.mockResolvedValue({ iv: 'test-iv', data: 'test-data' });
      mockDecrypt.mockResolvedValue('{}');
      mockDeriveKey.mockResolvedValue(mockKey);
      localStorage.clear();
    });

    describe('add', () => {
      it('generates an id via randomStr when none is provided', async() => {
        const notification = makeNotification({ id: '' });

        await actions.add(
          {
            commit: mockCommit, dispatch: mockDispatch, getters: mockGetters
          },
          notification
        );

        expect(notification.id).toStrictEqual('mock-random-id');
      });

      it('commits add with the notification', async() => {
        const notification = makeNotification({ id: 'n1' });

        await actions.add(
          {
            commit: mockCommit, dispatch: mockDispatch, getters: mockGetters
          },
          notification
        );

        expect(mockCommit).toHaveBeenCalledWith('add', notification);
      });

      it('dispatches growl/notification with root:true', async() => {
        const notification = makeNotification({ id: 'n1' });

        await actions.add(
          {
            commit: mockCommit, dispatch: mockDispatch, getters: mockGetters
          },
          notification
        );

        expect(mockDispatch).toHaveBeenCalledWith('growl/notification', notification, { root: true });
      });

      it('returns the notification id', async() => {
        const result = await actions.add(
          {
            commit: mockCommit, dispatch: mockDispatch, getters: mockGetters
          },
          makeNotification({ id: 'n1' })
        );

        expect(result).toStrictEqual('n1');
      });

      it('saves the encrypted notification to localStorage', async() => {
        const setItemSpy = jest.spyOn(Storage.prototype, 'setItem');

        await actions.add(
          {
            commit: mockCommit, dispatch: mockDispatch, getters: mockGetters
          },
          makeNotification({ id: 'n1' })
        );

        expect(setItemSpy).toHaveBeenCalledWith(
          'rancher-notifications-test-n1',
          JSON.stringify({ iv: 'test-iv', data: 'test-data' })
        );
        setItemSpy.mockRestore();
      });
    });

    describe('fromGrowl', () => {
      it('always assigns a new id via randomStr', async() => {
        const notification = makeNotification({ id: 'original-id' });

        await actions.fromGrowl({ commit: mockCommit, getters: mockGetters }, notification);

        expect(notification.id).toStrictEqual('mock-random-id');
      });

      it('commits add with the notification', async() => {
        const notification = makeNotification({ id: 'n1' });

        await actions.fromGrowl({ commit: mockCommit, getters: mockGetters }, notification);

        expect(mockCommit).toHaveBeenCalledWith('add', notification);
      });

      it('returns the new notification id', async() => {
        const result = await actions.fromGrowl(
          { commit: mockCommit, getters: mockGetters },
          makeNotification({ id: 'original' })
        );

        expect(result).toStrictEqual('mock-random-id');
      });
    });

    describe('update', () => {
      it('commits update with the notification', () => {
        const notification = makeNotification({ id: 'n1', title: 'updated' });

        actions.update({ commit: mockCommit, getters: mockGetters }, notification);

        expect(mockCommit).toHaveBeenCalledWith('update', notification);
      });
    });

    describe('markRead', () => {
      it('commits markRead with the notification id', async() => {
        await actions.markRead(
          {
            commit: mockCommit, dispatch: mockDispatch, getters: mockGetters
          },
          'n1'
        );

        expect(mockCommit).toHaveBeenCalledWith('markRead', 'n1');
      });

      it('dispatches prefs/set when the notification has a preference', async() => {
        const pref = { key: 'some-pref', value: 'on' };

        mockGetters.item = jest.fn(() => makeStoredNotification({ id: 'n1', preference: pref }));

        await actions.markRead(
          {
            commit: mockCommit, dispatch: mockDispatch, getters: mockGetters
          },
          'n1'
        );

        expect(mockDispatch).toHaveBeenCalledWith('prefs/set', pref, { root: true });
      });

      it('does not dispatch when the notification has no preference', async() => {
        mockGetters.item = jest.fn(() => makeStoredNotification({ id: 'n1' }));

        await actions.markRead(
          {
            commit: mockCommit, dispatch: mockDispatch, getters: mockGetters
          },
          'n1'
        );

        expect(mockDispatch).not.toHaveBeenCalled();
      });

      it('calls the extension handler when the notification has a handlerName', async() => {
        const mockOnReadUpdated = jest.fn().mockResolvedValue(undefined);
        const mockExtension = { getDynamic: jest.fn(() => ({ onReadUpdated: mockOnReadUpdated })) };

        mockGetters.item = jest.fn(() => makeStoredNotification({ id: 'n1', handlerName: 'my-handler' }));

        await actions.markRead.call(
          { $extension: mockExtension },
          {
            commit: mockCommit, dispatch: mockDispatch, getters: mockGetters
          },
          'n1'
        );

        expect(mockOnReadUpdated).toHaveBeenCalledWith(
          expect.objectContaining({ id: 'n1' }),
          true
        );
      });
    });

    describe('markUnread', () => {
      it('commits markUnread with the notification id', async() => {
        await actions.markUnread(
          {
            commit: mockCommit, dispatch: mockDispatch, getters: mockGetters
          },
          'n1'
        );

        expect(mockCommit).toHaveBeenCalledWith('markUnread', 'n1');
      });

      it.each([
        {
          desc: 'uses unsetValue when the preference has one',
          pref: {
            key: 'k', value: 'on', unsetValue: 'off'
          },
          expected: { key: 'k', value: 'off' },
        },
        {
          desc:     'falls back to empty string when no unsetValue is set',
          pref:     { key: 'k', value: 'on' },
          expected: { key: 'k', value: '' },
        },
      ])('dispatches prefs/set: $desc', async({ pref, expected }) => {
        mockGetters.item = jest.fn(() => makeStoredNotification({ id: 'n1', preference: pref }));

        await actions.markUnread(
          {
            commit: mockCommit, dispatch: mockDispatch, getters: mockGetters
          },
          'n1'
        );

        expect(mockDispatch).toHaveBeenCalledWith('prefs/set', expected, { root: true });
      });
    });

    describe('markAllRead', () => {
      it('commits markAllRead', async() => {
        await actions.markAllRead({
          commit: mockCommit, dispatch: mockDispatch, getters: mockGetters
        });

        expect(mockCommit).toHaveBeenCalledWith('markAllRead');
      });

      it('dispatches prefs/set for every notification with a preference', async() => {
        const pref1 = { key: 'pref-1', value: 'on' };
        const pref2 = { key: 'pref-2', value: 'off' };

        mockGetters.all = [
          makeStoredNotification({ id: 'n1', preference: pref1 }),
          makeStoredNotification({ id: 'n2' }),
          makeStoredNotification({ id: 'n3', preference: pref2 }),
        ];

        await actions.markAllRead({
          commit: mockCommit, dispatch: mockDispatch, getters: mockGetters
        });

        expect(mockDispatch).toHaveBeenCalledWith('prefs/set', pref1, { root: true });
        expect(mockDispatch).toHaveBeenCalledWith('prefs/set', pref2, { root: true });
        expect(mockDispatch).toHaveBeenCalledTimes(2);
      });

      it('calls handlers for notifications with a handlerName', async() => {
        const mockOnReadUpdated = jest.fn().mockResolvedValue(undefined);
        const mockExtension = { getDynamic: jest.fn(() => ({ onReadUpdated: mockOnReadUpdated })) };

        mockGetters.all = [
          makeStoredNotification({ id: 'n1', handlerName: 'handler-a' }),
          makeStoredNotification({ id: 'n2' }),
        ];

        await actions.markAllRead.call(
          { $extension: mockExtension },
          {
            commit: mockCommit, dispatch: mockDispatch, getters: mockGetters
          }
        );

        expect(mockOnReadUpdated).toHaveBeenCalledTimes(1);
        expect(mockOnReadUpdated).toHaveBeenCalledWith(
          expect.objectContaining({ id: 'n1' }),
          true
        );
      });
    });

    describe('remove', () => {
      it('commits remove with the notification id', () => {
        actions.remove({ commit: mockCommit, getters: mockGetters }, 'n1');

        expect(mockCommit).toHaveBeenCalledWith('remove', 'n1');
      });
    });

    describe('clearAll', () => {
      it('commits clearAll', () => {
        actions.clearAll({ commit: mockCommit, getters: mockGetters });

        expect(mockCommit).toHaveBeenCalledWith('clearAll');
      });
    });

    describe('init', () => {
      let MockBroadcastChannel: jest.Mock;
      let mockBcInstance: any;

      beforeEach(() => {
        mockBcInstance = {
          onmessage:   null as any,
          postMessage: jest.fn(),
        };
        MockBroadcastChannel = jest.fn(() => mockBcInstance);
        (global as any).BroadcastChannel = MockBroadcastChannel;
      });

      it.each([
        {
          desc:     'userKey is missing',
          userData: { id: '', user: { metadata: { uid: 'u1' } } },
        },
        {
          desc:     'userId is missing',
          userData: { id: 'key1', user: { metadata: {} } },
        },
      ])('returns without committing when $desc', async({ userData }) => {
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

        await actions.init({ commit: mockCommit, getters: mockGetters }, userData);

        expect(mockCommit).not.toHaveBeenCalled();
        consoleErrorSpy.mockRestore();
      });

      it('commits localStorageKey and userId for valid user data', async() => {
        await actions.init({ commit: mockCommit, getters: mockGetters }, {
          id:   'user-key',
          user: { metadata: { uid: 'user-uid' } },
        });

        expect(mockCommit).toHaveBeenCalledWith('localStorageKey', 'hash-user-key');
        expect(mockCommit).toHaveBeenCalledWith('userId', 'user-uid');
      });

      it('commits encryptionKey from the deriveKey result', async() => {
        await actions.init({ commit: mockCommit, getters: mockGetters }, {
          id:   'user-key',
          user: { metadata: { uid: 'user-uid' } },
        });

        expect(mockCommit).toHaveBeenCalledWith('encryptionKey', mockKey);
      });

      it('returns early without loading notifications when deriveKey fails', async() => {
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

        mockDeriveKey.mockRejectedValue(new Error('derive failed'));

        await actions.init({ commit: mockCommit, getters: mockGetters }, {
          id:   'user-key',
          user: { metadata: { uid: 'user-uid' } },
        });

        expect(mockCommit).not.toHaveBeenCalledWith('load', expect.anything());
        consoleErrorSpy.mockRestore();
      });

      it('loads and decrypts notifications from localStorage', async() => {
        const createdDate = new Date().toISOString();
        const indexEntry = {
          id:      'n1',
          created: createdDate,
          read:    false,
        };

        mockGetters.localStorageKey = 'rancher-notifications-test';
        localStorage.setItem('rancher-notifications-test', JSON.stringify([indexEntry]));
        localStorage.setItem('rancher-notifications-test-n1', JSON.stringify({ iv: 'iv', data: 'enc' }));
        mockDecrypt.mockResolvedValue(JSON.stringify({ title: 'decrypted', level: NotificationLevel.Info }));

        await actions.init({ commit: mockCommit, getters: mockGetters }, {
          id:   'user-key',
          user: { metadata: { uid: 'user-uid' } },
        });

        const loadCall = mockCommit.mock.calls.find((c) => c[0] === 'load');

        expect(loadCall).toBeDefined();
        expect(loadCall![1]).toStrictEqual([{
          id:      'n1',
          created: createdDate,
          read:    false,
          title:   'decrypted',
          level:   NotificationLevel.Info,
        }]);
      });

      it('filters out notifications older than 14 days', async() => {
        const expiredDate = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString();
        const indexEntry = {
          id:      'old',
          created: expiredDate,
          read:    false,
        };

        mockGetters.localStorageKey = 'rancher-notifications-test';
        localStorage.setItem('rancher-notifications-test', JSON.stringify([indexEntry]));
        localStorage.setItem('rancher-notifications-test-old', JSON.stringify({ iv: 'iv', data: 'enc' }));

        await actions.init({ commit: mockCommit, getters: mockGetters }, {
          id:   'user-key',
          user: { metadata: { uid: 'user-uid' } },
        });

        const loadCall = mockCommit.mock.calls.find((c) => c[0] === 'load');

        expect(loadCall).toBeDefined();
        expect(loadCall![1]).toStrictEqual([]);
      });

      it('sets up a BroadcastChannel listener', async() => {
        await actions.init({ commit: mockCommit, getters: mockGetters }, {
          id:   'user-key',
          user: { metadata: { uid: 'user-uid' } },
        });

        expect(MockBroadcastChannel).toHaveBeenCalledWith('rancher-notification-sync');
        expect(typeof mockBcInstance.onmessage).toStrictEqual('function');
      });

      it('commits the operation from a matching broadcast message', async() => {
        await actions.init({ commit: mockCommit, getters: mockGetters }, {
          id:   'user-key',
          user: { metadata: { uid: 'user-uid' } },
        });

        mockCommit.mockClear();
        mockBcInstance.onmessage({
          data: {
            userId:    'user-uid',
            operation: 'add',
            param:     { id: 'n99' },
          },
        });

        expect(mockCommit).toHaveBeenCalledWith('add', { id: 'n99' });
      });

      it('ignores broadcast messages when the userId does not match', async() => {
        await actions.init({ commit: mockCommit, getters: mockGetters }, {
          id:   'user-key',
          user: { metadata: { uid: 'user-uid' } },
        });

        mockCommit.mockClear();
        mockBcInstance.onmessage({
          data: {
            userId:    'other-user',
            operation: 'add',
            param:     { id: 'n99' },
          },
        });

        expect(mockCommit).not.toHaveBeenCalled();
      });
    });
  });
});
