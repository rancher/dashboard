import { AGE, NAME as NAME_HEADER, NAMESPACE as NAMESPACE_HEADER, STATE } from '@shell/config/table-headers';
import { ISTIO } from '@shell/config/types';
import { DSL, IF_HAVE } from '@shell/store/type-map';

export const NAME = 'istio';
export const CHART_NAME = 'rancher-istio';

export function init(store) {
  const {
    product,
    basicType,
    virtualType,
    headers
  } = DSL(store, NAME);

  product({
    ifHaveGroup:         /^(.*\.)*istio\.io$/,
    ifHave:              IF_HAVE.NOT_V1_ISTIO,
    icon:                'istio',
    showNamespaceFilter: true,
  });

  virtualType({
    label:      'Overview',
    group:      'Root',
    namespaced: false,
    name:       'istio-overview',
    weight:     100,
    route:      { name: 'c-cluster-istio' },
    exact:      true,
    overview:   true,
  });

  basicType('istio-overview');

  basicType([
    'networking.istio.io.virtualservice',
    'networking.istio.io.gateway',
    'networking.istio.io.destinationrule',
  ]);

  basicType([
    'networking.istio.io.envoyfilter',
    'networking.istio.io.serviceentry',
    'networking.istio.io.sidecar',
    'networking.istio.io.proxyconfig',
    'networking.istio.io.workloadentry',
    'networking.istio.io.workloadgroup',
  ], 'Networking');

  basicType([
    'rbac.istio.io.clusterrbacconfig',
    'rbac.istio.io.rbacconfig',
    'rbac.istio.io.servicerolebinding',
    'rbac.istio.io.servicerole',
  ], 'RBAC');

  basicType([
    'security.istio.io.authorizationpolicy',
    'security.istio.io.peerauthentication',
    'security.istio.io.requestauthentication',
  ], 'Security');

  basicType([
    'install.istio.io.istiooperator',
    'telemetry.istio.io.telemetry',
    'extensions.istio.io.wasmplugin',
  ], 'Advanced');

  headers(ISTIO.VIRTUAL_SERVICE, [
    STATE,
    NAME_HEADER,
    NAMESPACE_HEADER,
    {
      name:      'gateways',
      label:     'Gateways',
      value:     'spec',
      formatter: 'VirtualServiceGateways'
    },
    {
      name:      'hosts',
      label:     'Hosts',
      value:     'spec.hosts',
      sort:      ['spec.hosts'],
      formatter: 'List'
    },
    AGE
  ]);
}
