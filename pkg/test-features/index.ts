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

  // header menu action global - example
  plugin.addUIAction(UI_CONFIG_HEADER_ACTION, {}, {
    tooltipKey: 'generic.customize',
    tooltip:    'Test Action1',
    shortcutLabel() {
      return isMac ? '(\u2318-M)' : '(Ctrl+M)';
    },
    shortcutKey: { windows: ['ctrl', 'm'], mac: ['meta', 'm'] },
    icon:        'icon-pipeline',
    enabled() {
      return true;
    },
    clicked() {
      console.log('action executed 1', this.$route); // eslint-disable-line no-console
    }
  });

  // header menu action per route name - example
  plugin.addUIAction(UI_CONFIG_HEADER_ACTION, { name: 'c-cluster-explorer' }, {
    tooltipKey: 'generic.comingSoon',
    tooltip:    'Test Action2',
    shortcutLabel() {
      return isMac ? '(\u2318-B)' : '(Ctrl+B)';
    },
    shortcutKey: { windows: ['ctrl', 'b'], mac: ['meta', 'b'] },
    icon:        'icon-spinner',
    enabled() {
      return true;
    },
    clicked() {
      console.log('action executed 2', this); // eslint-disable-line no-console
    }
  });

  // tab in resourceTabs per resource - example
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

  // action in table per resource - example
  plugin.addUIAction(UI_CONFIG_TABLE_ACTION, { resource: 'catalog.cattle.io.clusterrepo' }, { divider: true });

  // action in table per resource - example
  plugin.addUIAction(UI_CONFIG_TABLE_ACTION, { resource: 'catalog.cattle.io.clusterrepo' }, {
    action:  'some-extension-action',
    label:   'some-extension-action',
    icon:    'icon-pipeline',
    enabled: true,
    clicked() {
      console.log('table action executed1', this); // eslint-disable-line no-console
    }
  });

  // action in table per resource - example
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

  // information in Details Masthead - example
  plugin.addUIAction(UI_CONFIG_DETAILS_MASTHEAD,
    {
      resource: 'catalog.cattle.io.clusterrepo',
      name:     'c-cluster-product-resource-id'
    },
    { component: () => import('./MastheadDetailsComponent.vue') });

  // information in Details Masthead - example
  plugin.addUIAction(UI_CONFIG_DETAILS_MASTHEAD,
    {
      resource: 'catalog.cattle.io.clusterrepo',
      name:     'c-cluster-product-resource-id',
      query:    { as: 'config' }
    },
    { component: () => import('./MastheadDetailsComponent.vue') });

  // information in DetailTop - example
  plugin.addUIAction(UI_CONFIG_DETAIL_TOP,
    { resource: 'catalog.cattle.io.clusterrepo' },
    { component: () => import('./MastheadDetailsComponent.vue') });

  // information in ResourceList - example
  plugin.addUIAction(UI_CONFIG_RESOURCE_LIST,
    { resource: 'catalog.cattle.io.app' },
    { component: () => import('./BannerComponent.vue') });

  // setting up a Global Settings page
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
}
