import { DSL, IF_HAVE } from '@shell/store/type-map';

export const NAME = 'NeuVector';
export const CHART_NAME = 'NeuVector';
export const NEU_VECTOR_NAMESPACE = 'cattle-neuvector-system';

export function init(store) {
  const { product, basicType, virtualType } = DSL(store, NAME);

  product({
    ifHaveGroup: 'neuvector.com',
    ifHave:      IF_HAVE.NEUVECTOR_NAMESPACE,
    icon:        'neuvector'
  });

  virtualType({
    label:      'Overview',
    group:      'Root',
    namespaced: false,
    name:       'neuvector-overview',
    weight:     106,
    route:      { name: 'c-cluster-neuvector' },
    exact:      true,
    overview:   true,
  });

  basicType('neuvector-overview');
}
