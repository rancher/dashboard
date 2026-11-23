import { MANAGEMENT } from '@shell/config/types';
import { SETTING } from '@shell/config/settings';
import { NAME as SETTINGS_PRODUCT } from '@shell/config/product/settings';
import { _EDIT, MODE } from '@shell/config/query-params';
import { READ_CLASSIC_THEME_REMOVED } from '@shell/store/prefs';
import { NotificationLevel } from '@shell/types/notifications';

export const CLASSIC_THEME_REMOVED_NOTIFICATION = 'classic-theme-removed';

const CLASSIC = 'classic';

/**
 * Tell those who can change the `ui-brand` setting, once, that its `classic` theme has been removed.
 * The notification goes away if the setting no longer asks for it.
 *
 * @param brandSetting the `ui-brand` setting
 */
export async function updateClassicThemeRemovedNotification(dispatch: any, getters: any, brandSetting?: { value?: string, canUpdate?: boolean }): Promise<void> {
  const existing = getters['notifications/item'](CLASSIC_THEME_REMOVED_NOTIFICATION);

  if (brandSetting?.value !== CLASSIC || !brandSetting.canUpdate) {
    if (existing) {
      await dispatch('notifications/remove', CLASSIC_THEME_REMOVED_NOTIFICATION);
    }

    return;
  }

  if (existing || getters['prefs/get'](READ_CLASSIC_THEME_REMOVED)) {
    return;
  }

  const t = getters['i18n/t'];

  await dispatch('notifications/add', {
    id:         CLASSIC_THEME_REMOVED_NOTIFICATION,
    level:      NotificationLevel.Announcement,
    title:      t('branding.classicThemeRemoved.title'),
    message:    t('branding.classicThemeRemoved.message'),
    preference: {
      key:   READ_CLASSIC_THEME_REMOVED,
      value: 'true'
    },
    primaryAction: {
      label: t('branding.classicThemeRemoved.editSetting'),
      route: {
        name:   'c-cluster-product-resource-id',
        params: {
          cluster: 'local', product: SETTINGS_PRODUCT, resource: MANAGEMENT.SETTING, id: SETTING.BRAND
        },
        query: { [MODE]: _EDIT }
      }
    }
  });
}
