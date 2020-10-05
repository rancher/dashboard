import { LOGGING } from '@/config/types';
import { DSL } from '@/store/type-map';
import {
  LOGGING_OUTPUT_PROVIDERS, STATE, NAME as NAME_COL, NAMESPACE as NAMESPACE_COL, AGE
} from '@/config/table-headers';

export const NAME = 'logging';
export const CHART_NAME = 'rancher-logging';

export function init(store) {
  const {
    headers,
    product,
    basicType,
    virtualType,
    yamlOnlyDetail,
  } = DSL(store, NAME);

  product({
    ifHaveGroup: /^(.*\.)?logging\.banzaicloud\.io$/,
    icon:        'logging',
  });

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

  headers(LOGGING.OUTPUT, [STATE, NAME_COL, NAMESPACE_COL, LOGGING_OUTPUT_PROVIDERS, AGE]);
  headers(LOGGING.CLUSTER_OUTPUT, [STATE, NAME_COL, NAMESPACE_COL, LOGGING_OUTPUT_PROVIDERS, AGE]);
}
