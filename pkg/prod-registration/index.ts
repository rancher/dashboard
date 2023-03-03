import { importTypes } from '@rancher/auto-import';
import { IPlugin } from '@shell/core/types';
import Dashboard from './pages/index.vue';
import Page2 from './pages/c/_cluster/_resource/page2.vue';

// Init the package
export default function(plugin: IPlugin) {
  // Auto-import model, detail, edit from the folders
  importTypes(plugin);

  // Provide plugin metadata from package.json
  plugin.metadata = require('./package.json');

  // Load a product
  plugin.addProduct(require('./config/prod-registration-config'));

  // Add Vue Routes
  plugin.addRoutes([
    {
      name:      `c-cluster-productregistration`,
      path:      `/:product/c/:cluster/dashboard`,
      component: Dashboard,
    },
    {
      name:      `c-cluster-productregistration-resource`,
      path:      `/:product/c/:cluster/page2`,
      component: Page2,
    },
  ]);
}
