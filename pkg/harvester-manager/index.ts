import { importTypes } from '@rancher/auto-import';
import { IPlugin, TabLocation } from '@shell/core/types';

// Init the package
export default function(plugin: IPlugin) {
  // Auto-import model, detail, edit from the folders
  importTypes(plugin);

  // Provide plugin metadata from package.json
  plugin.metadata = require('./package.json');

  // Built-in icon
  plugin.metadata.icon = require('./icon.svg');

  plugin.addProduct(require('./config/harvester-manager'));

  plugin.addTab(
    TabLocation.RESOURCE_DETAIL,
    { resource: ['persistentvolumeclaim', 'storage.k8s.io.storageclass', 'configmap'] },
    {
      name:       'some-name',
      labelKey:   'generic.comingSoon',
      label:      'some-label',
      weight:     -5,
      showHeader: true,
      tooltip:    'this is a tooltip message',
      component:  () => import('./../../shell/components/BackLink.vue')
    }
  );
}
