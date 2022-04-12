import { importTypes } from '@rancher/auto-import';
import { IPlugin, OnNavToPackage, OnNavAwayFromPackage, OnLogOut } from '@shell/core/types';
import epinioStore from './store/epinio-store';
import epinioMgmtStore from './store/epinio-mgmt-store';
import epinioRoutes from './routing/epinio-routing';

import enUS from './translations/en-us.yaml';

// Init the package
export default function(plugin: IPlugin) {
  // Auto-import model, detail, edit from the folders
  importTypes(plugin);

  // Provide plugin metadata from package.json
  plugin.metadata = require('./package.json');

  plugin.metadata.description = 'Application Development Engine for Kubernetes';
  plugin.metadata.name = 'Epinio';
  plugin.metadata.version = '0.6.2'; // TODO: RC Q take from package.json?

  plugin.addI18n('en-us', enUS);

  // Load a product
  plugin.addProduct(require('./config/epinio'));

  plugin.addCoreStore(epinioMgmtStore.config.namespace, epinioMgmtStore.specifics, epinioMgmtStore.config);
  plugin.addCoreStore(epinioStore.config.namespace, epinioStore.specifics, epinioStore.config);

  epinioRoutes.forEach(route => plugin.addRoute(route));

  const onEnter: OnNavToPackage = async(store, config) => {
    await store.dispatch(`${ epinioStore.config.namespace }/loadManagement`);
  };
  const onLeave: OnNavAwayFromPackage = async(store, config) => {
    await store.dispatch(`${ epinioStore.config.namespace }/unsubscribe`);
    await store.commit(`${ epinioStore.config.namespace }/reset`);
  };

  const onLogOut: OnLogOut = async(store) => {
    await store.dispatch(`${ epinioMgmtStore.config.namespace }/onLogout`);
    await store.dispatch(`${ epinioStore.config.namespace }/onLogout`);
  };

  plugin.addNavHooks(onEnter, onLeave, onLogOut);

  // TODO: RC Q Neil couldn't get these to work, had to match dynamic-importer
  // import appLogs from './components/windowComponent/ApplicationLogs.vue';
  // import appShell from './components/windowComponent/ApplicationShell.vue';

  /* ?? webpackChunkName: "components/nav/WindowManager" */

  plugin.register('windowComponent', 'ApplicationLogs', () => import(`./components/windowComponent/ApplicationLogs.vue`));
  plugin.register('windowComponent', 'ApplicationShell', () => import(`./components/windowComponent/ApplicationShell.vue`));
}
