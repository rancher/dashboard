import { importTypes } from '@rancher/auto-import';
import {
  IPlugin,
  ActionLocation,
  PanelLocation,
  TabLocation,
  CardLocation,
  TableColumnLocation,
  ActionOpts,
} from '@shell/core/types';

// Init the package
export default function(plugin: IPlugin) {
  // Auto-import model, detail, edit from the folders
  importTypes(plugin);

  // Provide plugin metadata from package.json
  plugin.metadata = require('./package.json');

  // Load a product
  // plugin.addProduct(require('./product'));

  // HEADER ACTION - GLOBAL
  plugin.addAction(
    ActionLocation.HEADER,
    {},
    {
      tooltipKey: 'plugin-examples.header-action-one',
      tooltip:    'Test Action1',
      shortcut:   'm',
      icon:       'icon-pipeline',
      invoke(opts: any, resources: any) {
        console.log('action executed 1', this); // eslint-disable-line no-console
        console.log(opts); // eslint-disable-line no-console
        console.log(resources); // eslint-disable-line no-console
      }
    }
  );

  // HEADER ACTION - BOUND TO A PRODUCT
  plugin.addAction(
    ActionLocation.HEADER,
    { product: 'explorer' },
    {
      tooltipKey: 'plugin-examples.header-action-two',
      tooltip:    'Test Action2',
      shortcut:   { windows: ['ctrl', 'b'], mac: ['meta', 'b'] },
      svg:        require('@pkg/test-features/icons/rancher-desktop.svg'),
      enabled(ctx: any) {
        return true;
      },
      invoke(opts: any, resources: any) {
        console.log('action executed 2', this); // eslint-disable-line no-console
        console.log(opts); // eslint-disable-line no-console
        console.log(resources); // eslint-disable-line no-console
      }
    }
  );

  // ADDS TAB TO "ResourceTabs" COMPONENT
  plugin.addTab(
    TabLocation.RESOURCE_DETAIL,
    { resource: 'pod' },
    {
      name:       'some-name',
      labelKey:   'plugin-examples.tab-label',
      label:      'some-label',
      weight:     -5,
      showHeader: true,
      tooltip:    'this is a tooltip message',
      component:  () => import('./MyTabComponent.vue')
    }
  );

  // We shouldn't have to do this

  // TABLE ACTIONS - divider
  // plugin.addAction(
  //   ActionLocation.TABLE,
  //   { resource: 'catalog.cattle.io.clusterrepo' },
  //   { divider: true }); // renders a divider instead of an actual action

  // TABLE ACTIONS - ROW ACTION
  plugin.addAction(
    ActionLocation.TABLE,
    'catalog.cattle.io.clusterrepo',
    {
      label:    'some-extension-action',
      labelKey: 'plugin-examples.table-action-one',
      icon:     'icon-pipeline',
      invoke(opts: ActionOpts, values: any[]) {
        console.log('table action executed 1', this, opts, values); // eslint-disable-line no-console
      }
    }
  );

  // TABLE ACTIONS - ROW + BULKABLE
  plugin.addAction(
    ActionLocation.TABLE,
    { resource: 'catalog.cattle.io.clusterrepo' },
    {
      label:    'some-bulkable-action',
      labelKey: 'plugin-examples.table-action-two',
      svg:      require('@pkg/test-features/icons/rancher-desktop.svg'),
      multiple: true,
      invoke(opts: ActionOpts, values: any[]) {
        console.log('table action executed 2', this); // eslint-disable-line no-console
        console.log(opts); // eslint-disable-line no-console
        console.log(values); // eslint-disable-line no-console
      },
    }
  );

  // DETAILS VIEW MASTHEAD DATA
  plugin.addPanel(
    PanelLocation.DETAILS_MASTHEAD,
    'catalog.cattle.io.clusterrepo',
    { component: () => import('./MastheadDetailsComponent.vue') }); // component to be rendered

  // DETAILS VIEW MASTHEAD DATA - CONFIG VIEW
  plugin.addPanel(
    PanelLocation.DETAILS_MASTHEAD,
    { resource: 'catalog.cattle.io.clusterrepo', mode: 'config' },
    { component: () => import('./MastheadDetailsComponentConfig.vue') }); // component to be rendered

  // DETAILS VIEW MASTHEAD DATA - EDIT VIEW
  plugin.addPanel(
    PanelLocation.DETAILS_MASTHEAD,
    { resource: 'catalog.cattle.io.clusterrepo', mode: 'edit' },
    { component: () => import('./MastheadDetailsComponentEdit.vue') }); // component to be rendered

  // DETAILS VIEW "DetailTop" DATA
  plugin.addPanel(
    PanelLocation.DETAIL_TOP,
    { resource: 'catalog.cattle.io.clusterrepo' },
    { component: () => import('./DetailTopComponent.vue') }); // component to be rendered

  // DATA ABOVE LIST VIEW
  plugin.addPanel(
    PanelLocation.RESOURCE_LIST,
    { resource: 'catalog.cattle.io.app' },
    { component: () => import('./BannerComponent.vue') }); // component to be rendered

  // CLUSTER DASHBOARD CARD
  plugin.addCard(
    CardLocation.CLUSTER_DASHBOARD_CARD,
    { cluster: 'local' },
    {
      label:     'some-label',
      labelKey:  'plugin-examples.card-title-one',
      component: () => import('./MastheadDetailsComponent.vue')
    }
  );

  // CLUSTER DASHBOARD CARD
  plugin.addCard(
    CardLocation.CLUSTER_DASHBOARD_CARD,
    { cluster: 'local' },
    {
      label:     'some-label1',
      labelKey:  'plugin-examples.card-title-two',
      component: () => import('./ClusterDashboardCard.vue')
    }
  );

  // CLUSTER DASHBOARD CARD
  plugin.addCard(
    CardLocation.CLUSTER_DASHBOARD_CARD,
    { cluster: 'local' },
    {
      label:     'some-label2',
      labelKey:  'plugin-examples.card-title-three',
      component: () => import('./MastheadDetailsComponent.vue')
    }
  );

  // ADD A COL TO A TABLE
  plugin.addTableColumn(
    TableColumnLocation.RESOURCE,
    'configmap',
    {
      name:     'some-prop-col',
      labelKey: 'plugin-examples.col-label',
      getValue: (row: any) => {
        return `${ row.id }-DEMO-COL-STRING-ADDED!`;
      },
    }
  );
}
