import { get } from '@shell/utils/object';

/**
 * Return list of variables to filter chart questions
 */
export const ignoreVariables = (cluster, data) => {
  const pspChartMap = {
    epinio:                     'global.rbac.pspEnabled',
    longhorn:                   'enablePSP',
    'rancher-alerting-drivers': 'global.cattle.psp.enabled',
    neuvector:                  'global.cattle.psp.enabled',
    'prometheus-federator':     'global.rbac.pspEnabled',
  };
  const path = pspChartMap[data.chart.name];

  if (path) {
    const clusterVersion = cluster?.metadata?.annotations?.['management.cattle.io/current-cluster-controllers-version'] || '';
    const version = clusterVersion.match(/\d+/g);
    const isRequiredVersion = version?.length ? +version[0] === 1 && +version[1] < 25 : false;
    const hasPsp = get(data.values, path);

    // Provide path as question variable to be ignored
    if (!isRequiredVersion && !hasPsp) {
      return [path];
    }
  }

  return [];
};
