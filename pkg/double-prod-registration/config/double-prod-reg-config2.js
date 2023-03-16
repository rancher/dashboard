import { routes as routes2, singleProdName as prodName2 } from './double-prod-routes-config2';
import { setRoute } from '@shell/core/plugin-helpers';
import { FLEET } from '@shell/config/types';

export function init($plugin) {
  $plugin.registerAsProduct({
    name:     prodName2,
    labelKey: 'product.labels.prod2',
    inStore:  'management',
    enabled:  (rootState) => {
      return true;
    },
    svg:    require('@pkg/double-prod-registration/icons/rancher-desktop.svg'),
    weight: 1,
    to:     setRoute('page2', routes2)
  });

  $plugin.registerType([
    {
      type:    'custom-page',
      id:      'page2',
      options: {
        weight:   2,
        labelKey: 'product.pages.page2',
        icon:     'folder',
        route:    setRoute('page2', routes2)
      }
    },
    {
      type:    'resource',
      id:      FLEET.WORKSPACE,
      options: {
        isCreatable: false,
        isRemovable: false,
        showAge:     false,
        showState:   false,
        canYaml:     false,
        customRoute: setRoute('resource', routes2, FLEET.WORKSPACE),
        weight:      1500
      },

    }
  ]);
}
