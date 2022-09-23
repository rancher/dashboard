import { importTypes } from '@rancher/auto-import';
import { IPlugin } from '@shell/core/types';
import harvesterRoutes from './routing/harvester-routing';
import harvesterCommonStore from './store/harvester-common';
import harvesterStore from './store/harvester-store';
import customValidators from './validators';

// Init the package
export default function(plugin: IPlugin) {
  // Auto-import model, detail, edit from the folders
  importTypes(plugin);

  // Provide plugin metadata from package.json
  plugin.metadata = require('./package.json');

  plugin.addProduct(require('./config/harvester'));

  plugin.addRoutes(harvesterRoutes);

  plugin.addDashboardStore(harvesterCommonStore.config.namespace, harvesterCommonStore.specifics, harvesterCommonStore.config);
  plugin.addDashboardStore(harvesterStore.config.namespace, harvesterStore.specifics, harvesterStore.config, harvesterStore.init);

  plugin.validators = customValidators;

  plugin.register('component', 'NavHeaderRight', () => import(/* webpackChunkName: "pkg/harvester/components" */ `./components/HarvesterUpgradeHeader.vue`));
}
