import { importTypes } from '@rancher/auto-import';
import { IPlugin, OnNavToPackage, OnNavAwayFromPackage } from '@shell/core/types';
import epinioStore from './store/epinio-store';
import epinioMgmtStore from './store/epinio-mgmt-store';
import epinioRoutes from './routing/epinio-routing';

import enUS from './translations/en-us.yaml';

// TODO: RC rename plugin-dev to `dev-2.6.6`
// TODO: RC merge latest master
// TODO: RC review old epinio PRs comments
// TODO: RC review new epinio PRs comments
// TODO: RC Test standalone
// TODO: RC Nav Bugs
// - Explorer --> Burger Menu Epinio link
// TODO: RC Create config
// TODO: RC Create app
// -- file selector
// TODO: RC prompt remove (explorer, epinio)
// TODO: RC BUG - Switch NS

// Init the package
export default function(plugin: IPlugin) {
  // Auto-import model, detail, edit from the folders
  importTypes(plugin);

  // Provide plugin metadata from package.json
  plugin.metadata = require('./package.json');

  plugin.addL10n('en-us', enUS);

  // Load a product
  plugin.addProduct(require('./config/epinio'));

  plugin.addDashboardStore(epinioMgmtStore.config.namespace, epinioMgmtStore.specifics, epinioMgmtStore.config);
  plugin.addDashboardStore(epinioStore.config.namespace, epinioStore.specifics, epinioStore.config);

  epinioRoutes.forEach(route => plugin.addRoute(route));

  const onEnter: OnNavToPackage = async(store, config) => {
    await store.dispatch(`${ epinioStore.config.namespace }/loadManagement`);
  };
  const onLeave: OnNavAwayFromPackage = async(store, config) => {
    // The dashboard retains the previous cluster info until another cluster is loaded, this helps when returning to the same cluster.
    // We need to forget epinio cluster info
    // - The polling is pretty brutal
    // - The nav path through to the same epinio cluster is fraught with danger (nav from previous cluster id to blank cluster, required to switch epinio clusters)
    await store.dispatch(`${ epinioStore.config.namespace }/unsubscribe`);
    await store.commit(`${ epinioStore.config.namespace }/reset`);
  };

  plugin.addNavHooks(onEnter, onLeave);
}
