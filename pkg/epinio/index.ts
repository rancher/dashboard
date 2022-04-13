import { importTypes } from '@rancher/auto-import';
import { IPlugin, OnNavToPackage, OnNavAwayFromPackage, OnLogOut } from '@shell/core/types';
import epinioStore from './store/epinio-store';
import epinioMgmtStore from './store/epinio-mgmt-store';
import epinioRoutes from './routing/epinio-routing';

import enUS from './translations/en-us.yaml';

// TODO: RC rename plugin-dev to `dev-2.6.6`
// TODO: RC merge latest master
// TODO: RC review old epinio PRs comments

// Init the package
export default function(plugin: IPlugin) {
  // Auto-import model, detail, edit from the folders
  importTypes(plugin);

  // Provide plugin metadata from package.json
  plugin.metadata = require('./package.json');

  plugin.addI18n('en-us', enUS);

  // Load a product
  plugin.addProduct(require('./config/epinio'));

  plugin.addDashboardStore(epinioMgmtStore.config.namespace, epinioMgmtStore.specifics, epinioMgmtStore.config);
  plugin.addDashboardStore(epinioStore.config.namespace, epinioStore.specifics, epinioStore.config);

  epinioRoutes.forEach(route => plugin.addRoute(route));

  const onEnter: OnNavToPackage = async(store, config) => {
    await store.dispatch(`${ epinioStore.config.namespace }/loadManagement`);
  };
  const onLeave: OnNavAwayFromPackage = async(store, config) => {
    // TODO: RC Is this needed?
    await store.dispatch(`${ epinioStore.config.namespace }/unsubscribe`);
    await store.commit(`${ epinioStore.config.namespace }/reset`);
  };

  const onLogOut: OnLogOut = async(store) => {
    // TODO: RC iterate over all stores call on log out. check if exists in onLogoutPkg action
    await store.dispatch(`${ epinioMgmtStore.config.namespace }/onLogout`);
    await store.dispatch(`${ epinioStore.config.namespace }/onLogout`);
  };

  plugin.addNavHooks(onEnter, onLeave, onLogOut);

  // TODO: RC Q Neil custom components #2 couldn't get these to work, had to match dynamic-importer
  // import appLogs from './components/windowComponent/ApplicationLogs.vue';
  // import appShell from './components/windowComponent/ApplicationShell.vue';

  /* ?? webpackChunkName: "components/nav/WindowManager" */

  plugin.register('windowComponent', 'ApplicationLogs', () => import(`./components/windowComponent/ApplicationLogs.vue`));
  plugin.register('windowComponent', 'ApplicationShell', () => import(`./components/windowComponent/ApplicationShell.vue`));
}
