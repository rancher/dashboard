import { DSL, IF_HAVE } from '@shell/store/type-map';

// These should match the name used in routes (either for loading a product or on chart install page)
export const NAME = 'neuvector';
export const CHART_NAME = 'neuvector';

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
