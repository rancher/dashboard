import { CLASSIC_THEME_REMOVED_NOTIFICATION, updateClassicThemeRemovedNotification } from '@shell/utils/classic-theme-removed';
import { NotificationLevel } from '@shell/types/notifications';

const READ_KEY = 'read-classic-theme-removed';

function makeGetters({ existing, read = '' }: { existing?: object, read?: string } = {}) {
  return {
    'notifications/item': (id: string) => (id === CLASSIC_THEME_REMOVED_NOTIFICATION ? existing : undefined),
    'prefs/get':          (key: string) => (key === READ_KEY ? read : ''),
    'i18n/t':             (key: string) => key,
  };
}

describe('updateClassicThemeRemovedNotification', () => {
  it('should add the notification when ui-brand is classic and the user can change it', async() => {
    const dispatch = jest.fn();

    await updateClassicThemeRemovedNotification(dispatch, makeGetters(), { value: 'classic', canUpdate: true });

    expect(dispatch).toHaveBeenCalledWith('notifications/add', {
      id:            CLASSIC_THEME_REMOVED_NOTIFICATION,
      level:         NotificationLevel.Announcement,
      title:         'branding.classicThemeRemoved.title',
      message:       'branding.classicThemeRemoved.message',
      preference:    { key: READ_KEY, value: 'true' },
      primaryAction: {
        label: 'branding.classicThemeRemoved.editSetting',
        route: {
          name:   'c-cluster-product-resource-id',
          params: {
            cluster: 'local', product: 'settings', resource: 'management.cattle.io.setting', id: 'ui-brand'
          },
          query: { mode: 'edit' }
        }
      }
    });
  });

  it('should not add the notification again once it has been read', async() => {
    const dispatch = jest.fn();

    await updateClassicThemeRemovedNotification(dispatch, makeGetters({ read: 'true' }), { value: 'classic', canUpdate: true });

    expect(dispatch).toHaveBeenCalledTimes(0);
  });

  it('should not add a second notification while one is shown', async() => {
    const dispatch = jest.fn();

    await updateClassicThemeRemovedNotification(dispatch, makeGetters({ existing: { id: CLASSIC_THEME_REMOVED_NOTIFICATION } }), { value: 'classic', canUpdate: true });

    expect(dispatch).toHaveBeenCalledTimes(0);
  });

  it.each([
    ['ui-brand is suse', { value: 'suse', canUpdate: true }],
    ['ui-brand is empty', { value: '', canUpdate: true }],
    ['ui-brand is classic but the user cannot change it', { value: 'classic', canUpdate: false }],
    ['there is no ui-brand setting', undefined],
  ])('should not add the notification when %s', async(_, brandSetting) => {
    const dispatch = jest.fn();

    await updateClassicThemeRemovedNotification(dispatch, makeGetters(), brandSetting);

    expect(dispatch).toHaveBeenCalledTimes(0);
  });

  it('should remove a shown notification once ui-brand is no longer classic', async() => {
    const dispatch = jest.fn();

    await updateClassicThemeRemovedNotification(dispatch, makeGetters({ existing: { id: CLASSIC_THEME_REMOVED_NOTIFICATION } }), { value: 'suse', canUpdate: true });

    expect(dispatch).toHaveBeenCalledWith('notifications/remove', CLASSIC_THEME_REMOVED_NOTIFICATION);
  });
});
