import { Notification } from '@shell/types/notifications';
import { READ_ANNOUNCEMENTS } from '@shell/store/prefs';
import { createHandler, DynamicContentAnnouncementHandlerName } from '../notification-handler';
import { ANNOUNCEMENT_PREFIX } from '../announcement';

function makeStore(prefValue: string, notificationsAll: any[] = []) {
  const dispatch = jest.fn();
  const store = {
    getters: {
      'notifications/all': notificationsAll,
      'prefs/get':         jest.fn().mockReturnValue(prefValue),
    },
    dispatch,
  };

  return { store, dispatch };
}

function makeNotification(id: string): Notification {
  return {
    id,
    level:   0,
    title:   'Test',
    message: '',
  };
}

describe('notification-handler', () => {
  describe('DynamicContentAnnouncementHandlerName', () => {
    it('has the expected constant value', () => {
      expect(DynamicContentAnnouncementHandlerName).toStrictEqual('dc-announcements');
    });
  });

  describe('createHandler', () => {
    it('returns an object with an onReadUpdated method', () => {
      const { store } = makeStore('');
      const handler = createHandler(store);

      expect(typeof handler.onReadUpdated).toStrictEqual('function');
    });

    describe('onReadUpdated', () => {
      describe('non-announcement notifications', () => {
        it.each([
          {
            desc: 'arbitrary id',
            id:   'some-notification-id',
          },
          {
            desc: 'empty id',
            id:   '',
          },
          {
            desc: 'id with announcement substring but not prefix',
            id:   `not-${ ANNOUNCEMENT_PREFIX }foo`,
          },
        ])('does not dispatch when notification id is "$id" ($desc)', async({ id }) => {
          const { store, dispatch } = makeStore('');
          const handler = createHandler(store);

          await handler.onReadUpdated(makeNotification(id), true);

          expect(dispatch).not.toHaveBeenCalled();
        });
      });

      describe('marking announcement as read (read=true)', () => {
        it.each([
          {
            desc:           'empty pref stores single id',
            prefValue:      '',
            announcementId: 'foo',
            expected:       'foo',
          },
          {
            desc:           'pref with other values adds id sorted',
            prefValue:      'abc,xyz',
            announcementId: 'bar',
            expected:       'abc,bar,xyz',
          },
          {
            desc:           'id already present is not duplicated',
            prefValue:      'foo',
            announcementId: 'foo',
            expected:       'foo',
          },
          {
            desc:           'new value sorts into correct lexicographic position',
            prefValue:      'alpha,zeta',
            announcementId: 'beta',
            expected:       'alpha,beta,zeta',
          },
          {
            desc:           'single char id added to empty pref',
            prefValue:      '',
            announcementId: 'a',
            expected:       'a',
          },
        ])('$desc', async({ prefValue, announcementId, expected }) => {
          const { store, dispatch } = makeStore(prefValue);
          const handler = createHandler(store);
          const notification = makeNotification(`${ ANNOUNCEMENT_PREFIX }${ announcementId }`);

          await handler.onReadUpdated(notification, true);

          expect(dispatch).toHaveBeenCalledWith('prefs/set', {
            key:   READ_ANNOUNCEMENTS,
            value: expected,
          });
        });
      });

      describe('marking announcement as unread (read=false)', () => {
        it.each([
          {
            desc:           'id in pref is removed',
            prefValue:      'foo',
            announcementId: 'foo',
            expected:       '',
          },
          {
            desc:           'id in multi-value pref is removed leaving others',
            prefValue:      'bar,foo,xyz',
            announcementId: 'foo',
            expected:       'bar,xyz',
          },
          {
            desc:           'id not in pref leaves pref unchanged',
            prefValue:      'bar,baz',
            announcementId: 'foo',
            expected:       'bar,baz',
          },
          {
            desc:           'empty pref dispatches empty string',
            prefValue:      '',
            announcementId: 'foo',
            expected:       '',
          },
        ])('$desc', async({ prefValue, announcementId, expected }) => {
          const { store, dispatch } = makeStore(prefValue);
          const handler = createHandler(store);
          const notification = makeNotification(`${ ANNOUNCEMENT_PREFIX }${ announcementId }`);

          await handler.onReadUpdated(notification, false);

          expect(dispatch).toHaveBeenCalledWith('prefs/set', {
            key:   READ_ANNOUNCEMENTS,
            value: expected,
          });
        });
      });

      describe('dispatch call details', () => {
        it('uses READ_ANNOUNCEMENTS as the preference key', async() => {
          const { store, dispatch } = makeStore('');
          const handler = createHandler(store);

          await handler.onReadUpdated(makeNotification(`${ ANNOUNCEMENT_PREFIX }test-id`), true);

          expect(dispatch).toHaveBeenCalledWith('prefs/set', expect.objectContaining({ key: READ_ANNOUNCEMENTS }));
        });

        it('strips the announcement prefix from the stored id', async() => {
          const { store, dispatch } = makeStore('');
          const handler = createHandler(store);

          await handler.onReadUpdated(makeNotification(`${ ANNOUNCEMENT_PREFIX }my-announcement`), true);

          expect(dispatch).toHaveBeenCalledWith('prefs/set', {
            key:   READ_ANNOUNCEMENTS,
            value: 'my-announcement',
          });
        });
      });

      describe('interaction with existing notifications', () => {
        it('calls notifications/all getter to retrieve current announcements', async() => {
          const notificationsAll = [
            { id: `${ ANNOUNCEMENT_PREFIX }existing` },
            { id: 'other-notification' },
          ];
          const { store, dispatch } = makeStore('existing', notificationsAll);
          const handler = createHandler(store);

          await handler.onReadUpdated(makeNotification(`${ ANNOUNCEMENT_PREFIX }new`), true);

          expect(dispatch).toHaveBeenCalledWith('prefs/set', {
            key:   READ_ANNOUNCEMENTS,
            value: 'existing,new',
          });
        });
      });
    });
  });
});
