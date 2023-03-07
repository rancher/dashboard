import { importTypes } from '@rancher/auto-import';
import { IPlugin } from '@shell/core/types';
import { routes as clusterProdRoutes, clusterProdName } from './config/cluster-prod-routes-config';

// Init the package
export default function(plugin: IPlugin) {
  // console.log('=== singleProdName ===', singleProdName);
  // console.log('=== clusterProdName ===', clusterProdName);
  // Auto-import model, detail, edit from the folders
  importTypes(plugin);

  // Provide plugin metadata from package.json
  plugin.metadata = require('./package.json');

  // Load a product
  plugin.addProduct(require('./config/cluster-prod-reg-config'), clusterProdName);

  // Add Vue Routes
  plugin.addRoutes(clusterProdRoutes);
}
