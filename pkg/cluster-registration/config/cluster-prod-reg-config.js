import { routes, clusterProdName } from './cluster-prod-routes-config';
import { setRoute } from '@shell/core/plugin-helpers';

export function init($plugin) {
  console.log('$plugin init CLUSTER PROD', $plugin);

  /********************************************************
   *
   *  INSTORE = CLUSTER EXAMPLE
   *
   * ******************************************************/
  console.log("setRoute('page3', routes)", setRoute('page3', routes));

  $plugin.registerExtensionProduct({
    name:     clusterProdName,
    labelKey: 'product.labels.extension-in-cluster',
    inStore:  'cluster',
    enabled:  (rootState) => { // it works!!! :D
      return true;
    },
    icon:   'gear', // doesn't work
    svg:    require('@pkg/cluster-registration/icons/rancher-desktop.svg'), // doesn't work
    weight: 1,
    to:     setRoute('page3', routes)
  });

  $plugin.registerType([
    {
      type:    'custom-page',
      id:      'page3',
      options: {
        weight:   2,
        labelKey: 'product.pages.page3',
        icon:     'folder',
        route:    setRoute('page3', routes)
      }
    }
  ]);
}
