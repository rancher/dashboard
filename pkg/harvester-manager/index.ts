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

  if (plugin.environment.isPrime) {
    plugin.register('l10n-global', 'Harvester', 'SUSE Virtualization');

    const primeProductName = () => ({ product: { harvesterManager: 'SUSE Virtualization' } });

    plugin.register('l10n', 'en-us', primeProductName);
    plugin.register('l10n', 'zh-hans', primeProductName);
  }

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
