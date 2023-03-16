import { importTypes } from '@rancher/auto-import';
import { IPlugin } from '@shell/core/types';
import { routes as routes1, singleProdName as prodName1 } from './config/double-prod-routes-config1';
import { routes as routes2, singleProdName as prodName2 } from './config/double-prod-routes-config2';
import { routes as routes3, clusterProdName as prodName3 } from './config/cluster-prod-routes-config';

// Init the package
export default function(plugin: IPlugin) {
  // Auto-import model, detail, edit from the folders
  importTypes(plugin);

  // Provide plugin metadata from package.json
  plugin.metadata = require('./package.json');

  // Load a product
  plugin.addProduct(require('./config/double-prod-reg-config1'), prodName1);
  plugin.addProduct(require('./config/double-prod-reg-config2'), prodName2);
  plugin.addProduct(require('./config/cluster-prod-reg-config'), prodName3);

  // Add Vue Routes
  plugin.addRoutes(routes1);
  plugin.addRoutes(routes2);
  plugin.addRoutes(routes3);
}
