import { DSL } from '@/store/type-map';

export const NAME = 'fleet';
export const CHART_NAME = 'fleet';

export function init(store) {
  const {
    product,
    basicType,
    // virtualType,
    // uncreatableType,
    // immutableType,
  } = DSL(store, NAME);

  product({
    ifHaveGroup:         /^(.*\.)*fleet\.cattle\.io$/,
    icon:                'compass',
    inStore:             'management',
    removable:           false,
    weight:              3,
    showClusterSwitcher: false,
  });

  /*
  virtualType({
    label:       'Overview',
    group:      'Root',
    namespaced:  false,
    name:        'istio-overview',
    weight:      100,
    route:       { name: 'c-cluster-istio' },
    exact:       true,
  });
*/

  // basicType('istio-overview');

  // uncreatableType('fleet.cattle.io.cluster');
  // immutableType('fleet.cattle.io.cluster');

  basicType([
    'fleet.cattle.io.bundledeployment',
    'fleet.cattle.io.bundle',
    'fleet.cattle.io.cluster',
    'fleet.cattle.io.clustergroup',
    'fleet.cattle.io.clusterregistrationtoken',
    'fleet.cattle.io.gitrepo',
  ]);
}
