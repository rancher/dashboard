import { routes, singleProdName } from './single-prod-routes-config';
import { setRoute } from '@shell/core/plugin-helpers';
import { FLEET } from '@shell/config/types';
import {
  AGE,
  NAME as NAME_COL,
} from '@shell/config/table-headers';

export function init($plugin) {
  console.log('$plugin init SINGLE PROD', $plugin);

  /********************************************************
   *
   *  INSTORE = MANAGEMENT EXAMPLE
   *
   * ******************************************************/

  /**
   * Object properties for registering an Extension product
   * @property {string} name product name (should be unique)
   * @property {string} label label for product menu entry
   * @property {string} labelKey path for translation of label
   * @property {string} inStore store name to include product
   * @property {function} [enabled] function to evaluate if extension prod is visible or not
   * @property {function} [svg] svg icon via require
   * @property {string} [icon] icon from Rancher Icons (https://github.com/rancher/icons)
   * @property {number} [weight] ordering of the side-menu entry
   * @property {object} to Vue Router object to define where product entry will lead to
   */
  $plugin.registerExtensionProduct({
    name:     singleProdName,
    // label:    'Demo Product',
    labelKey: 'product.labels.extension-as-product',
    inStore:  'management',
    enabled:  (rootState) => {
      return true;
    },
    // icon:    'gear',
    svg:    require('@pkg/prod-registration/icons/rancher-desktop.svg'),
    weight: 1,
    to:     setRoute('page1', routes)
  });

  /**
     * Register type object
     * @property {string} type - Type of "page" that is being registered
     * @property {string} id - Unique identifier for the given page
     * @property {array} [listCols] - Optional property to configure default visible cols for the listing of a resource (used for resource pages)
     * @property {object} options - Configuration object
     */
  $plugin.registerType([
    /**
     * Options properties for registering a custom-page (options object)
     * @property {string} label - product name
     * @property {string} labelKey - path for translation of label
     * @property {string} [icon] - icon from Rancher Icons (https://github.com/rancher/icons)
     * @property {number} [weight] - ordering of the side-menu entry
     * @property {object} route - Vue Router object to define which route enables access to this page
     */
    {
      type:    'custom-page',
      id:      'page1',
      options: {
        weight:   2,
        labelKey: 'product.pages.page1',
        icon:     'folder',
        route:    setRoute('page1', routes)
      }
    },
    {
      type:               'custom-page',
      id:                 'page2',
      menuGroupingId:     'this-is-a-unique-id-for-grouping',
      menuGroupingWeight: 3,
      options:            {
        weight: 3,
        label:  'Page 2',
        icon:   'folder',
        route:  setRoute('page2', routes)
      }
    },
    {
      type:           'custom-page',
      id:             'page3',
      menuGroupingId: 'this-is-a-unique-id-for-grouping',
      options:        {
        weight: 4,
        label:  'Page 3',
        icon:   'folder',
        route:  setRoute('page3', routes)
      }
    },
    /**
     * Options properties for registering a resource page (options object)
     *
     * @property {boolean} [isCreatable=true] - disable create even if schema says it's allowed
     * @property {boolean} [isEditable=true] - disable edit even if schema says it's allowed
     * @property {boolean} [isRemovable=true] - disable remove/delete even if schema says it's allowed
     * @property {boolean} [showState=true] - If false, hide state in columns and masthead
     * @property {boolean} [showAge=true] - If false, hide age in columns and masthead
     * @property {boolean} [showConfigView=true] - If false, hide masthead config button in view mode
     * @property {boolean} [showListMasthead=true] - If false, hide masthead in list view
     * @property {boolean} [canYaml=true] - Can be edited via YAML editor
     * @property {object} customRoute - Vue Router object to define which route enables access to this page
     * @property {number} [weight] - ordering of the side-menu entry
     */
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
    id:       FLEET.WORKSPACE,
    listCols: [
      NAME_COL,
      AGE
    ]
  });

  $plugin.updateType({
    id:      'page1',
    options: { weight: 2000 }
  });
}
