import { DSL } from '@shell/store/type-map';
import { COMPLIANCE } from '@shell/config/types';
import { STATE, NAME as NAME_HEADER, AGE } from '@shell/config/table-headers';

export const NAME = 'compliance';
export const CHART_NAME = 'rancher-compliance';

export function init(store) {
  const {
    product,
    basicType,
    weightType,
    configureType,
    headers
  } = DSL(store, NAME);

  product({ ifHaveGroup: /^(.*\.)*compliance\.cattle\.io$/ });

  weightType(COMPLIANCE.CLUSTER_SCAN, 3, true);
  weightType(COMPLIANCE.CLUSTER_SCAN_PROFILE, 2, true);
  weightType(COMPLIANCE.BENCHMARK, 1, true);

  basicType([
    'compliance.cattle.io.clusterscan',
    'compliance.cattle.io.clusterscanprofile',
    'compliance.cattle.io.clusterscanbenchmark',
  ]);

  configureType(COMPLIANCE.CLUSTER_SCAN, { canYaml: false, showAge: false });

  headers(COMPLIANCE.CLUSTER_SCAN, [
    STATE,
    NAME_HEADER,
    {
      name:          'clusterScanProfile',
      label:         'Profile',
      formatter:     'Link',
      formatterOpts: { options: { internal: true }, urlKey: 'scanProfileLink' },
      value:         'status.lastRunScanProfileName',
      sort:          ['status.lastRunScanProfileName'],
    },
    {
      name:      'total',
      labelKey:  'compliance.scan.total',
      value:     'status.summary.total',
      formatter: 'ScanResult'

    },
    {
      name:      'pass',
      value:     'status.summary.pass',
      labelKey:  'compliance.scan.pass',
      formatter: 'ScanResult'

    },
    {
      name:      'fail',
      labelKey:  'compliance.scan.fail',
      value:     'status.summary.fail',
      formatter: 'ScanResult'

    },
    {
      name:      'warn',
      labelKey:  'compliance.scan.warn',
      value:     'status.summary.warn',
      formatter: 'ScanResult'

    },
    {
      name:      'skip',
      labelKey:  'compliance.scan.skip',
      value:     'status.summary.skip',
      formatter: 'ScanResult'

    },
    {
      name:      'notApplicable',
      labelKey:  'compliance.scan.notApplicable',
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

  headers(COMPLIANCE.CLUSTER_SCAN_PROFILE, [
    STATE,
    NAME_HEADER,
    {
      name:          'benchmarkVersion',
      labelKey:      'compliance.benchmarkVersion',
      value:         'spec.benchmarkVersion',
      formatter:     'Link',
      formatterOpts: { options: { internal: true }, urlKey: 'benchmarkVersionLink' },
      sort:          ['spec.benchmarkVersion'],
    },
    {
      name:     'skippedTests',
      labelKey: 'compliance.testsSkipped',
      value:    'numberTestsSkipped',
      sort:     ['numberTestsSkipped']
    }
  ]);

  headers(COMPLIANCE.BENCHMARK, [
    STATE,
    NAME_HEADER,
    {
      name:     'clusterProvider',
      labelKey: 'compliance.clusterProvider',
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
