import { DSL } from '@/store/type-map';

export const NAME = 'fleet';

export function init(store) {
  const {
    product,
    basicType,
    // virtualType,
    // uncreatableType,
    immutableType,
  } = DSL(store, NAME);

  product({
    ifHaveGroup: /^(.*\.)*fleet\.cattle\.io$/,
    icon:        'compass',
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
  immutableType('fleet.cattle.io.cluster');

  basicType([
    'fleet.cattle.io.gitrepo',
    'fleet.cattle.io.clustergroup',
    'fleet.cattle.io.cluster',
    'fleet.cattle.io.clusterregistrationtoken',
  ]);

  basicType([
    'fleet.cattle.io.bundledeployment',
    'fleet.cattle.io.bundle',
    'fleet.cattle.io.clusterregistration',
    'fleet.cattle.io.content',
    'gitjob.cattle.io.gitjob',
  ], 'More things of note?');
}
