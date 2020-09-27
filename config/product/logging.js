import { DSL } from '@/store/type-map';

export const NAME = 'logging';
export const CHART_NAME = 'rancher-logging';

export function init(store) {
  const {
    product,
    basicType,
    virtualType
  } = DSL(store, NAME);

  product({ ifHaveGroup: /^(.*\.)?logging\.banzaicloud\.io$/ });

  basicType([
    'logging-overview',
    'logging.banzaicloud.io.common',
    'logging.banzaicloud.io.clusterflow',
    'logging.banzaicloud.io.clusteroutput',
    'logging.banzaicloud.io.flow',
    'logging.banzaicloud.io.output',
  ]);

  virtualType({
    label:      'Overview',
    namespaced: false,
    name:       'logging-overview',
    route:      { name: 'c-cluster-logging' },
    exact:       true,
  });
}
