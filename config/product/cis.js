import { DSL } from '@/store/type-map';
import { CIS } from '@/config/types';
import { STATE, NAME as NAME_HEADER } from '@/config/table-headers';

export const NAME = 'cis';
export const CHART_NAME = 'rancher-cis-benchmark';

export function init(store) {
  const {
    product,
    basicType,
    weightType,
    formOnlyType,
    headers
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

  formOnlyType(CIS.CLUSTER_SCAN);

  headers(CIS.CLUSTER_SCAN, [
    STATE,
    NAME_HEADER,
    {
      name:          'clusterScanProfile',
      label:         'Profile',
      value:         'status.lastRunScanProfileName',
      formatter:     'Link',
      formatterOpts: { options: { internal: true }, to: { name: 'c-cluster-product-resource-id', params: { resource: CIS.CLUSTER_SCAN_PROFILE } } },
      sort:          ['status.lastRunScanProfileName'],
    },
    {
      name:   'total',
      label:  'Total',
      value:  'status.summary.total',
    },
    {
      name:   'pass',
      label:  'Pass',
      value:  'status.summary.pass',
    },
    {
      name:   'fail',
      label:  'Fail',
      value:  'status.summary.fail',
    },
    {
      name:   'skip',
      label:  'Skip',
      value:  'status.summary.skip',
    },
    {
      name:   'notApplicable',
      label:  'N/A',
      value:  'status.summary.notApplicable',
    },
    {
      name:          'lastRunTimestamp',
      label:         'Last Run',
      value:         'status.lastRunTimestamp',
      formatter:     'LiveDate',
      formatterOpts: { addSuffix: true },
      sort:          'status.lastRunTimestamp:desc',
      width:         150,
      align:         'right',
      defaultSort:   true,
    },
  ]);
}
