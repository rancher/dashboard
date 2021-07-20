import { DSL } from '@/store/type-map';
// import { LONGHORN } from '@/config/types';

export const NAME = 'opni';
export const CHART_NAME = 'opni';

export function init(store) {
  const { product, basicType, virtualType } = DSL(store, NAME);

  product({ icon: 'longhorn' });

  virtualType({
    label:      'Overview',
    group:      'Root',
    namespaced: false,
    name:       'opni-overview',
    weight:     105,
    route:      { name: 'c-cluster-opni' },
    exact:      true,
    overview:   true,
  });

  basicType('opni-overview');
}
