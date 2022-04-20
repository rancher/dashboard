import { importTypes } from '@rancher/auto-import';
import { IPlugin, OnNavToPackage, OnNavAwayFromPackage } from '@shell/core/types';
import epinioStore from './store/epinio-store';
import epinioMgmtStore from './store/epinio-mgmt-store';
import epinioRoutes from './routing/epinio-routing';

// TODO: RC rename plugin-dev to `dev-2.6.6`
// TODO: RC Test standalone
// TODO: RC prompt remove (explorer, epinio)
// TODO: RC x Create config
// TODO: RC x Create app
// -- file selector
// TODO: RC x charts list empty
// TODO: RC x charts refresh error (empty popyp)
// TODO: RC x merge latest master
// TODO: RC X Nav Bugs
// - X Explorer --> Burger Menu Epinio link
// TODO: RC x BUG - Switch NS
// TODO: RC X review old epinio PRs comments
// TODO: RC X review new epinio PRs comments

const onEnter: OnNavToPackage = async(store, config) => {
  await store.dispatch(`${ epinioMgmtStore.config.namespace }/loadManagement`);
};
const onLeave: OnNavAwayFromPackage = async(store, config) => {
  // The dashboard retains the previous cluster info until another cluster is loaded, this helps when returning to the same cluster.
  // We need to forget epinio cluster info
  // - The polling is pretty brutal
  // - The nav path through to the same epinio cluster is fraught with danger (nav from previous cluster id to blank cluster, required to switch epinio clusters)
  await store.dispatch(`${ epinioStore.config.namespace }/unsubscribe`);
  await store.commit(`${ epinioStore.config.namespace }/reset`);
};

// Init the package
export default function(plugin: IPlugin) {
  // Auto-import model, detail, edit from the folders
  importTypes(plugin);

  // Provide plugin metadata from package.json
  plugin.metadata = require('./package.json');

  // Load a product
  plugin.addProduct(require('./config/epinio'));

  // Add Vuex stores
  plugin.addDashboardStore(epinioMgmtStore.config.namespace, epinioMgmtStore.specifics, epinioMgmtStore.config);
  plugin.addDashboardStore(epinioStore.config.namespace, epinioStore.specifics, epinioStore.config);

  // Add Vue Routes
  plugin.addRoutes(epinioRoutes);

  // Add hooks to Vue navigation world
  plugin.addNavHooks(onEnter, onLeave);
}
