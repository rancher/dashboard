import { importTypes } from '@rancher/auto-import';
import { IPlugin, OnNavToPackage, OnNavAwayFromPackage } from '@shell/core/types';
import exampleStore from './store/example-store';
import exampleMgmtStore from './store/example-mgmt-store';
import exampleRoutes from './routing/example-routing';

// This is an example plugin that has custom product, routes, pages, stores, enter/leave hooks
// The custom product contains custom resources. To manage them (create, edit, delete, view, list, etc) the plugin contains
// - detail and edit components
// - model files for each resources
// - l10n containing translations

// The plugin is intended to be included/imported to the dashboard and is accessibly via the dashboard side nav
// When visited the user can select a 'cluster' to manage resources in

const onEnter: OnNavToPackage = async(store, config) => {
  await store.dispatch(`${ exampleMgmtStore.config.namespace }/loadManagement`);
};
const onLeave: OnNavAwayFromPackage = async(store, config) => {
  // The dashboard retains the previous cluster info until another cluster is loaded, this helps when returning to the same cluster.
  await store.dispatch(`${ exampleStore.config.namespace }/unsubscribe`);
  await store.commit(`${ exampleStore.config.namespace }/reset`);
};

// Init the package
export default function(plugin: IPlugin) {
  // Auto-import model, detail, edit from the folders
  importTypes(plugin);

  // Provide plugin metadata from package.json
  plugin.metadata = require('./package.json');

  // Load a product
  plugin.addProduct(require('./config/example'));

  // Add Vuex stores
  plugin.addDashboardStore(exampleStore.config.namespace, exampleStore.specifics, exampleStore.config);
  plugin.addDashboardStore(exampleMgmtStore.config.namespace, exampleMgmtStore.specifics, exampleMgmtStore.config);

  // Add Vue Routes
  plugin.addRoutes(exampleRoutes);

  // Add hooks to Vue navigation world
  plugin.addNavHooks(onEnter, onLeave);
}
