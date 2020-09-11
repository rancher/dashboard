import { DSL } from '@/store/type-map';
import { FLEET } from '@/config/types';

import {
  AGE,
  STATE,
  NAME as NAME_COL,
} from '@/config/table-headers';

export const NAME = 'fleet';
export const CHART_NAME = 'fleet';

export function init(store) {
  const {
    product,
    basicType,
    // virtualType,
    // uncreatableType,
    // immutableType,
    headers
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

  headers(FLEET.GIT_REPO, [
    STATE,
    NAME_COL,
    {
      name:          'repo',
      labelKey:      'tableHeaders.repo',
      value:         'repoDisplay',
      sort:          'repoDisplay',
      search:        'spec.repo',
      formatter:     'Link',
      formatterOpts: {
        beforeIconKey: 'repoIcon',
        urlKey:        'spec.repo',
      },
    },
    {
      name:          'commit',
      labelKey:      'tableHeaders.commit',
      value:         'commitDisplay',
      sort:          'status.commit',
      search:        'commitDisplay',
      formatter:     'Shortened',
      formatterOpts: { longValueKey: 'status.commit' },
      width:         75,
    },
    {
      name:          'ready',
      labelKey:      'tableHeaders.ready',
      value:         'status.summary',
      sort:          false,
      search:        false,
      formatter:     'FleetSummary',
      width:         100,
    },
    'Status',
    AGE
  ]);
}
