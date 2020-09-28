import { LOGGING } from '@/config/types';
import { DSL } from '@/store/type-map';

export const NAME = 'logging';
export const CHART_NAME = 'rancher-logging';

export function init(store) {
  const {
    product,
    basicType,
    virtualType,
    yamlOnlyDetail,
  } = DSL(store, NAME);

  product({ ifHaveGroup: /^(.*\.)?logging\.banzaicloud\.io$/ });

  basicType([
    'logging-overview',
    'logging.banzaicloud.io.common',
    LOGGING.CLUSTER_FLOW,
    LOGGING.CLUSTER_OUTPUT,
    LOGGING.FLOW,
    LOGGING.OUTPUT,
  ]);

  yamlOnlyDetail(LOGGING.FLOW);
  yamlOnlyDetail(LOGGING.CLUSTER_FLOW);

  virtualType({
    label:      'Overview',
    namespaced: false,
    name:       'logging-overview',
    route:      { name: 'c-cluster-logging' },
    exact:       true,
  });
}
