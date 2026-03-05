import { importTypes } from '@rancher/auto-import';
import { IPlugin } from '@shell/core/types';
import metadata from './package.json';
import icon from './icon.svg';
import * as harvesterManagerProduct from './config/harvester-manager';

// Init the package
export default function(plugin: IPlugin) {
  // Auto-import model, detail, edit from the folders
  importTypes(plugin);

  // Provide plugin metadata from package.json
  plugin.metadata = metadata;

  // Built-in icon
  plugin.metadata.icon = icon;

  plugin.addProduct(harvesterManagerProduct);
}
