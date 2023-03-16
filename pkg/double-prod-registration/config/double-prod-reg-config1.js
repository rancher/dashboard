import { routes as routes1, singleProdName as prodName1 } from './double-prod-routes-config1';
import { setRoute } from '@shell/core/plugin-helpers';
import { FLEET } from '@shell/config/types';

export function init($plugin) {
  $plugin.registerAsProduct({
    name:     prodName1,
    labelKey: 'product.labels.prod1',
    inStore:  'management',
    enabled:  (rootState) => {
      return true;
    },
    svg:    require('@pkg/double-prod-registration/icons/rancher-desktop.svg'),
    weight: 1,
    to:     setRoute('page1', routes1)
  });

  $plugin.registerType([
    {
      type:    'custom-page',
      id:      'page1',
      options: {
        weight:   2,
        labelKey: 'product.pages.page1',
        icon:     'folder',
        route:    setRoute('page1', routes1)
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
        customRoute: setRoute('resource', routes1, FLEET.WORKSPACE),
        weight:      1500
      },

    }
  ]);
}
