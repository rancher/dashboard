import { importTypes } from '@rancher/auto-import';
import { ActionLocation, IPlugin } from '@shell/core/types';
import { install } from './slide-in';

// Init the package
export default function(plugin: IPlugin, internal: any) {
  // Auto-import model, detail, edit from the folders
  importTypes(plugin);

  // Provide plugin metadata from package.json
  plugin.metadata = require('./package.json');

  // Load a product
  // plugin.addProduct(require('./product'));

  const store = internal.store;

  console.log(internal);

  plugin.addAction(ActionLocation.HEADER, { product: ['explorer'] }, {
    label: 'Explain ...',
    svg: require('./explain.svg'),
    invoke: (opts, res, globals) => {
      install(store, globals.$route);
    }
  });
}
