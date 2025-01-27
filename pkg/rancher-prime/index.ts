// import { importTypes } from '@rancher/auto-import';
import { IPlugin } from '@shell/core/types';
import { installDocHandler } from './docs';

// Init the package
export default function(plugin: IPlugin) {
  if (!plugin.environment.isPrime) {
    return false;
  }

  // Auto-import model, detail, edit from the folders
  // importTypes(plugin);

  // Provide plugin metadata from package.json
  plugin.metadata = require('./package.json');

  // Built-in icon
  plugin.metadata.icon = require('./assets/rancher-prime.svg');

  // Add the handler that will intercept and replace doc links with their Prime doc counterpart
  installDocHandler(plugin);
}
