import { importTypes } from '@rancher/auto-import';
import { IPlugin, TabLocation } from '@shell/core/types';
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

  plugin.addTab(
    TabLocation.RESOURCE_CREATE_PAGE,
    {
      resource: ['service'],
      context:  { showHarvesterAddOnConfig: 'true' }
    },
    {
      name:       'add-on-config',
      labelKey:   'servicesPage.harvester.title',
      weight:     -1,
      showHeader: true,
      component:  () => import('./components/HarvesterServiceAddOnConfig.vue')
    }
  );

  plugin.addTab(
    TabLocation.RESOURCE_EDIT_PAGE,
    {
      resource: ['service'],
      context:  { showHarvesterAddOnConfig: 'true' }
    },
    {
      name:       'add-on-config',
      labelKey:   'servicesPage.harvester.title',
      weight:     -1,
      showHeader: true,
      component:  () => import('./components/HarvesterServiceAddOnConfig.vue')
    }
  );
}
