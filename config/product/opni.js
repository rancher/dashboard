import { DSL } from '@/store/type-map';
// import { LONGHORN } from '@/config/types';

export const NAME = 'opni';
export const CHART_NAME = 'opni';

export function init(store) {
  const { product, basicType, virtualType } = DSL(store, NAME);

  product({ icon: 'longhorn' });

  virtualType({
    label:      'Insights',
    namespaced: false,
    name:       'opni-insights',
    weight:     2,
    route:      { name: 'c-cluster-opni-insights' },
    exact:      true,
  });

  virtualType({
    label:      'Anomalies',
    namespaced: false,
    name:       'opni-anomalies',
    weight:     1,
    route:      { name: 'c-cluster-opni-anomalies' },
    exact:      true,
  });

  basicType(['opni-insights', 'opni-anomalies']);
}
