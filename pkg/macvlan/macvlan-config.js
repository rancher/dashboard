import { MACVLAN_PRODUCT_NAME } from './config/macvlan-types';
import { FLAT_NETWORKS_UI_EXTENSION } from '@shell/store/features';

export function init($plugin, store) {
  const { virtualType, basicType, configureType } = $plugin.DSL(store, 'explorer');

  virtualType({
    showMenuFun(state, getters, rootState, rootGetters) {
      return !rootGetters['cluster/schemaFor'](MACVLAN_PRODUCT_NAME) && rootGetters['features/get'](FLAT_NETWORKS_UI_EXTENSION);
    },
    labelKey:   'macvlan.nav.label',
    name:       'macvlan-install',
    group:      'cluster',
    namespaced: false,
    icon:       'folder',
    route:      {
      name:   `${ MACVLAN_PRODUCT_NAME }-c-cluster-resource-install`,
      params: {
        product:  'explor',
        resource: MACVLAN_PRODUCT_NAME
      }
    },
    exact: true
  });
  configureType(MACVLAN_PRODUCT_NAME, {
    isCreatable: true,
    isEditable:  true,
    showState:   false,
  });

  basicType([MACVLAN_PRODUCT_NAME, 'macvlan-install'], 'cluster');
}
