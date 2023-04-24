import { importTypes } from '@rancher/auto-import';
import { IPlugin, OnNavToPackage, OnNavAwayFromPackage } from '@shell/core/types';
import verrazzanoRoutes from './routing/verrazzano-routing';

const onEnter: OnNavToPackage = async(store, config) => {
  // no op
};
const onLeave: OnNavAwayFromPackage = async(store, config) => {
  // no-op
};

// Init the package
export default function(plugin: IPlugin) {
  // Auto-import model, detail, edit from the folders
  importTypes(plugin);

  // Provide plugin metadata from package.json
  plugin.metadata = require('./package.json');

  // Load a product
  plugin.addProduct(require('./config/verrazzano'));

  // Add Vuex stores
  // nothing to add

  // Add Vue Routes
  plugin.addRoutes(verrazzanoRoutes);

  // Add hooks to Vue navigation world
  plugin.addNavHooks(onEnter, onLeave);
}
