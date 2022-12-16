import { importTypes } from '@rancher/auto-import';
import { IPlugin } from '@shell/core/types';

// Init the package
export default function(plugin: IPlugin) {
  // Auto-import model, detail, edit from the folders
  importTypes(plugin);

  // Provide plugin metadata from package.json
  plugin.metadata = require('./package.json');

  // Load a product
  // plugin.addProduct(require('./product'));

  // location: / - global actions on all views
  // /{product} - global actions on all views for given product
  // {type} - menu actions for given type

  plugin.addAction('/', {
    label: 'Test Action',
    icon:  'icon-home',
    // enabled: true,
    enabled() {
      console.log('checking enabled'); // eslint-disable-line no-console
      console.log(this); // eslint-disable-line no-console

      return true;
    },
    execute() {
      console.log('test action executed'); // eslint-disable-line no-console
      console.log(this); // eslint-disable-line no-console
    }
  });

  plugin.addAction('/explorer', {
    label: 'Test Action',
    icon:  'icon-home',
    // enabled: true,
    enabled() {
      console.log('checking enabled'); // eslint-disable-line no-console
      console.log(this); // eslint-disable-line no-console

      return true;
    },
    execute() {
      console.log('test action executed'); // eslint-disable-line no-console
      console.log(this); // eslint-disable-line no-console
    }
  });

  plugin.addTab('pod', () => import('./MyTabComponent.vue'));
}
