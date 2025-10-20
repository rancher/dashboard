import { importTypes } from '@rancher/auto-import';
import { IPlugin, PanelLocation } from '@shell/core/types';
import { installDocHandler } from './docs';

import routing from './routing/index';
import { useI18n } from '@shell/composables/useI18n';
import { usePrimeRegistration } from './pages/registration.composable';
import { type Store } from 'vuex';
import { NotificationLevel } from '@shell/types/notifications';
import { REGISTRATION_NOTIFICATION_ID } from './config/constants';

/**
 * Trigger notification on plugin loaded and no active registration is found.
 * @param store
 */
const setNotification = (store: Store<any>) => {
  const {
    registration,
    initRegistration,
  } = usePrimeRegistration(store);

  initRegistration().then(() => {
    if (!registration.value.active) {
      const { t } = useI18n(store);

      const notification = {
        level:         NotificationLevel.Info,
        title:         t('registration.notification.title'),
        message:       t('registration.notification.message'),
        progress:      0,
        primaryAction: {
          label: t('registration.notification.button.primary.label'),
          route: '/c/local/settings/registration'
        },
        id: REGISTRATION_NOTIFICATION_ID,
      };

      store.dispatch('notifications/add', notification);
    } else {
      store.dispatch('notifications/remove', REGISTRATION_NOTIFICATION_ID);
    }
  });
};

/**
 * Pool managementReady till true, then notify the user if no active registration is found
 * @param store
 */
const poolRegistration = (store: Store<any>) => {
  let attempts = 10;
  const id = setInterval(() => {
    if (attempts <= 0) {
      clearInterval(id);
    }
    if (store.state['managementReady']) {
      setNotification(store);
      clearInterval(id);
      attempts -= 1;
    }
  }, 1000);
};

// Init the package
export default function(plugin: IPlugin) {
  if (!plugin.environment.isPrime) {
    return false;
  }

  // Auto-import model, detail, edit from the folders
  importTypes(plugin);

  // Provide plugin metadata from package.json
  plugin.metadata = require('./package.json');

  // Built-in icon
  plugin.metadata.icon = require('./assets/rancher-prime.svg');

  // Add the handler that will intercept and replace doc links with their Prime doc counterpart
  installDocHandler(plugin);

  // Load the navigation page
  plugin.addProduct(require('./config/navigation'));

  // Add routes
  plugin.addRoutes(routing);

  // About page panel
  plugin.addPanel(PanelLocation.ABOUT_TOP, {}, { component: () => import('./components/AboutPanel.vue') });

  plugin.addNavHooks({
    onLogin: async(store: any) => {
      poolRegistration(store);
    }
  });
}
