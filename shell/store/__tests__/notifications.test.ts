import { getters, mutations, state } from '@shell/store/notifications';
import { NotificationLevel, Notification, StoredNotification } from '@shell/types/notifications';

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
});
