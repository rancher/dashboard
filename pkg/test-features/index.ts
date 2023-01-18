import { importTypes } from '@rancher/auto-import';
import { IPlugin } from '@shell/core/types';
import { isMac } from '@shell/utils/platform';

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
    {
      where: 'header',
      when:  {}
    },
    {
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
      clickAction() {
        console.log('action executed 1', this); // eslint-disable-line no-console
      }
    }
  );

  // HEADER ACTION - BOUND TO A PRODUCT
  plugin.addAction(
    {
      where: 'header',
      when:  { product: 'explorer' }
    },
    {
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
      clickAction() {
        console.log('action executed 2', this); // eslint-disable-line no-console
      }
    }
  );

  // ADDS TAB TO "ResourceTabs" COMPONENT
  plugin.addTab(
    {
      where: 'resourceTabs',
      when:  { resource: 'pod' }
    },
    {
      name:       'some-name',
      labelKey:   'generic.comingSoon',
      label:      'some-label',
      weight:     -5,
      showHeader: true,
      tooltip:    'this is a tooltip message',
      component:  () => import('./MyTabComponent.vue')
    }
  );

  // TABLE ACTIONS - divider
  plugin.addAction(
    {
      where: 'table',
      when:  { resource: 'catalog.cattle.io.clusterrepo' }
    }
    ,
    { divider: true }); // renders a divider instead of an actual action

  // TABLE ACTIONS - ROW ACTION
  plugin.addAction(
    {
      where: 'table',
      when:  { resource: 'catalog.cattle.io.clusterrepo' }
    },
    {
      action:   'some-extension-action',
      label:    'some-extension-action',
      labelKey: 'generic.customize',
      icon:     'icon-pipeline',
      singleAction() {
        console.log('table action executed1', this); // eslint-disable-line no-console
      }
    }
  );

  // TABLE ACTIONS - ROW + BULKABLE
  plugin.addAction(
    {
      where: 'table',
      when:  { resource: 'catalog.cattle.io.clusterrepo' }
    },
    {
      action:   'some-bulkable-action',
      label:    'some-bulkable-action',
      labelKey: 'generic.comingSoon',
      icon:     'icon-pipeline',
      singleAction() {
        console.log('table action executed2', this); // eslint-disable-line no-console
      },
      bulkAction(args: any) {
        console.log('bulk table action executed', this, args); // eslint-disable-line no-console
      }
    }
  );

  // DETAILS VIEW MASTHEAD DATA
  plugin.addPanel(
    {
      where: 'detailsMasthead',
      when:  { resource: 'catalog.cattle.io.clusterrepo' }
    },
    { component: () => import('./MastheadDetailsComponent.vue') }); // component to be rendered

  // DETAILS VIEW MASTHEAD DATA - CONFIG VIEW
  plugin.addPanel(
    {
      where: 'detailsMasthead',
      when:  { resource: 'catalog.cattle.io.clusterrepo', mode: 'config' }
    },
    { component: () => import('./MastheadDetailsComponentConfig.vue') }); // component to be rendered

  // DETAILS VIEW MASTHEAD DATA - EDIT VIEW
  plugin.addPanel(
    {
      where: 'detailsMasthead',
      when:  { resource: 'catalog.cattle.io.clusterrepo', mode: 'edit' }
    },
    { component: () => import('./MastheadDetailsComponentEdit.vue') }); // component to be rendered

  // DETAILS VIEW "DetailTop" DATA
  plugin.addPanel(
    {
      where: 'detailTop',
      when:  { resource: 'catalog.cattle.io.clusterrepo' }
    },
    { component: () => import('./DetailTopComponent.vue') }); // component to be rendered

  // DATA ABOVE LIST VIEW
  plugin.addPanel(
    {
      where: 'listView',
      when:  { resource: 'catalog.cattle.io.app' }
    },
    { component: () => import('./BannerComponent.vue') }); // component to be rendered

  // CLUSTER DASHBOARD CARD
  plugin.addCard(
    {
      where: 'clusterDashboard',
      when:  { cluster: 'local' }
    },
    {
      label:     'some-label',
      labelKey:  'generic.comingSoon',
      component: () => import('./MastheadDetailsComponent.vue')
    }
  );

  // CLUSTER DASHBOARD CARD
  plugin.addCard(
    {
      where: 'clusterDashboard',
      when:  { cluster: 'local' }
    },
    {
      label:     'some-label1',
      labelKey:  'generic.comingSoon',
      component: () => import('./MastheadDetailsComponent.vue')
    }
  );

  // CLUSTER DASHBOARD CARD
  plugin.addCard(
    {
      where: 'clusterDashboard',
      when:  { cluster: 'local' }
    },
    {
      label:     'some-label2',
      labelKey:  'generic.comingSoon',
      component: () => import('./MastheadDetailsComponent.vue')
    }
  );

  // CLUSTER DASHBOARD CARD
  plugin.addCard(
    {
      where: 'clusterDashboard',
      when:  { cluster: 'local' }
    },
    {
      label:     'some-label3',
      labelKey:  'generic.comingSoon',
      component: () => import('./MastheadDetailsComponent.vue')
    }
  );

  // ADD A COL TO A TABLE
  plugin.addTableColumn(
    {
      where: 'listView',
      when:  { resource: 'configmap' }
    },
    {
      name:     'some-prop-col',
      labelKey: 'generic.comingSoon',
      getValue: (row: any) => {
        return `${ row.id }-THIS-IS-A-DEMO-COL-VALUE!`;
      },
    }
  );
}
