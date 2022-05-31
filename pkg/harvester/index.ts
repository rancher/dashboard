import { importTypes } from '@rancher/auto-import';
import { IPlugin } from '@shell/core/types';
import harvesterRoutes from './routing/harvester-routing';
import harvesterStore from './store/harvester-store';

// Init the package
export default function(plugin: IPlugin) {
  // Auto-import model, detail, edit from the folders
  importTypes(plugin);

  plugin.addProduct(require('./config/harvester'));

  plugin.addRoutes(harvesterRoutes);

  // plugin.addDashboardStore(harvesterStore.config.namespace, harvesterStore.specifics, harvesterStore.config);
}
