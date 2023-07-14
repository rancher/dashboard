import { importTypes } from '@rancher/auto-import';
import {
  IPlugin,
  ActionLocation,
  ActionOpts,
} from '@shell/core/types';

// Init the package
export default function(plugin: IPlugin): void {
  // Auto-import model, detail, edit from the folders
  importTypes(plugin);

  // Provide plugin metadata from package.json
  plugin.metadata = require('./package.json');

  // Load a product
  // plugin.addProduct(require('./product'));

  plugin.addAction(
    ActionLocation.TABLE,
    { resource: ['pod'] },
    {
      label:    'some-bulkable-action',
      // labelKey: 'plugin-examples.table-action-two',
      icon: 'icon-gear',
      // svg:      require('@pkg/extensions-api-demo/icons/rancher-desktop.svg'),
      multiple: true,
      invoke(opts: ActionOpts, values: any[]) {
        console.log('table action executed 2', this); // eslint-disable-line no-console
        console.log(opts); // eslint-disable-line no-console
        console.log(values); // eslint-disable-line no-console
      },
      enabled(ctx: any) {
        console.log('ctx', ctx.nameDisplay)
        return ctx.nameDisplay === 'elemental-operator-55bf74dccd-4tn2s';
      },
    }
  );
}
