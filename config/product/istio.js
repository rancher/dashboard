import { DSL } from '@/store/type-map';

export const NAME = 'istio';

export function init(store) {
  const {
    product,
    basicType,
    virtualType,
  } = DSL(store, NAME);

  product({
    ifHaveGroup: /^(.*\.)*istio\.io$/,
    icon:        'istio',
  });

  virtualType({
    label:       'Overview',
    group:      'Root',
    namespaced:  false,
    name:        'istio-overview',
    weight:      100,
    route:       { name: 'c-cluster-istio' },
    exact:       true,
  });

  basicType('istio-overview');

  basicType([
    'networking.istio.io.destinationrule',
    'networking.istio.io.envoyfilter',
    'networking.istio.io.gateway',
    'networking.istio.io.serviceentrie',
    'networking.istio.io.sidecar',
    'networking.istio.io.virtualservice',
    'networking.istio.io.workloadentrie',
  ], 'Networking');

  basicType([
    'rbac.istio.io.clusterrbacconfig',
    'rbac.istio.io.rbacconfig',
    'rbac.istio.io.servicerolebinding',
    'rbac.istio.io.servicerole',
  ], 'RBAC');

  basicType([
    'security.istio.io.authorizationpolicie',
    'security.istio.io.peerauthentication',
    'security.istio.io.requestauthentication',
  ], 'Security');
}
