export const PRODUCT_NAME = 'imagerepo';

export function init($plugin, store) {
  const { virtualType, basicType } = $plugin.DSL(store, 'manager');

  virtualType({
    label:      'Configuration',
    labelKey:   'nav.imageRepo.config',
    name:       'image-repo-config',
    group:      'Root',
    namespaced: false,
    icon:       'globe',
    route:      {
      name:   `${ PRODUCT_NAME }-c-cluster-manager-config`,
      params: {
        cluster: 'local', product: 'manager', resource: 'provisioning.cattle.io.cluster'
      }
    },
    exact:  false,
    weight: 100,
  });

  virtualType({
    showMenuFun(state, getters, rootState, rootGetters) {
      return rootState.auth?.isAdmin || rootState.auth?.me?.annotations?.['management.harbor.pandaria.io/synccomplete'] === 'true';
    },
    label:      'Image Management',
    labelKey:   'nav.imageRepo.projects',
    name:       'image-repo-projects',
    group:      'Root',
    namespaced: false,
    icon:       'globe',
    route:      {
      name:   `${ PRODUCT_NAME }-c-cluster-manager-project`,
      path:   '/:product/c/:cluster/manager/project',
      params: { cluster: 'local' }
    },
    exact:  false,
    weight: 99,
  });

  virtualType({
    showMenuFun(state, getters, rootState, rootGetters) {
      return rootState.auth?.isAdmin || rootState.auth?.me?.annotations?.['management.harbor.pandaria.io/synccomplete'] === 'true';
    },
    label:      'Logs',
    labelKey:   'nav.imageRepo.logs',
    name:       'image-repo-logs',
    group:      'Root',
    namespaced: false,
    icon:       'globe',
    route:      {
      name:   `${ PRODUCT_NAME }-c-cluster-manager-log`,
      path:   '/:product/c/:cluster/manager/log',
      params: { cluster: 'local' }
    },
    exact:  false,
    weight: 98,
  });

  basicType([
    'image-repo-config',
    'image-repo-projects',
    'image-repo-logs',
  ], 'imageRepo');
}
