import { importTypes } from '@rancher/auto-import';
import { ActionLocation, IPlugin, IInternal } from '@shell/core/types';
import { explain } from './slide-in';

// Init the package
export default function(plugin: IPlugin, internal: IInternal): void {
  // Auto-import model, detail, edit from the folders
  importTypes(plugin);

  // Provide plugin metadata from package.json
  plugin.metadata = require('./package.json');

  const store = internal.store;

  plugin.addAction(ActionLocation.HEADER, {
    resource: ['*'],
    product:  [
      'explorer',
      'apps',
      'istio',
      'monitoring',
      'logging'
    ]
  }, {
    labelKey:   'kubectl-explain.action',
    tooltipKey: 'kubectl-explain.tooltip',
    svg:        require('./explain.svg'),
    invoke:     (opts, res, globals) => {
      explain(store, globals.$route);
    }
  });
}
