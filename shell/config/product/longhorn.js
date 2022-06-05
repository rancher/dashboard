import { DSL } from '@shell/store/type-map';
// import { LONGHORN } from '@shell/config/types';

export const NAME = 'longhorn';
export const CHART_NAME = 'longhorn';

export function init(store) {
  const { product, basicType, virtualType } = DSL(store, NAME);

  /*
  const {
    ENGINES,
    ENGINE_IMAGES,
    NODES,
    REPLICAS,
    SETTINGS,
    VOLUMES,
  } = LONGHORN;
*/

  product({
    ifHaveGroup: 'longhorn.io',
    icon:        'longhorn'
  });

  virtualType({
    label:      'Overview',
    group:      'Root',
    namespaced: false,
    name:       'longhorn-overview',
    weight:     105,
    route:      { name: 'c-cluster-longhorn' },
    exact:      true,
    overview:   true,
  });

  basicType('longhorn-overview');

  /*
  basicType([
    ENGINES,
    ENGINE_IMAGES,
    NODES,
    REPLICAS,
    SETTINGS,
    VOLUMES,
  ]);
*/
}
