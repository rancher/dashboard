import { importTypes } from '@rancher/auto-import';
import { IPlugin } from '@shell/core/types';
import { AKSProvisioner } from './provisioner';
import metadata from './package.json';
import icon from './icon.svg';

// Init the package
export default function(plugin: IPlugin): void {
  // Auto-import model, detail, edit from the folders
  importTypes(plugin);

  // Provide plugin metadata from package.json
  plugin.metadata = metadata;

  // Register custom provisioner object
  plugin.register('provisioner', AKSProvisioner.ID, AKSProvisioner);

  // Built-in icon
  plugin.metadata.icon = icon;
}
