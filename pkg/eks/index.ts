import { importTypes } from '@rancher/auto-import';
import { IPlugin, TabLocation } from '@shell/core/types';
import { EKSProvisioner } from './provisioner';
import metadata from './package.json';
import icon from './assets/amazoneks.svg';

// Init the package
export default function(plugin: IPlugin): void {
  // Auto-import model, detail, edit from the folders
  importTypes(plugin);

  // Provide plugin metadata from package.json
  plugin.metadata = metadata;

  // Register custom provisioner object
  plugin.register('provisioner', EKSProvisioner.ID, EKSProvisioner);

  // Built-in icon
  plugin.metadata.icon = icon;

  plugin.addTab(TabLocation.RESOURCE_DETAIL_PAGE, {
    resource: ['provisioning.cattle.io.cluster'],
    context:  { provider: 'eks' }
  }, {
    name:      'custom',
    labelKey:  'cluster.tabs.nodePools',
    component: () => import('./components/NodePoolDetailTab.vue')
  });
}
