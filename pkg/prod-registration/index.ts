import { importTypes } from '@rancher/auto-import';
import { IPlugin } from '@shell/core/types';
import { routes, productName } from './config/routes-config';

// Init the package
export default function(plugin: IPlugin) {
  // console.log('=== productName ===', productName);
  // Auto-import model, detail, edit from the folders
  importTypes(plugin);

  // Provide plugin metadata from package.json
  plugin.metadata = require('./package.json');

  // Load a product
  plugin.addProduct(require('./config/prod-registration-config'), productName);

  // Add Vue Routes
  plugin.addRoutes(routes);
}
