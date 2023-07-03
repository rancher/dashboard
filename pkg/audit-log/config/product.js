import { IF_HAVE } from '@shell/store/type-map';
import { AUDIT_LOG_UI_EXTENSION } from '@shell/store/features';

export function init($plugin, store) {
  const MANAGER_RESOURCE_NAME = 'global-audit-log-extension';
  const EXPLORER_RESOURCE_NAME = 'cluster-audit-log-extension';

  const { virtualType: managerVirtualType, basicType: managerBasicType } = $plugin.DSL(store, 'manager');
  const { virtualType: explorerVirtualType, basicType: explorerBasicType } = $plugin.DSL(store, 'explorer');

  // global audit log start
  managerVirtualType({
    showMenuFun(state, getters, rootState, rootGetters) {
      return rootGetters['features/get'](AUDIT_LOG_UI_EXTENSION);
    },
    ifHave:     IF_HAVE.ADMIN,
    labelKey:   'auditLog.title',
    name:       MANAGER_RESOURCE_NAME,
    group:      'Root',
    namespaced: false,
    icon:       'globe',
    route:      {
      name:   'c-cluster-manager-globalAuditLog',
      params: {
        cluster: '_', resource: MANAGER_RESOURCE_NAME, product: 'manager'
      }
    },
    exact: false
  });

  managerBasicType([
    MANAGER_RESOURCE_NAME,
  ]);

  // global audit log end

  // cluster audit-log start
  explorerVirtualType({
    showMenuFun(state, getters, rootState, rootGetters) {
      return rootGetters['features/get'](AUDIT_LOG_UI_EXTENSION);
    },
    labelKey:         'auditLog.title',
    group:            'cluster',
    icon:             'globe',
    namespaced:       false,
    ifRancherCluster: true,
    name:             EXPLORER_RESOURCE_NAME,
    weight:           98,
    route:            { name: 'c-cluster-auditLog', params: { product: 'explorer' } },
    exact:            true,
  });

  explorerBasicType([EXPLORER_RESOURCE_NAME], 'cluster');
  // cluster audit-log end
}
