import { importTypes } from '@rancher/auto-import';
import { IPlugin } from '@shell/core/types';
import metadata from './package.json';

// Init the package
export default function(plugin: IPlugin): void {
  // Auto-import model, detail, edit from the folders
  importTypes(plugin);

  // Provide plugin metadata from package.json
  plugin.metadata = metadata;

  // Load a product
  // import product from './product';
  // plugin.addProduct(product);
}
