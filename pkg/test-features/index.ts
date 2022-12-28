import { importTypes } from '@rancher/auto-import';
import {
  IPlugin,
  UI_CONFIG_HEADER_ACTION,
  UI_CONFIG_TAB,
  UI_CONFIG_TABLE_ACTION,
  UI_CONFIG_DETAILS_MASTHEAD,
  UI_CONFIG_DETAIL_TOP,
  UI_CONFIG_RESOURCE_LIST,
  UI_CONFIG_GLOBAL_SETTING,
  UI_CONFIG_CLUSTER_DASHBOARD_CARD,
  UI_CONFIG_TABLE_COL,
} from '@shell/core/types';
import { isMac } from '@shell/utils/platform';
import { MANAGEMENT } from '@shell/config/types';

// Init the package
export default function(plugin: IPlugin) {
  // Auto-import model, detail, edit from the folders
  importTypes(plugin);

  // Provide plugin metadata from package.json
  plugin.metadata = require('./package.json');

  // Load a product
  // plugin.addProduct(require('./product'));

  // HEADER ACTION (button)
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
  plugin.addUIAction(UI_CONFIG_DETAIL_TOP,
    { resource: 'catalog.cattle.io.clusterrepo' },
    { component: () => import('./MastheadDetailsComponent.vue') }); // component to be rendered

  // DATA ABOVE LIST VIEW
  plugin.addUIAction(UI_CONFIG_RESOURCE_LIST,
    { resource: 'catalog.cattle.io.app' },
    { component: () => import('./BannerComponent.vue') }); // component to be rendered

  // GLOBAL SETTINGS PAGE (not working yet...)
  plugin.addUIAction(UI_CONFIG_GLOBAL_SETTING, {}, {
    virtualType: {
      ifHaveType: MANAGEMENT.SETTING,
      labelKey:   'generic.comingSoon',
      name:       'dummy',
      namespaced: false,
      weight:     91,
      icon:       'folder',
      route:      { name: 'c-cluster-settings-dummy' }
    },
    basicType:     true,
    configureType: {
      type:    MANAGEMENT.SETTING,
      options: {
        isCreatable: false,
        isRemovable: false,
        showAge:     false,
        showState:   false,
        canYaml:     false,
      }
    }
  });

  // CLUSTER DASHBOARD CARD
  plugin.addUIAction(UI_CONFIG_CLUSTER_DASHBOARD_CARD, { cluster: 'local' }, {
    label:     'some-label', // title for card
    labelKey:  'generic.comingSoon', // Same as "label" but allows for translation. Will superseed "label"
    component: () => import('./MastheadDetailsComponent.vue') // component to be rendered
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
  plugin.addUIAction(UI_CONFIG_TABLE_COL, { resource: 'configmap' }, {
    type:      'configmap', // resource type to apply the col to (required)
    classProp: { // defining a custom prop which can later be applied as a col (optional)
      propName: 'some-prop',
      value:    (data: any) => {
        return `${ data.id }-some-string`;
      }
    },
    config: { // col configuration (required)
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
