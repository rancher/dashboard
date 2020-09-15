import { DSL } from '@/store/type-map';
import { CIS } from '@/config/types';

export const NAME = 'cis';
export const CHART_NAME = 'rancher-cis-benchmark';

export function init(store) {
  const {
    product,
    basicType,
    weightType,
  } = DSL(store, NAME);

  product({
    ifHaveGroup: /^(.*\.)*cis\.cattle\.io$/,
    icon:        'cis',
  });

  weightType(CIS.CLUSTER_SCAN, 3, true);
  weightType(CIS.CLUSTER_SCAN_PROFILE, 2, true);
  weightType(CIS.BENCHMARK, 1, true);

  basicType([
    'cis.cattle.io.clusterscan',
    'cis.cattle.io.clusterscanprofile',
    'cis.cattle.io.clusterscanbenchmark',
  ]);
}
