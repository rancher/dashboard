import { importTypes } from '@rancher/auto-import';
import { IPlugin, TabLocation } from '@shell/core/types';
import { GKEProvisioner } from './provisioner';
import metadata from './package.json';
import icon from './assets/gke.svg';

// Init the package
export default function(plugin: IPlugin): void {
  // Auto-import model, detail, edit from the folders
  importTypes(plugin);

  // Provide plugin metadata from package.json
  plugin.metadata = metadata;

  // Register custom provisioner object
  plugin.register('provisioner', GKEProvisioner.ID, GKEProvisioner);

  // Built-in icon
  plugin.metadata.icon = icon;

  plugin.addTab(TabLocation.RESOURCE_DETAIL_PAGE, {
    resource: ['provisioning.cattle.io.cluster'],
    context:  { provider: 'gke' }
  }, {
    name:      'custom',
    labelKey:  'cluster.tabs.nodePools',
    component: () => import('./components/NodePoolDetailTab.vue')
  });
}
