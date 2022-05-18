import { importTypes } from '@rancher/auto-import';
import { IPlugin } from '@shell/core/types';
import elementalRouting from './routing/elemental-routing';

// Init the package
export default function($plugin: IPlugin) {
  // Auto-import model, detail, edit from the folders
  importTypes($plugin);

  // Provide plugin metadata from package.json
  $plugin.metadata = require('./package.json');

  // Load a product
  $plugin.addProduct(require('./product'));

  // Add Vue Routes
  $plugin.addRoutes(elementalRouting);
  console.log('LOADING NIINTIDSADSAADSASd');
}
