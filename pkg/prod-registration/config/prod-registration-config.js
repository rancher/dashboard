import { routes } from './routes-config';
import { setRoute } from '@shell/core/plugin-helpers';
import { FLEET } from '@shell/config/types';
import {
  AGE,
  NAME as NAME_COL,
} from '@shell/config/table-headers';

export function init($plugin) {
  console.log('$plugin init', $plugin);
  console.log('dashboard route', setRoute('dashboard', routes));
  console.log('page2 route', setRoute('page2', routes));
  console.log('FLEET.BUNDLE route', setRoute('list-view', routes, FLEET.BUNDLE));

  /**
   * Params for registering an Extension product
   * @param {string} label product name
   * @param {string} labelKey path for translation of label
   * @param {string} inStore store name to include product
   * @param {function} [enabled] function to evaluate if extension prod is visible or not
   * @param {function} [svg] svg icon via require
   * @param {string} [icon] icon from Rancher Icons (https://github.com/rancher/icons)
   * @param {number} weight ordering of the side-menu entry
   * @param {object} to Vue Router object to define where product entry will lead to
   */
  $plugin.registerExtensionProduct({
    // label:    'Demo Product',
    labelKey: 'product.labels.productregistration',
    inStore:  'management',
    enabled:  (rootState) => {
      return true;
    },
    // icon:    'gear',
    svg:    require('@pkg/prod-registration/icons/rancher-desktop.svg'),
    weight: 1,
    to:     setRoute('dashboard', routes)
  });

  $plugin.registerType([
    {
      type: 'custom-page',
      id:   'dashboard',

      options: {
        weight:   2,
        labelKey: 'product.pages.dashboard',
        icon:     'folder',
        route:    setRoute('dashboard', routes)
      }
    },
    {
      type:    'custom-page',
      id:      'page2',
      options: {
        weight: 3,
        label:  'Page 2',
        icon:   'folder',
        route:  setRoute('page2', routes)
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
        customRoute: setRoute('resource', routes, FLEET.WORKSPACE),
        weight:      1500
      },

    }
  ]);

  $plugin.updateType({
    id:      'page2',
    options: { weight: 1000 }
  });

  $plugin.updateType({
    id:       FLEET.WORKSPACE,
    listCols: [
      NAME_COL,
      AGE
    ]
  });

  $plugin.updateType({
    id:      'dashboard',
    options: { weight: 2000 }
  });
}
