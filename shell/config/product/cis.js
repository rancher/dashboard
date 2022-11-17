import { DSL } from '@shell/store/type-map';
import { CIS } from '@shell/config/types';
import { STATE, NAME as NAME_HEADER, AGE } from '@shell/config/table-headers';

export const NAME = 'cis';
export const CHART_NAME = 'rancher-cis-benchmark';

export function init(store) {
  const {
    product,
    basicType,
    weightType,
    configureType,
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

  configureType(CIS.CLUSTER_SCAN, { canYaml: false, showAge: false });

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
      name:      'total',
      labelKey:  'cis.scan.total',
      value:     'status.summary.total',
      formatter: 'ScanResult'

    },
    {
      name:      'pass',
      value:     'status.summary.pass',
      labelKey:  'cis.scan.pass',
      formatter: 'ScanResult'

    },
    {
      name:      'fail',
      labelKey:  'cis.scan.fail',
      value:     'status.summary.fail',
      formatter: 'ScanResult'

    },
    {
      name:      'warn',
      labelKey:  'cis.scan.warn',
      value:     'status.summary.warn',
      formatter: 'ScanResult'

    },
    {
      name:      'skip',
      labelKey:  'cis.scan.skip',
      value:     'status.summary.skip',
      formatter: 'ScanResult'

    },
    {
      name:      'notApplicable',
      labelKey:  'cis.scan.notApplicable',
      value:     'status.summary.notApplicable',
      formatter: 'ScanResult'

    },
    {
      name:          'nextScanAt',
      label:         'Next Scan',
      value:         'status.NextScanAt',
      formatter:     'LiveDate',
      formatterOpts: { addPrefix: false },
      sort:          'status.nextScanAt:desc',
      width:         150,
      align:         'right',
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

  headers(CIS.CLUSTER_SCAN_PROFILE, [
    STATE,
    NAME_HEADER,
    {
      name:          'benchmarkVersion',
      labelKey:      'cis.benchmarkVersion',
      value:         'spec.benchmarkVersion',
      formatter:     'Link',
      formatterOpts: { options: { internal: true }, to: { name: 'c-cluster-product-resource-id', params: { resource: CIS.BENCHMARK } } },
    },
    {
      name:     'skippedTests',
      labelKey: 'cis.testsSkipped',
      value:    'numberTestsSkipped',
      sort:     ['numberTestsSkipped']
    }
  ]);

  headers(CIS.BENCHMARK, [
    STATE,
    NAME_HEADER,
    {
      name:     'clusterProvider',
      labelKey: 'cis.clusterProvider',
      value:    'spec.clusterProvider',
    },
    {
      name:        'minKubernetesVersion',
      labelKey:    'tableHeaders.minKubernetesVersion',
      value:       'spec.minKubernetesVersion',
      dashIfEmpty: true,

    },
    {
      name:        'maxKubernetesVersion',
      labelKey:    'tableHeaders.maxKubernetesVersion',
      value:       'spec.maxKubernetesVersion',
      dashIfEmpty: true,
    },
    {
      name:      'isDefault',
      labelKey:  'tableHeaders.builtIn',
      formatter: 'Checked',
      value:     'isDefault'
    },
    AGE
  ]);
}
