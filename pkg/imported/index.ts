import { importTypes } from '@rancher/auto-import';
import { IPlugin } from '@shell/core/types';
import { ImportProvisioner, ImportedProvisioner, LocalProvisioner } from './provisioner';

// Init the package
export default function(plugin: IPlugin): void {
  // Auto-import model, detail, edit from the folders
  importTypes(plugin);

  // Provide plugin metadata from package.json
  plugin.metadata = require('./package.json');

  // Register custom provisioner object
  plugin.register('provisioner', ImportedProvisioner.ID, ImportedProvisioner);
  plugin.register('provisioner', ImportProvisioner.ID, ImportProvisioner);
  plugin.register('provisioner', LocalProvisioner.ID, LocalProvisioner);
}
