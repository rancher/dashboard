import { importTypes } from '@rancher/auto-import';
import { IPlugin } from '@shell/core/types';
import { CAPAProvisioner } from './provisioner';

// Init the package
export default function(plugin: IPlugin): void {
  // Auto-import model, detail, edit from the folders
  importTypes(plugin);

  // Provide plugin metadata from package.json
  plugin.metadata = require('./package.json');

  // Register custom provisioner object
  plugin.register('provisioner', CAPAProvisioner.ID, CAPAProvisioner);

  // Built-in icon
  plugin.metadata.icon = require('./assets/amazonecapa.svg');
  // Register machine config component for CAPA.
  // Some flows can surface the provider as aws for credential reuse,
  // so register both keys to avoid falling back to generic config.
  plugin.register('machine-config', 'capa', () => import('./machine-config/capa.vue'));
  plugin.register('machine-config', 'aws', () => import('./machine-config/capa.vue'));
}
