import { importTypes } from '@rancher/auto-import';
import { IPlugin } from '@shell/core/types';
import macvlanRouting from './routing/macvlan-routing';
import macvlanStore from './store/macvlan-store/index.js';

// Init the package
export default function($plugin: IPlugin) {
  // Auto-import model, detail, edit from the folders
  importTypes($plugin);

  // Provide plugin metadata from package.json
  $plugin.metadata = require('./package.json');

  // Load a product
  $plugin.addProduct(require('./macvlan-config'));

  // Add Vuex store
  $plugin.addDashboardStore(macvlanStore.config.namespace, macvlanStore.specifics, macvlanStore.config);

  // Add Vue Routes
  $plugin.addRoutes(macvlanRouting);
}
