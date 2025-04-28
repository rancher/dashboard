import { importTypes } from '@rancher/auto-import';
import { IPlugin } from '@shell/core/types';
import { EditImportedGenericCluster, ImportGenericCluster, EditLocalCluster } from './provisioner';

// Init the package
export default function(plugin: IPlugin): void {
  // Auto-import model, detail, edit from the folders
  importTypes(plugin);

  // Provide plugin metadata from package.json
  plugin.metadata = require('./package.json');

  // Built-in icon
  plugin.metadata.icon = require('./assets/icon.svg');

  // Register custom provisioner object
  plugin.register('provisioner', EditImportedGenericCluster.ID, EditImportedGenericCluster);
  plugin.register('provisioner', ImportGenericCluster.ID, ImportGenericCluster);
  plugin.register('provisioner', EditLocalCluster.ID, EditLocalCluster);
}
