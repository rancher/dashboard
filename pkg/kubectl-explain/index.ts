import { importTypes } from '@rancher/auto-import';
import { ActionLocation, IPlugin, IInternal, TabLocation } from '@shell/core/types';
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

  plugin.addTab(
    TabLocation.RESOURCE_SHOW_CONFIGURATION,
    { resource: ['service'] },
    {
      name:       'some-name',
      label:      'show-config-page-label',
      weight:     -5,
      showHeader: true,
      tooltip:    'this is a tooltip message',
      component:  () => import('./MyTabComponent.vue')
    }
  );

  plugin.addTab(
    TabLocation.RESOURCE_DETAIL_PAGE,
    { resource: ['service'] },
    {
      name:       'some-name',
      label:      'detail-page-label',
      weight:     -5,
      showHeader: true,
      tooltip:    'this is a tooltip message',
      component:  () => import('./MyTabComponent.vue')
    }
  );

  plugin.addTab(
    TabLocation.RESOURCE_CREATE_PAGE,
    { resource: ['service'] },
    {
      name:       'some-name',
      label:      'create-page-label',
      weight:     -5,
      showHeader: true,
      tooltip:    'this is a tooltip message',
      component:  () => import('./MyTabComponent.vue')
    }
  );

  plugin.addTab(
    TabLocation.RESOURCE_EDIT_PAGE,
    { resource: ['service'] },
    {
      name:       'some-name',
      label:      'edit-page-label',
      weight:     -5,
      showHeader: true,
      tooltip:    'this is a tooltip message',
      component:  () => import('./MyTabComponent.vue')
    }
  );

  plugin.addTab(
    TabLocation.ALL,
    { resource: ['pod', 'service'] },
    {
      name:       'some-name',
      label:      'all-pages-label',
      weight:     -5,
      showHeader: true,
      tooltip:    'this is a tooltip message',
      component:  () => import('./MyTabComponent.vue')
    }
  );
}
