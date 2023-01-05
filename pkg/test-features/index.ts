import { importTypes } from '@rancher/auto-import';
import {
  IPlugin,
  UI_CONFIG_HEADER_ACTION,
  UI_CONFIG_TAB,
  UI_CONFIG_TABLE_ACTION,
  UI_CONFIG_DETAILS_MASTHEAD,
  UI_CONFIG_DETAIL_TOP,
  UI_CONFIG_RESOURCE_LIST,
  UI_CONFIG_CLUSTER_DASHBOARD_CARD,
  UI_CONFIG_TABLE_COL,
} from '@shell/core/types';
import { isMac } from '@shell/utils/platform';

// Init the package
export default function(plugin: IPlugin) {
  // Auto-import model, detail, edit from the folders
  importTypes(plugin);

  // Provide plugin metadata from package.json
  plugin.metadata = require('./package.json');

  // Load a product
  // plugin.addProduct(require('./product'));

  // HEADER ACTION (button)
  /**
   * Config options
   * @param {string} tooltip - text for tooltip of button
   * @param {string} tooltipKey - same as "tooltip" but allows for translation. Will superseed "tooltip"
   * @param {function} shortcutLabel - adds shortcut label to tooltip
   * @param {object} shortcutKey - shortcut key binding
   * @param {string} icon - icon name (based on rancher icons)
   * @param {function} enabled - whether the action/button is enabled or not
   * @param {function} clicked - function performed when action/button is clicked
   */
  plugin.addUIAction(UI_CONFIG_HEADER_ACTION, {}, {
    tooltipKey: 'generic.customize',
    tooltip:    'Test Action1',
    shortcutLabel() {
      return isMac ? '(\u2318-M)' : '(Ctrl+M)';
    },
    shortcutKey: { windows: ['ctrl', 'm'], mac: ['meta', 'm'] },
    icon:        'icon-pipeline',
    enabled(ctx: any) {
      return true;
    },
    clicked() {
      console.log('action executed 1', this.$route); // eslint-disable-line no-console
    }
  });

  // HEADER ACTION (button)
  plugin.addUIAction(UI_CONFIG_HEADER_ACTION, { name: 'c-cluster-explorer' }, {
    tooltipKey: 'generic.comingSoon',
    tooltip:    'Test Action2',
    shortcutLabel() {
      return isMac ? '(\u2318-B)' : '(Ctrl+B)';
    },
    shortcutKey: { windows: ['ctrl', 'b'], mac: ['meta', 'b'] },
    icon:        'icon-spinner',
    enabled(ctx: any) {
      return true;
    },
    clicked() {
      console.log('action executed 2', this); // eslint-disable-line no-console
    }
  });

  // ADDS TAB TO "ResourceTabs" COMPONENT
  /**
   * Config options
   * @param {string} name - query param name used in url when tab is active/clicked
   * @param {string} label - text for tab label
   * @param {string} labelKey - same as "label" but allows for translation. Will superseed "label"
   * @param {int} weight - defines the order on which the tabs are displayed
   * @param {boolean} showHeader - whether the tab header is displayed or not
   * @param {string} tooltip - tooltip message (on tab header)
   * @param {int} badge - badge count indicator to be displayed on tab (on top)
   * @param {function} component - component to be displayed as tab content
   */
  plugin.addUIAction(UI_CONFIG_TAB, { resource: 'pod' }, {
    name:       'some-name',
    labelKey:   'generic.comingSoon',
    label:      'some-label',
    weight:     -5,
    showHeader: true,
    tooltip:    'this is a tooltip message',
    badge:      3,
    component:  () => import('./MyTabComponent.vue')
  });

  // TABLE ACTIONS - divider
  plugin.addUIAction(UI_CONFIG_TABLE_ACTION, { resource: 'catalog.cattle.io.clusterrepo' }, { divider: true }); // renders a divider instead of an actual action

  // TABLE ACTIONS
  /**
   * Config options
   * @param {string} action - action name
   * @param {string} label - action label
   * @param {string} labelKey - same as "label" but allows for translation. Will superseed "label"
   * @param {string} icon - icon name (based on rancher icons)
   * @param {boolean} enabled - whether the action/button is enabled or not
   * @param {function} clicked - function performed when action/button is clicked (non-bulkable mode)
   * @param {boolean} divider - shows a line separator (divider) in actions menu
   * @param {boolean} bulkable - whether the action/button is bulkable (can be performed on multiple list items)
   * @param {function} bulkAction - function performed when bulklable action/button is clicked (only bulkable mode)
   */
  plugin.addUIAction(UI_CONFIG_TABLE_ACTION, { resource: 'catalog.cattle.io.clusterrepo' }, {
    action:   'some-extension-action',
    label:    'some-extension-action',
    labelKey: 'generic.customize',
    icon:     'icon-pipeline',
    enabled:  true,
    clicked() {
      console.log('table action executed1', this); // eslint-disable-line no-console
    }
  });

  // TABLE ACTIONS
  plugin.addUIAction(UI_CONFIG_TABLE_ACTION, { resource: 'catalog.cattle.io.clusterrepo' }, {
    action:   'some-bulkable-action',
    label:    'some-bulkable-action',
    labelKey: 'generic.comingSoon',
    icon:     'icon-pipeline',
    bulkable: true,
    enabled:  true,
    clicked() {
      console.log('table action executed2', this); // eslint-disable-line no-console
    },
    bulkAction(args: any) {
      console.log('bulk table action executed', this, args); // eslint-disable-line no-console
    }
  });

  // DETAILS VIEW MASTHEAD DATA
  /**
   * Config options
   * @param {function} component - component to be displayed on details view masthead
   */
  plugin.addUIAction(UI_CONFIG_DETAILS_MASTHEAD,
    {
      resource: 'catalog.cattle.io.clusterrepo',
      name:     'c-cluster-product-resource-id'
    },
    { component: () => import('./MastheadDetailsComponent.vue') }); // component to be rendered

  // DETAILS VIEW MASTHEAD DATA
  plugin.addUIAction(UI_CONFIG_DETAILS_MASTHEAD,
    {
      resource: 'catalog.cattle.io.clusterrepo',
      name:     'c-cluster-product-resource-id',
      query:    { as: 'config' }
    },
    { component: () => import('./MastheadDetailsComponent.vue') }); // component to be rendered

  // DETAILS VIEW "DetailTop" DATA
  /**
   * Config options
   * @param {function} component - component to be displayed on details view "detailsTop" area
   */
  plugin.addUIAction(UI_CONFIG_DETAIL_TOP,
    { resource: 'catalog.cattle.io.clusterrepo' },
    { component: () => import('./MastheadDetailsComponent.vue') }); // component to be rendered

  // DATA ABOVE LIST VIEW
  /**
   * Config options
   * @param {function} component - component to be displayed before a list view (ResourceList component)
   */
  plugin.addUIAction(UI_CONFIG_RESOURCE_LIST,
    { resource: 'catalog.cattle.io.app' },
    { component: () => import('./BannerComponent.vue') }); // component to be rendered

  // CLUSTER DASHBOARD CARD
  /**
   * Config options
   * @param {string} label - card title
   * @param {string} labelKey - same as "label" but allows for translation. Will superseed "label"
   * @param {function} component - component to be displayed inside card
   */
  plugin.addUIAction(UI_CONFIG_CLUSTER_DASHBOARD_CARD, { cluster: 'local' }, {
    label:     'some-label',
    labelKey:  'generic.comingSoon',
    component: () => import('./MastheadDetailsComponent.vue')
  });

  // CLUSTER DASHBOARD CARD
  plugin.addUIAction(UI_CONFIG_CLUSTER_DASHBOARD_CARD, { cluster: 'local' }, {
    label:     'some-label1',
    labelKey:  'generic.comingSoon',
    component: () => import('./MastheadDetailsComponent.vue')
  });

  // CLUSTER DASHBOARD CARD
  plugin.addUIAction(UI_CONFIG_CLUSTER_DASHBOARD_CARD, { cluster: 'local' }, {
    label:     'some-label2',
    labelKey:  'generic.comingSoon',
    component: () => import('./MastheadDetailsComponent.vue')
  });

  // CLUSTER DASHBOARD CARD
  plugin.addUIAction(UI_CONFIG_CLUSTER_DASHBOARD_CARD, { cluster: 'local' }, {
    label:     'some-label3',
    labelKey:  'generic.comingSoon',
    component: () => import('./MastheadDetailsComponent.vue')
  });

  // ADD A COL TO A TABLE
  /**
   * Config options
   * @param {string} type - resource type to apply the col to (required)
   * @param {object} classProp - defines a new prop for a given resource in it's class/model
   * @param {object} config - col configuration object (required)
   */
  plugin.addUIAction(UI_CONFIG_TABLE_COL, { resource: 'configmap' }, {
    type:      'configmap',
    classProp: {
      propName: 'some-prop',
      value:    (data: any) => {
        return `${ data.id }-some-string`;
      }
    },
    config: {
      // A USER DEFINED PROP! check "classProp" above
      name:     'some-prop-col',
      labelKey: 'generic.comingSoon',
      getValue: (row: any) => row.extensionProps['some-prop'],

      // SIMPLE STATE EXAMPLE
      // name:      'state', // label for col
      // labelKey:  'tableHeaders.state', // Same as "name" but allows for translation. Will superseed "name"
      // sort:      ['stateSort', 'nameSort'], // prop(s) to be bound to the table sorting
      // search:    ['stateSort', 'nameSort'], // prop(s) to be bound to the table search
      // value:     'stateDisplay', // col prop to obtain the value from
      // getValue:  (row: any) => row.stateDisplay, // same as "value", but it can be a function. Will superseed "value"
      // width:     100, // col width
      // default:   'unknown', // col default value
      // formatter: 'BadgeStateFormatter', // col formatter if needed

      // OTHER OPTIONS
      // formatterOpts: { reference: 'claim.detailLocation' }, // passing options to formatter
      // canBeVariable: true, // col can have variable with
      // dashIfEmpty:   true, // display dash if there's no value for this prop
      // width:         120, // col width
      // align:         'center', // col alignment
      // liveUpdates:   true,
      // breakpoint:    COLUMN_BREAKPOINTS.DESKTOP,
      // maxPageSize:   25, // Hide this column when the page size is bigger than 25
      // skipSelect:    true,
      // delayLoading:  true, // col data will only load after data is loaded or scroll is done
    }
  });
}
