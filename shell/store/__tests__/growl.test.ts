import { state, getters, mutations, actions } from '@shell/store/growl';
import { NotificationLevel } from '@shell/types/notifications';

describe('growl store', () => {
  describe('state', () => {
    it('returns initial state with nextId=1 and empty stack', () => {
      const result = state();

      expect(result.nextId).toStrictEqual(1);
      expect(result.stack).toStrictEqual([]);
    });
  });

  describe('getters', () => {
    const item1 = {
      id: 1, color: 'success', title: 'item 1'
    };
    const item2 = {
      id: 2, color: 'error', title: 'item 2'
    };
    let mockState: ReturnType<typeof state>;

    beforeEach(() => {
      mockState = state();
      mockState.stack = [item1, item2];
    });

    describe('find', () => {
      it('finds an item by key and value', () => {
        const result = getters.find(mockState)({ key: 'color', val: 'error' });

        expect(result).toStrictEqual(item2);
      });

      it('returns undefined when no item matches', () => {
        const result = getters.find(mockState)({ key: 'color', val: 'warning' });

        expect(result).toBeUndefined();
      });
    });

    describe('byId', () => {
      it('finds an item by id', () => {
        const result = getters.byId(mockState)(2);

        expect(result).toStrictEqual(item2);
      });

      it('returns undefined when id not found', () => {
        const result = getters.byId(mockState)(99);

        expect(result).toBeUndefined();
      });
    });
  });

  describe('mutations', () => {
    describe('add', () => {
      it('adds an item to the front of the stack', () => {
        const s = state();

        mutations.add(s, { title: 'hello' });

        expect(s.stack).toHaveLength(1);
        expect(s.stack[0]).toMatchObject({ title: 'hello' });
      });

      it('assigns auto-incremented ids and updates nextId', () => {
        const s = state();

        mutations.add(s, { title: 'first' });
        mutations.add(s, { title: 'second' });

        expect(s.stack[1].id).toStrictEqual(1);
        expect(s.stack[0].id).toStrictEqual(2);
        expect(s.nextId).toStrictEqual(3);
      });

      it('sets the started timestamp on the new item', () => {
        const s = state();
        const before = Date.now();

        mutations.add(s, { title: 'timed' });

        const after = Date.now();

        expect(s.stack[0].started).toBeGreaterThanOrEqual(before);
        expect(s.stack[0].started).toBeLessThanOrEqual(after);
      });

      it('prepends new items so the most recent is first', () => {
        const s = state();

        mutations.add(s, { title: 'first' });
        mutations.add(s, { title: 'second' });

        expect(s.stack[0].title).toStrictEqual('second');
        expect(s.stack[1].title).toStrictEqual('first');
      });

      it('removes the oldest item when the stack reaches MAX_GROWLS (5)', () => {
        const s = state();

        for (let i = 0; i < 5; i++) {
          mutations.add(s, { title: `item-${ i }` });
        }

        mutations.add(s, { title: 'overflow' });

        expect(s.stack).toHaveLength(5);
        expect(s.stack[0].title).toStrictEqual('overflow');
      });
    });

    describe('remove', () => {
      it('removes an item from the stack by id', () => {
        const s = state();

        mutations.add(s, { title: 'to remove' });
        const { id } = s.stack[0];

        mutations.remove(s, id);

        expect(s.stack).toHaveLength(0);
      });

      it('is a no-op when the id does not exist', () => {
        const s = state();

        mutations.add(s, { title: 'keep' });
        mutations.remove(s, 999);

        expect(s.stack).toHaveLength(1);
      });
    });

    describe('clear', () => {
      it('empties the stack', () => {
        const s = state();

        mutations.add(s, { title: 'a' });
        mutations.add(s, { title: 'b' });
        mutations.clear(s);

        expect(s.stack).toHaveLength(0);
      });
    });
  });

  describe('actions', () => {
    let commit: jest.Mock;
    let dispatch: jest.Mock;

    beforeEach(() => {
      commit = jest.fn();
      dispatch = jest.fn();
    });

    describe('clear', () => {
      it('commits the clear mutation', async() => {
        await actions.clear({ commit } as any);

        expect(commit).toHaveBeenCalledWith('clear');
      });
    });

    describe('remove', () => {
      it('commits the remove mutation with the given id', async() => {
        await actions.remove({ commit } as any, 42);

        expect(commit).toHaveBeenCalledWith('remove', 42);
      });
    });

    describe('close', () => {
      it('removes the growl and dispatches notifications/markRead when the growl has a notification', async() => {
        const notifId = 'notif-123';
        const mockGetters = { byId: jest.fn().mockReturnValue({ notification: notifId }) };

        dispatch.mockResolvedValue(undefined);

        await actions.close({
          commit, dispatch, getters: mockGetters
        } as any, 7);

        expect(commit).toHaveBeenCalledWith('remove', 7);
        expect(dispatch).toHaveBeenCalledWith('notifications/markRead', notifId, { root: true });
      });

      it('removes the growl without dispatching when the growl has no notification', async() => {
        const mockGetters = { byId: jest.fn().mockReturnValue({ notification: undefined }) };

        await actions.close({
          commit, dispatch, getters: mockGetters
        } as any, 3);

        expect(commit).toHaveBeenCalledWith('remove', 3);
        expect(dispatch).not.toHaveBeenCalled();
      });
    });

    describe('success', () => {
      it('dispatches notifications/fromGrowl with Success level and commits add with success styling', async() => {
        const mockNotification = 'notif-success';

        dispatch.mockResolvedValue(mockNotification);

        await actions.success({ commit, dispatch } as any, { title: 'Done', message: 'ok' });

        expect(dispatch).toHaveBeenCalledWith('notifications/fromGrowl', {
          title:   'Done',
          message: 'ok',
          level:   NotificationLevel.Success,
        }, { root: true });
        expect(commit).toHaveBeenCalledWith('add', {
          color:        'success',
          icon:         'checkmark',
          timeout:      5000,
          notification: mockNotification,
          title:        'Done',
          message:      'ok',
        });
      });
    });

    describe('info', () => {
      it('commits add with info styling without dispatching a notification', async() => {
        await actions.info({ commit } as any, { title: 'FYI', message: 'just info' });

        expect(dispatch).not.toHaveBeenCalled();
        expect(commit).toHaveBeenCalledWith('add', {
          color:   'info',
          icon:    'info',
          timeout: 5000,
          title:   'FYI',
          message: 'just info',
        });
      });
    });

    describe('warning', () => {
      it('dispatches notifications/fromGrowl with Warning level and commits add with warning styling', async() => {
        const mockNotification = 'notif-warning';

        dispatch.mockResolvedValue(mockNotification);

        await actions.warning({ commit, dispatch } as any, { title: 'Careful', message: 'watch out' });

        expect(dispatch).toHaveBeenCalledWith('notifications/fromGrowl', {
          title:   'Careful',
          message: 'watch out',
          level:   NotificationLevel.Warning,
        }, { root: true });
        expect(commit).toHaveBeenCalledWith('add', {
          color:        'warning',
          icon:         'warning',
          timeout:      5000,
          notification: mockNotification,
          title:        'Careful',
          message:      'watch out',
        });
      });
    });

    describe('error', () => {
      it('dispatches notifications/fromGrowl with Error level and commits add with error styling', async() => {
        const mockNotification = 'notif-error';

        dispatch.mockResolvedValue(mockNotification);

        await actions.error({ commit, dispatch } as any, { title: 'Oops', message: 'failed' });

        expect(dispatch).toHaveBeenCalledWith('notifications/fromGrowl', {
          title:   'Oops',
          message: 'failed',
          level:   NotificationLevel.Error,
        }, { root: true });
        expect(commit).toHaveBeenCalledWith('add', {
          color:        'error',
          icon:         'error',
          timeout:      5000,
          notification: mockNotification,
          title:        'Oops',
          message:      'failed',
        });
      });
    });

    describe('fromError', () => {
      it('dispatches fromGrowl with the stringified error message and commits add with error styling', async() => {
        const mockNotification = 'notif-from-error';

        dispatch.mockResolvedValue(mockNotification);

        const err = new Error('something broke');

        await actions.fromError({ commit, dispatch } as any, { title: 'Error title', err });

        expect(dispatch).toHaveBeenCalledWith('notifications/fromGrowl', {
          title:   'Error title',
          message: 'something broke',
          level:   NotificationLevel.Error,
        }, { root: true });
        expect(commit).toHaveBeenCalledWith('add', {
          color:        'error',
          icon:         'error',
          timeout:      5000,
          notification: mockNotification,
          title:        'Error title',
          message:      'something broke',
        });
      });
    });

    describe('notification', () => {
      it.each([
        {
          desc:  'Success level',
          level: NotificationLevel.Success,
          color: 'success',
          icon:  'checkmark',
        },
        {
          desc:  'Warning level',
          level: NotificationLevel.Warning,
          color: 'warning',
          icon:  'warning',
        },
        {
          desc:  'Error level',
          level: NotificationLevel.Error,
          color: 'error',
          icon:  'error',
        },
      ])('commits add for $desc', ({ level, color, icon }) => {
        const notif = {
          id:      'n1',
          title:   'test',
          message: 'msg',
          level,
        };

        actions.notification({ commit } as any, notif);

        expect(commit).toHaveBeenCalledWith('add', {
          title:        'test',
          message:      'msg',
          notification: 'n1',
          timeout:      5000,
          color,
          icon,
        });
      });

      it.each([
        { desc: 'Info level', level: NotificationLevel.Info },
        { desc: 'Announcement level', level: NotificationLevel.Announcement },
        { desc: 'Task level', level: NotificationLevel.Task },
        { desc: 'Hidden level', level: NotificationLevel.Hidden },
      ])('skips commit for $desc', ({ level }) => {
        const notif = {
          id:      'n1',
          title:   'test',
          message: 'msg',
          level,
        };

        actions.notification({ commit } as any, notif);

        expect(commit).not.toHaveBeenCalled();
      });
    });
  });
});
