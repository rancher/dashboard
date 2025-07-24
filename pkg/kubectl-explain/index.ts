import { importTypes } from '@rancher/auto-import';
import { ActionLocation, IPlugin, IInternal } from '@shell/core/types';
import Panel from './components/SlideInPanel.vue';

// Init the package
export default function(plugin: IPlugin, internal: IInternal): void {
  // Auto-import model, detail, edit from the folders
  importTypes(plugin);

  // Provide plugin metadata from package.json
  plugin.metadata = require('./package.json');

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
      internal.app.$shell.slideInPanel({
        component:      Panel,
        componentProps: {
          width:               '530px',
          triggerFocusTrap:    true,
          returnFocusSelector: `[data-testid="extension-header-action-kubectl-explain.action"]`
        }
      });
    }
  });
}
